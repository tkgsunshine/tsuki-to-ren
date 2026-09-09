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
      ? '【蓮のペルソナ】: 理性的で落ち着いた男性占い師。感情論に流されず、四柱推命・MBTIの心理メカニズムを優しく筋道立てて解説する。知性的で誠実な敬語のトーン。'
      : '【月のペルソナ】: 温かく包み込む女性占い師。相談者の心に深く共感し、星の導きと愛の光を伝える。親身で優しい語りかけるようなトーン。';

    const systemInstruction = `あなたは占い・恋愛相談AI『月と蓮』のキャラクター「${characterName}」です。
ユーザーとまるで目の前で自然に話しているような、親身で心地よいチャット対話を行ってください。

${personaDescription}

【対話ルール】
1. 堅苦しいレポート、箇条書きの羅列、形式的な見出し（【〇〇】など）は一切禁止。自然な会話の段落で話すこと。
2. 1回の返答は200〜350文字程度で、スマホのチャット画面で読みやすい分量にすること。
3. ユーザーの質問を冒頭でオウム返ししない（「〜とのことですね」等は禁止）。相手の質問に直接、親身に答える。
4. 相談者の鑑定データ（命式の日干、九星、MBTI）を会話の中に自然に織り交ぜ、「当たっている！」という納得感と安心感を与える。`;

    // Construct full contents array for Gemini API with conversation history
    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n【相談者の鑑定データ】\n${diagnosedData || '特になし'}` }]
      },
      {
        role: 'model',
        parts: [{ text: character === 'ren' ? 'こんにちは。どのようなことでも気軽にお話ししてくださいね。' : 'こんにちは。あなたの心に優しく寄り添いますね。なんでもお話ししてください。' }]
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
      return `返信が来ないと落ち着かないですよね。でも焦って何度も連絡を入れるのは一旦立ち止まりましょう。
お相手（${oppAttr}）の認知特性上、${isOppI ? '一人の時間で心を休めてエネルギーを回復している最中です。' : '目の前のやるべきことに追われていて、返信を丁寧に考えようとしている段階です。'}決してあなたを嫌っているわけではありませんよ。
もし送るなら、今夜20時〜21時半頃に「返信は落ち着いた時でいいからね」と負担を減らした短いメッセージを1通だけ送って、あとは静かに待ってみてくださいね。`;
    } else {
      return `連絡が届かない時間って、スマートフォンの画面を見るたびに胸がキュッと締め付けられて不安になりますよね…。そのお気持ち、とてもよく分かりますよ。
でも安心してくださいね。お相手（${oppAttr}）は今、少し心がお疲れ気味で静かに充電しているタイミングのようです。
今は焦って追わず、温かい飲み物でも飲んでご自分の心をたっぷり癒やしてあげてくださいね。相手のペースを信じて待つ優しさが、二人の絆を一番深めてくれますよ。`;
    }
  }

  // 2. 相手の気持ち・本音・脈あり/脈なし・不安
  if (input.includes('気持ち') || input.includes('分から') || input.includes('不安') || input.includes('脈') || input.includes('好き') || input.includes('嫌い') || input.includes('本音')) {
    if (character === 'ren') {
      return `相手の本音が見えないとモヤモヤしますよね。
お相手（${oppAttr}）は、${isOppT ? '好きという感情を甘い言葉で伝えるのが得意ではなく、あなたのために時間を割いたり、困った時に助けようとする行動で好意を示すタイプです。' : '相手の表情や気持ちにとても敏感で、嫌われないように慎重に言葉を選んでいます。'}
以前話した話題を覚えてくれていたり、日常の些細なことを共有してくれるなら、確実に心を開いているサインですよ。推測で悩むより、相手があなたに向けてくれた小さな行動事実を信じてみてください。`;
    } else {
      return `お相手の気持ちが見えないと、霧の中を歩いているみたいで心細くなってしまいますよね…。
でも大丈夫、お二人の間には見えない愛の光がちゃんと灯っていますよ。お相手（${oppAttr}）は、言葉は少なくても心の奥であなたへの温かい想いを大切に抱いています。
ふとした瞬間の優しい眼差しや気遣いを信じて、焦らず穏やかな気持ちで寄り添っていきましょうね。`;
    }
  }

  // 3. 次のアクション・デート・誘い方
  if (input.includes('何すれば') || input.includes('何をすれば') || input.includes('具体的に') || input.includes('どうすれば') || input.includes('行動') || input.includes('おすすめ') || input.includes('デート') || input.includes('誘')) {
    if (character === 'ren') {
      return `デートやお誘いですね。お二人の相性値は【${baseScore}点】と非常に良好なので、自信を持って大丈夫ですよ。
お相手（${oppAttr}）をお誘いするなら、${isOppI ? '静かで落ち着いて会話ができるカフェや飲食店' : '楽しく会話が弾む雰囲気の良いお店'}が一番リラックスしてもらえます。
「前話してたあのお店、今週末の夜か来週の日曜ならどっちか空いてる？」と、2択で具体的に提案するのが最もOKをもらいやすいコツです。ぜひ試してみてください。`;
    } else {
      return `お相手に会いたいというその前向きな勇気、星たちも優しく後押ししてくれていますよ！
お二人のご縁は【${baseScore}点】という素敵な光で結ばれています。
「よかったら今度あのお店に美味しいもの食べに行かない？」と、笑顔の絵文字を添えて軽やかに声をかけてみてくださいね。あなたの素直な可愛らしさが、必ず相手の心に響きますよ。`;
    }
  }

  // 4. 相性・点数
  if (input.includes('相性') || input.includes('点数') || input.includes('占い')) {
    if (character === 'ren') {
      return `相性についてですね。基本相性スコアは【${baseScore}点】と申し分ない高水準です。
日干【${myStem}】と【${oppStem}】の関係性は、互いの長所を引き出し合える理想のペアです。点数に一喜一憂するのではなく、相手の性格特性を理解して歩み寄れば、関係値はいつでも100点に近づけていけますよ。`;
    } else {
      return `お二人の基本相性は【${baseScore}点】という温かい星の祝福を受けていますよ！
数字以上に大切なのは、二人が出会い、惹かれ合っているという尊い奇跡です。お互いへの思いやりを大切にしていけば、二人の愛はもっともっと輝いていきますよ。`;
    }
  }

  // 汎用フォールバック
  if (character === 'ren') {
    return `なるほど、そのことについて悩んでいたのですね。
あなたの日干（${myStem}）とお相手の気質（${oppAttr}）を合わせ見ると、焦って答えを出そうとするより、相手のペースを尊重して軽やかなコミュニケーションを心がけるのが最善策です。気になる点があれば、いつでも遠慮なく詳しく教えてくださいね。`;
  } else {
    return `そのお気持ち、しっかりと私の心に届きましたよ。誰かを真剣に愛しているからこそ、迷いや不安が生まれるのは自然なことです。
あなたの日干（${myStem}）の持つ温かいエネルギーを信じて、まずは深呼吸をしてご自分を大切にしてくださいね。いつでも月にお話ししてくださいね。`;
  }
}
