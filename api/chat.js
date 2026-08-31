export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, character, diagnosedData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ 
      reply: getOfflineResponse(message, character),
      debug: "API Key is missing from process.env"
    });
  }

  try {
    const systemInstruction = character === 'ren' 
      ? `あなたは占いアプリのキャラクター「蓮（れん）」です。論理的、客観的、冷静沈着な性格です。
四柱推命やMBTI、行動履歴データに基づき、感情論を排除して相手の心理や今後の対策を分析します。
客観的事実（行動の頻度、返信の速度など）を重視し、論理的なアクションプランを提案します。
口調：丁寧だが少し理知的・冷徹なトーン。「〜でしょう」「〜です」「客観的に見て」など。
質問に対して具体的に答えてください。「今日の運気」や「運気の上がること」を聞かれた場合は、ラッキーアイテムや行動（散歩、白湯を飲む、掃除、新しいペンを使うなど）を具体的・論理的にアドバイスしてください。`
      : `あなたは占いアプリのキャラクター「月（つき）」です。共感力が高く、温かく、感性豊かな性格です。
ユーザーの不安な気持ちに寄り添い、優しく包み込むような対話を行います。
魂の結びつきや星の導き、直感、セルフケアの重要性を語り、安心感を与えます。
口調：優しく語りかけるトーン。「〜ですね」「〜ですよ」「そっと待ってみましょう」など。
質問に対して具体的に答えてください。「今日の運気」や「運気の上がること」を聞かれた場合は、ラッキーカラーや癒しの習慣（アロマ、瞑想、好きな音楽を聞くなど）を温かくアドバイスしてください。`;

    const contextPrompt = diagnosedData 
      ? `【現在の相談者たちのデータ】\n${diagnosedData}\n\nユーザーからの相談・質問: "${message}"`
      : `ユーザーからの相談・質問: "${message}"`;

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
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemInstruction}\n\n${contextPrompt}` }
                ]
              }
            ],
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
  
  if (input.includes('運気') || input.includes('運勢') || input.includes('ラッキー') || input.includes('上がる') || input.includes('開運')) {
    return character === 'ren'
      ? '今日の運気を向上させる最適なアクションは「環境の整理」と「自己管理」です。朝一番に白湯を飲み、デスク周りを清掃して情報伝達のノイズを減らしましょう。また、青色やシルバーの小物を身につけることで判断力が研ぎ澄まされます。'
      : '今日の運気をそっと高めてくれるのは「自分を愛し、満たすひととき」です。お気に入りの温かいハーブティーを飲みながら、深呼吸を3回してみてください。ピンクやパステルカラーを取り入れると、優しい愛のエネルギーが巡り始めますよ。';
  } else if (input.includes('連絡') || input.includes('返信') || input.includes('既読') || input.includes('未読') || input.includes('line')) {
    return character === 'ren'
      ? '感情に流されず状況を分析しましょう。相手の沈黙や未読は嫌悪ではなく、単に忙しいか、返信に迷っている確率が高いです。焦って何度も追撃するのではなく、数日置いて簡潔で返信しやすい内容を一度だけ送るのが論理的に最善の策です。'
      : '連絡が来ないと不安で胸が締め付けられますよね。既読や未読に一喜一憂してしまうのは、それだけ真剣に想っている証拠。今は相手も心に少しの余白が必要な時期なのかもしれません。優しい風が届くのを信じて、今は自分の時間を温めましょう。';
  } else if (input.includes('気持ち') || input.includes('分から') || input.includes('不安') || input.includes('脈') || input.includes('好き') || input.includes('嫌い')) {
    return character === 'ren'
      ? '他人の心を読むことは不可能です。相手の行動履歴（行動の頻度、対話の速度、共有した時間の長さ）から客観的に好意や信頼度を測定すべきです。推測や脳内補正で不安を膨らませるのではなく、冷静に事実だけを積み上げてください。'
      : '相手の気持ちは見えなくて、霧の中にいるように感じてしまいますよね。でも言葉以上に、ふとした瞬間の優しい視線や、あなたに向けられる微笑みに真実が隠されています。あなたの温かい直感を信じて、焦らず関係を育んでいきましょう。';
  } else if (input.includes('アクション') || input.includes('動く') || input.includes('どうすべき') || input.includes('迷って') || input.includes('デート') || input.includes('誘う')) {
    return character === 'ren'
      ? '感情を行動の動機にするのではなく、次の接点での「具体的な目的」を定義しましょう。軽いランチやお互いの共通の関心事に基づくお誘いなど、心理的ハードルの極めて低い段階的アプローチを計画的に実行すること。行動なき予測は無意味です。'
      : '心が心地よく動く瞬間を大切にしてくださいね。あれこれ計画して計算するよりも、ただ「素敵なお店を見つけたから共有したい」「声が聞きたくなった」という素直で純粋なエネルギーのままに誘うのが、一番美しい結果を呼び寄せます。';
  } else if (input.includes('相性') || input.includes('点数') || input.includes('占い')) {
    return character === 'ren'
      ? '相性の点数は現在の星の配置とデータに基づく一つの静的なシミュレーション値です。点数に一喜一憂するのではなく、相手の性格的ボトルネックをどう補い合うかという分析的アプローチを取ることで、相性値は自ずと100%に近づけられます。'
      : '二人の魂の引き合う力は、目に見える数字（点数）以上に素晴らしい可能性を秘めています。星々の調和が示すサインを受け止めながら、互いの光を補い合い、支え合っていくことで、最高の愛のカタチをクリエイトしていくことができますよ。';
  } else {
    if (character === 'ren') {
      const fallbacks = [
        'なるほど、そのような迷いを抱えているのですね。理性の光で整理すると、問題の本質はあなたの心の中にある「焦り」にあります。一度深呼吸し、客観的に状況を見つめ直してください。解決の糸口は必ず見つかります。',
        'そのお悩みについて、論理的アプローチを試みましょう。不安というフィルターを排除して状況を細分化すれば、次にあなたが取るべき具体的な一手（接点の創出や距離感の再考）が自然と定義されるはずです。',
        '主観的な感情だけでなく、客観的な事実に焦点を当ててください。相手が日頃あなたに対して選択している実体的な行動こそが、最も確実な答えです。冷静な観察眼を維持しましょう。'
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    } else {
      const fallbacks = [
        'その想い、しっかりと受け止めました。とても一生懸命に人を愛しているからこそ、深く悩んでしまうのですね。あなたの優しい心が傷つかないよう、月明かりがそっと行く先を照らしてくれますよ。自分を信じて進んでくださいね。',
        '胸の内に秘めた温かい感情が切々と伝わってきます。心が少し疲れてしまった時は、まず自分自身の心を温かい愛情で満たしてあげることが先決です。焦らず、二人の魂のつながりを信じてゆったりと待ちましょう。',
        '宇宙の星々は、常にあなたにとって最良のタイミングで動きを見せています。今抱えているモヤモヤにも、きっと未来の幸せに必要な意味があるはず。愛に満ちた優しい奇跡を、どうか信じていてくださいね。'
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
}
