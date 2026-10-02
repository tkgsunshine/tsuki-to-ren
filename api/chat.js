import Anthropic from '@anthropic-ai/sdk';

// 使用モデルは環境変数 ANTHROPIC_MODEL で切り替え可能（未設定時は claude-opus-5-5）
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

// Claude API は user/assistant が交互で、先頭が user である必要があるため整形する
function buildMessages(history, message) {
  const turns = [];
  if (Array.isArray(history)) {
    for (const item of history) {
      if (item && typeof item.text === 'string' && item.text.trim()) {
        turns.push({ role: item.role === 'user' ? 'user' : 'assistant', content: item.text });
      }
    }
  }
  turns.push({ role: 'user', content: String(message ?? '') });

  const merged = [];
  for (const t of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) {
      last.content += `\n\n${t.content}`;
    } else {
      merged.push({ ...t });
    }
  }
  while (merged.length && merged[0].role !== 'user') merged.shift();
  return merged;
}

const ALLOWED_HOSTS = ['tsuki-to-ren.com', 'www.tsuki-to-ren.com'];
const MAX_MESSAGE = 500;
const MAX_DIAGNOSED = 2000;
const MAX_HISTORY = 10;
const MAX_HISTORY_TEXT = 500;
const RATE_LIMIT = 20; // requests per IP per minute (best effort, per serverless instance)
const hits = new Map();

function isAllowedOrigin(req) {
  const src = req.headers.origin || req.headers.referer || '';
  if (!src) return false;
  try {
    const host = new URL(src).hostname;
    return ALLOWED_HOSTS.includes(host) || host.endsWith('.vercel.app') || host === 'localhost';
  } catch (e) {
    return false;
  }
}

function rateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (rateLimited(req)) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE) : '';
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  const character = body.character === 'ren' ? 'ren' : 'tsuki';
  const diagnosedData = typeof body.diagnosedData === 'string' ? body.diagnosedData.slice(0, MAX_DIAGNOSED) : '';
  const history = Array.isArray(body.history)
    ? body.history.slice(-MAX_HISTORY).map(h => ({
        role: h && h.role === 'user' ? 'user' : 'model',
        text: typeof (h && h.text) === 'string' ? h.text.slice(0, MAX_HISTORY_TEXT) : ''
      }))
    : [];
  const apiKey = process.env.ANTHROPIC_API_KEY;

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
4. 相談者の鑑定データ（命式の日干、九星、MBTI）を会話の中に自然に織り交ぜ、「当たっている！」という納得感と安心感を与える。
5. 出力はプレーンテキストのみ。Markdownの記法（**太字**、#見出し、- 箇条書き、バッククォート）は画面にそのまま表示されてしまうため、一切使わない。

【相談者の鑑定データ】
${diagnosedData || '特になし'}`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: systemInstruction,
      output_config: { effort: 'low' },
      messages: buildMessages(history, message),
    });

    if (response.stop_reason === 'refusal') {
      throw new Error('Claude declined the request (refusal)');
    }

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!reply) {
      throw new Error('Empty response from Claude');
    }

    return res.status(200).json({
      reply,
      debug: `Success calling ${response.model}`
    });
  } catch (err) {
    console.error('Claude API Error:', err);
    return res.status(200).json({ 
      reply: getOfflineResponse(message, character, diagnosedData),
      debug: 'Error'
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
