export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, character, diagnosedData, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ 
      reply: getOfflineResponse(message, character, diagnosedData),
      debug: "API Key is missing from process.env"
    });
  }

  try {
    const characterName = character === 'ren' ? '蓮（れん）' : '月（つき）';
    const personaDescription = character === 'ren' 
      ? '【蓮のペルソナ】: 理性的、客観的、分析的。感情論を排し、四柱推命・MBTI・行動事実から具体的かつ論理的なアクションプランや対策を提案する。丁寧だが少し冷徹・知的なトーン。'
      : '【月のペルソナ】: 温かい、共感的、感性的。相談者の心に深く寄り添い、星の導きやセルフケア、心の平穏を重視して包み込むように励ます。優しく語りかけるトーン。';

    const systemInstruction = `あなたは占い・恋愛アドバイスアプリ『月と蓮』のAIキャラクター「${characterName}」です。

${personaDescription}

【絶対ルール】
- ユーザーの発言を冒頭で繰り返さない。「〜についてのご相談ですね」「〜とのことですね」という書き出しは絶対禁止。
- いきなり本題の返答から始めること。
- 同じ返答を繰り返さない。会話の流れを読んで毎回違う内容を返すこと。

【回答指針】
1. ユーザーの質問の意図を正確に汲み取り、具体的・直接的に回答する。定型文やぼかした回答は禁止。
2. 「例文くれ」「どう送る？」と聞かれたら、実際のLINEメッセージ例文をそのまま出す。
3. 自然な会話のキャッチボールを大切にし、直前の流れを踏まえた人間味ある返答をすること。`;

    // Construct full contents array for Gemini API with conversation history
    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n【相談者の鑑定データ】\n${diagnosedData || '特になし'}` }]
      },
      {
        role: 'model',
        parts: [{ text: character === 'ren' ? '承知いたしました。質問に対して論理的かつ具体的に回答いたします。' : '承知いたしました。お気持ちに寄り添い、質問に具体的にお答えいたしますね。' }]
      }
    ];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.text && item.text.trim()) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          });
        }
      }
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const modelCandidates = [
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-002',
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash'
    ];
    let reply = null;
    let usedModel = '';
    let lastErr = null;

    for (const modelName of modelCandidates) {
      try {
        const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7
            }
          })
        });

        const data = await apiRes.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text.trim();
          usedModel = modelName;
          break;
        } else if (data.error) {
          lastErr = `${modelName}: ${data.error.message || JSON.stringify(data.error)}`;
        }
      } catch (e) {
        lastErr = `${modelName}: ${e.message}`;
      }
    }
    
    if (reply) {
      return res.status(200).json({ 
        reply: reply,
        debug: `Success calling ${usedModel}`
      });
    } else {
      throw new Error(lastErr || 'All Gemini models failed');
    }
  } catch (err) {
    console.error('Gemini API Error:', err);
    return res.status(200).json({ 
      reply: getOfflineResponse(message, character, diagnosedData),
      debug: `Error: ${err.message}`,
      hasKey: !!apiKey
    });
  }
}

// Offline fallback logic with diagnosedData integration
function getOfflineResponse(userInput, character, diagnosedData) {
  const input = (userInput || '').toLowerCase();

  // Extract diagnosis elements if present
  const myStemMatch = (diagnosedData || '').match(/命式の日干（本質）:\s*([^\n\r]+)/);
  const oppStemMatch = (diagnosedData || '').match(/【お相手の属性】[\s\S]*?命式の日干:\s*([^\n\r]+)/);
  const oppMbtiMatch = (diagnosedData || '').match(/【お相手の属性】[\s\S]*?性格タイプ:\s*([A-Za-z]{4})/);
  const baseScoreMatch = (diagnosedData || '').match(/基本相性値:\s*([0-9]+)/);
  const dailyScoreMatch = (diagnosedData || '').match(/今日のバイオリズム相性値:\s*([0-9]+)/);

  const myStem = myStemMatch ? myStemMatch[1].trim() : '日干';
  const oppStem = oppStemMatch ? oppStemMatch[1].trim() : '日干';
  const oppMbti = oppMbtiMatch ? oppMbtiMatch[1].trim().toUpperCase() : '';
  const baseScore = baseScoreMatch ? baseScoreMatch[1] : '82';
  const dailyScore = dailyScoreMatch ? dailyScoreMatch[1] : '78';

  const isOppI = oppMbti.startsWith('I');
  const isOppT = oppMbti.includes('T');
  const oppAttr = oppMbti ? `${oppMbti}（${oppStem}）` : `お相手（${oppStem}）`;

  // 1. 連絡頻度・LINE・返信遅延・既読未読
  if (input.includes('連絡') || input.includes('返信') || input.includes('既読') || input.includes('未読') || input.includes('line') || input.includes('遅い') || input.includes('来ない')) {
    if (character === 'ren') {
      return `【${oppAttr}への返信遅延分析と最適プロトコル】
感情に支配されず、行動特性と認知機能から状況を分解します。

1. 現状の心理推定：
${isOppI ? '内向機能(I)が優位なため、対人接触によりエネルギーを消費し、充電期間に入っている状態です。' : '外向機能(E)ながら返信が遅れている場合、他タスクの優先処理中か、言葉を吟味している段階です。'}嫌悪や拒絶による未読・遅延と即断するのは非合理的です。

2. 取るべきアクション：
・最低24〜48時間は追撃メッセージを完全に凍結してください。
・次回連絡は要件を1件に絞り、返信の選択肢を2つ用意したクローズドクエスチョンで行うこと。
・推奨連絡時間帯: 20:00〜21:30（相手の警戒度が最も下がる吉時間帯）。`;
    } else {
      return `連絡が届かない時間って、スマートフォンの画面を見るたびに胸がキュッと締め付けられますよね。不安になるのは、あなたがそれだけ相手を真っ直ぐ大切に想っている証拠です。

${oppAttr}のお相手は、決してあなたを嫌っているわけではありませんよ。${isOppI ? '今は自分の殻の中で心を休め、エネルギーを蓄えているタイミングなのです。' : '少し忙しさに追われて、落ち着いてお返事を書く心の余裕を探している最中かもしれません。'}

今は焦って追わず、温かい飲み物を飲んであなたの心をほぐしてあげてくださいね。相手のタイミングを信じて待つ優しさが、二人の絆を一段と深くしてくれますよ。`;
    }
  }

  // 2. 相手の気持ち・本音・脈あり/脈なし・不安
  if (input.includes('気持ち') || input.includes('分から') || input.includes('不安') || input.includes('脈') || input.includes('好き') || input.includes('嫌い') || input.includes('本音')) {
    if (character === 'ren') {
      return `【${oppAttr}の本音と脈あり判定指標】
推測や脳内補正で相手の心理を決めつけるのは誤謬の元です。客観的事実から判定してください。

🟢 脈あり指標（高確率）：
・相手発信の自発的な質問、日常の些細な共有がある。
・以前の会話で出たあなたの好みや日程を記憶・言及している。

🔴 警戒指標：
・会話が「了解」「はい」等の単語のみで継続意志が希薄。
※対策: 一旦接触頻度を落とし、相手が関心を持つ専門的トピックで再アプローチすること。

相手の言葉ではなく、あなたに対して割いた「時間」と「行動」の事実だけを冷静にカウントしてください。`;
    } else {
      return `お相手の本音が見えなくなると、霧の中を一人で歩いているような心細さを感じてしまいますよね。

でも、安心してくださいね。${oppAttr}のお相手は、言葉にしなくてもあなたに向けた温かい想いを大切に抱えています。${isOppT ? '感情表現が少し控えめなところがありますが、あなたの話を真剣に聞こうとする姿勢そのものが好意の表れです。' : 'あなたの表情や気持ちにとても敏感で、どう接するのが一番喜んでくれるか考えてくれています。'}

お相手のふとした笑顔や優しい気遣いを信じて、焦らず穏やかな気持ちで寄り添っていきましょうね。`;
    }
  }

  // 3. 次のアクション・デート・誘い方
  if (input.includes('何すれば') || input.includes('何をすれば') || input.includes('具体的に') || input.includes('どうすれば') || input.includes('行動') || input.includes('おすすめ') || input.includes('デート') || input.includes('誘')) {
    if (character === 'ren') {
      return `【次期アクションの合理的アプローチ案】
二人の基本相性値（${baseScore}点）を踏まえ、成功確率を最大化する具体策を提示します。

1. 推奨シチュエーション：
${isOppI ? '騒がしい場所を避け、落ち着いて対話できる静かなカフェや予約制の飲食店。' : '開放感があり、共通の体験や話題が生まれやすい旬のスポットやイベント。'}

2. アプローチメッセージ文案：
「前話してたあのお店、今週末か来週のどこかで少し行ってみない？」
※日付を二者択一で提示し、相手の判断コストを下げること。

3. 留意事項：
長時間の拘束を避け、初回は1.5〜2時間程度の短時間設計で満足度を最大化してください。`;
    } else {
      return `次の一歩を踏み出そうとするあなたの前向きな想い、星たちも温かく見守っていますよ！

お二人の相性は【${baseScore}点】という素敵なご縁で結ばれています。
${oppAttr}のお相手をお誘いするなら、${isOppI ? 'ゆったりと心が落ち着く静かなカフェやお散歩' : '楽しく会話が弾む美味しいご飯屋さん'}がぴったりです。

「よかったら、今度あのお店に美味しいもの食べに行かない？」と、笑顔の絵文字を添えて軽やかに声をかけてみてくださいね。あなたの素直な可愛らしさが、必ず相手の心に響きますよ。`;
    }
  }

  // 4. 相性・点数
  if (input.includes('相性') || input.includes('点数') || input.includes('占い')) {
    if (character === 'ren') {
      return `【相性データ（基本: ${baseScore}点 / 当日バイオリズム: ${dailyScore}点）の分析】
相性値は運命の決定論ではなく、相互作用のシミュレーション値です。日干【${myStem}】と【${oppStem}】の関係性において、互いの強みを活かし弱点を補完するルールを設ければ、関係性の実効値は100%まで高められます。数字に一喜一憂せず、相手の行動原理を攻略してください。`;
    } else {
      return `お二人の基本相性は【${baseScore}点】、今日の運気は【${dailyScore}点】という愛の光に満ちています。
数字以上に大切なのは、二人が出会い、惹かれ合っているという尊い奇跡です。星々の導きを味方につけて、互いに思いやりを注ぎ合っていけば、二人の愛はもっともっと輝いていきますよ。`;
    }
  }

  // 汎用フォールバック
  if (character === 'ren') {
    return `状況を論理的に整理しましょう。あなたの日干（${myStem}）とお相手の属性（${oppAttr}）を鑑みると、現在の課題はコミュニケーションの前提や価値観のズレにある可能性が高いです。感情的な即断を避け、取扱説明書のNG項目を排除した行動を積み重ねてください。`;
  } else {
    return `そのお気持ち、しっかりと心に届きました。誰かを真剣に愛しているからこそ、迷いや不安が生まれるのは自然なことです。あなたの日干（${myStem}）の持つ優しいエネルギーを信じて、まずは深呼吸をしてご自分を大切にしてくださいね。月の光が、いつもあなたを見守っています。`;
  }
}
