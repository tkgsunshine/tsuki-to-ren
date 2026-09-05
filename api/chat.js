export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, character, diagnosedData, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ 
      reply: getOfflineResponse(message, character),
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
      reply: getOfflineResponse(message, character),
      debug: `Error: ${err.message}`,
      hasKey: !!apiKey
    });
  }
}

// Offline fallback logic
function getOfflineResponse(userInput, character) {
  const input = (userInput || '').toLowerCase();
  
  if (input.includes('何すれば') || input.includes('何をすれば') || input.includes('具体的に') || input.includes('どうすれば') || input.includes('行動') || input.includes('おすすめ')) {
    return character === 'ren'
      ? '本日取るべき具体的なアクションは以下の3ステップです。\n1. 身の回りのデスク整理とタスクの片付けを行い集中力を高める。\n2. 19:30〜21:00の吉時間に、相手へ短い近況報告や軽めの質問を1通のみ送る。\n3. 送信後は相手の返信速度を気にせず、自分の趣味や休息に専念する。\n感情に左右されず、この順序を守ることが最も効果的です。'
      : '今日はまず、ご自身の心を温かく満たすことから始めましょう！\n1. 好きなお茶や白湯を飲んで深呼吸する\n2. 夜の落ち着いた時間（20時〜22時）に「今日もお疲れ様♪」と短く優しいメッセージを送る\n3. 相手のペースを尊重し、焦らずゆったりとした気持ちで過ごす\nあなたの心が穏やかでいることが、素敵な引き寄せの第一歩になりますよ。';
  } else if (input.includes('連絡') || input.includes('返信') || input.includes('既読') || input.includes('未読') || input.includes('line')) {
    return character === 'ren'
      ? '感情に流されず状況を分析しましょう。相手の沈黙や未読は嫌悪ではなく、単に忙しいか、返信に迷っている確率が高いです。焦って何度も追撃するのではなく、数日置いて簡潔で返信しやすい内容を一度だけ送るのが論理的に最善の策です。'
      : '連絡が来ないと不安で胸が締め付けられますよね。既読や未読に一喜一憂してしまうのは、それだけ真剣に想っている証拠。今は相手も心に少しの余白が必要な時期なのかもしれません。優しい風が届くのを信じて、今は自分の時間を温めましょう。';
  } else if (input.includes('気持ち') || input.includes('分から') || input.includes('不安') || input.includes('脈') || input.includes('好き') || input.includes('嫌い')) {
    return character === 'ren'
      ? '他人の心を読むことは不可能です。相手の行動履歴（行動の頻度、対話の速度、共有した時間の長さ）から客観的に好意や信頼度を測定すべきです。推測や脳内補正で不安を膨らませるのではなく、冷静に事実だけを積み上げてください。'
      : '相手の気持ちは見えなくて、霧の中にいるように感じてしまいますよね。でも言葉以上に、ふとした瞬間の優しい視線や、あなたに向けられる微笑みに真実が隠されています。あなたの温かい直感を信じて、焦らず関係を育んでいきましょう。';
  } else if (input.includes('相性') || input.includes('点数') || input.includes('占い')) {
    return character === 'ren'
      ? '相性の点数は現在の星の配置とデータに基づく一つの静的なシミュレーション値です。点数に一喜一憂するのではなく、相手の性格的ボトルネックをどう補い合うかという分析的アプローチを取ることで、相性値は自ずと100%に近づけられます。'
      : '二人の魂の引き合う力は、目に見える数字（点数）以上に素晴らしい可能性を秘めています。星々の調和が示すサインを受け止めながら、互いの光を補い合い、支え合っていくことで、最高の愛のカタチをクリエイトしていくことができますよ。';
  } else {
    return character === 'ren'
      ? 'もう少し具体的に教えてもらえますか？状況を整理して、最善の一手を一緒に考えましょう。'
      : 'もう少し詳しく聞かせてもらえると、あなたの気持ちにもっと寄り添えます。どんな状況か教えてください。';
  }
}
