// 月額プレミアム会員の「今日」画面: 「〇〇さんの今日」と「今日の一歩」（2026-11-12 TAKASHI）。
// 片思いの人がいちばん気になる「お相手の今日の様子」を、お相手の生まれた日の星と今日の星の関係から読む。
// - 心のモード: 十神（今日の十干が、お相手の日干から見て何にあたるか）
// - 元気の量: 十二運（お相手の日干が、今日の十二支でどの段階にあるか）
// - 心の揺れ: 空亡・六冲（getPersonDay と同じ判定）
// 点数の計算には使わない（表示だけ）。「本当の状態がわかる」とは書かず、「星から見た傾向」として出す。
// 今日の一歩: 二人の道のり（片思い／付き合っている の5段階）と、本人が1タップで選ぶ今の状況、
// お相手の今日の波から、今日やるとよい行動を1つだけ出す。告白・プロポーズは「星が背中を押す日」と示すだけで、決めるのは本人。
import { getDayInfo, getPersonDay, getTenGod, getJuniUn, isPersonalGood, isPairSyncDate } from './fortuneEngine.ts';
import type { FortuneResult, TenGod, DayInfo, LuckPerson } from './fortuneEngine.ts';
import { toLuckPerson } from './luckyDays.ts';

// ───────── 〇〇さんの今日 ─────────

/** 十神ごとの「心のモード」の短い名前（一覧・見出し用） */
export const TEN_GOD_MOOD: Record<TenGod, string> = {
  '比肩': 'マイペースモード',
  '劫財': '負けず嫌いモード',
  '食神': 'ごきげんモード',
  '傷官': '繊細ピリピリモード',
  '偏財': '社交モード',
  '正財': '堅実モード',
  '偏官': '余裕すくなめモード',
  '正官': 'きちんとモード',
  '偏印': 'ひとり時間モード',
  '正印': 'やわらかモード'
};

/** 十二運: 元気の量（1〜5）と、お相手の今日の様子。読み仮名つき */
export const JUNIUN_ENERGY: Record<string, { level: number; name: string; text: string }> = {
  '長生': { level: 4, name: '長生（ちょうせい）', text: 'これから上り調子。新しいことに前向きです' },
  '沐浴': { level: 3, name: '沐浴（もくよく）', text: '気分が変わりやすく、ふわふわしがち' },
  '冠帯': { level: 4, name: '冠帯（かんたい）', text: '自信があり、頼られるとうれしい日' },
  '建禄': { level: 5, name: '建禄（けんろく）', text: '気力が安定して、行動力もしっかり' },
  '帝旺': { level: 5, name: '帝旺（ていおう）', text: '元気いっぱい。気持ちも強めに出ます' },
  '衰': { level: 3, name: '衰（すい）', text: '落ち着いて過ごしたい日。にぎやかさより穏やかさ' },
  '病': { level: 2, name: '病（びょう）', text: '少しお疲れ気味。気づかいが沁みる日' },
  '死': { level: 1, name: '死（し）', text: 'エネルギー低め。静かに過ごしたい日' },
  '墓': { level: 2, name: '墓（ぼ）', text: '気持ちを内にしまいがち。本音は出にくい日' },
  '絶': { level: 1, name: '絶（ぜつ）', text: '気力が途切れがち。返事が遅くても自然な日' },
  '胎': { level: 2, name: '胎（たい）', text: '新しいことを頭の中で温めている日' },
  '養': { level: 3, name: '養（よう）', text: 'のんびり充電中。安心できる相手を求めています' }
};

const GOOD_GODS: TenGod[] = ['比肩', '食神', '偏財', '正財', '正印'];
const HARD_GODS: TenGod[] = ['劫財', '傷官', '偏官', '偏印'];
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

/** 今日の波: low = 引く日（待つ・控えめ）、mid = ふつう、high = 追い風（一歩踏み出す日） */
export type Wave = 'low' | 'mid' | 'high';

export interface PartnerToday {
  tenGod: TenGod;
  mood: string;
  juniun: string;
  energyName: string;
  energy: number;
  energyText: string;
  /** 心の揺れ（空亡・六冲）の日 */
  sway: boolean;
  /** 二人のシンクロ日 */
  sync: boolean;
  wave: Wave;
}

export function computePartnerToday(me: LuckPerson | null, partner: LuckPerson, day: DayInfo): PartnerToday {
  const pd = getPersonDay(partner, day);
  const tenGod = getTenGod(partner.stem, day.stem);
  const juniun = getJuniUn(partner.stem, day.branch);
  const en = JUNIUN_ENERGY[juniun] || JUNIUN_ENERGY['胎'];
  const rokuchu = (BRANCHES.indexOf(day.branch) - BRANCHES.indexOf(partner.branch) + 12) % 12 === 6;
  const sway = pd.kuubou || rokuchu;
  const sync = !!me && isPairSyncDate(me, partner, day);
  let p = 0;
  if (GOOD_GODS.includes(tenGod)) p += 1;
  if (HARD_GODS.includes(tenGod)) p -= 1;
  if (en.level >= 4) p += 1;
  if (en.level <= 2) p -= 1;
  if (isPersonalGood(pd)) p += 1;
  if (sway) p -= 1;
  // 揺れの日は、ほかが良くても「追い風」にはしない（大きな行動は別の日に）
  const wave: Wave = sync ? 'high' : !sway && (p >= 2 || (p === 1 && GOOD_GODS.includes(tenGod))) ? 'high' : p <= -1 ? 'low' : 'mid';
  return { tenGod, mood: TEN_GOD_MOOD[tenGod], juniun, energyName: en.name, energy: en.level, energyText: en.text, sway, sync, wave };
}

export function getPartnerToday(result: FortuneResult, date: Date): PartnerToday | null {
  const partner = toLuckPerson(result.opponentPillar, result.opponentStar, result.opponentGender);
  if (!partner) return null;
  const me = toLuckPerson(result.myPillar, result.myStar, result.myGender);
  return computePartnerToday(me, partner, getDayInfo(date));
}

// ───────── 二人の道のり ─────────

export type JourneyMode = 'crush' | 'couple';

/** 保存したお相手ごとに持つ、二人の道のり（端末とアカウントで同期する） */
export interface Journey {
  mode: JourneyMode;
  /** 道のりの段階（0〜4） */
  stage: number;
  /** 今の状況（1タップで選ぶ。選び直すまでそのまま） */
  situation?: string;
}

export const JOURNEY_STAGES: Record<JourneyMode, string[]> = {
  crush: ['距離がある', 'やりとり中', 'デート', '告白', '交際'],
  couple: ['付き合いたて', '安定', '将来の話', 'プロポーズ', '結婚']
};

export const SITUATIONS: Record<JourneyMode, { key: string; label: string }[]> = {
  crush: [
    { key: 'good', label: 'いい感じ' },
    { key: 'flat', label: '進展なし' },
    { key: 'noreply', label: '返信が来ない' },
    { key: 'meet', label: '会う予定がある' }
  ],
  couple: [
    { key: 'good', label: '順調' },
    { key: 'rut', label: 'マンネリ' },
    { key: 'fight', label: 'すれ違い・ケンカ' },
    { key: 'meet', label: '会う予定がある' }
  ]
};

/** 入力の「お相手との関係性」から、最初の道のりを決める */
export function defaultJourney(relationship: string | undefined): Journey {
  if (relationship === '両思い・交際中') return { mode: 'couple', stage: 0 };
  if (relationship === '結婚・夫婦') return { mode: 'couple', stage: 4 };
  return { mode: 'crush', stage: 0 };
}

export function cleanJourney(j: unknown, relationship?: string): Journey {
  const base = defaultJourney(relationship);
  if (!j || typeof j !== 'object') return base;
  const o = j as Record<string, unknown>;
  const mode: JourneyMode = o.mode === 'couple' ? 'couple' : o.mode === 'crush' ? 'crush' : base.mode;
  const stage = typeof o.stage === 'number' && o.stage >= 0 && o.stage <= 4 ? Math.floor(o.stage) : 0;
  const situation = typeof o.situation === 'string' && SITUATIONS[mode].some((s) => s.key === o.situation) ? o.situation : undefined;
  return { mode, stage, ...(situation ? { situation } : {}) };
}

// ───────── 今日の一歩 ─────────

export interface TodayStep {
  /** 一歩の大きさ（波で決まる） */
  size: string;
  text: string;
  /** 告白・プロポーズのように、決めるのは本人だと添える一歩 */
  ownChoice?: boolean;
  /** 今日は送らない・切り出さない一歩（相談の入口の文を変える） */
  wait?: boolean;
}

type Steps = Record<Wave, string[]>;

// 道のりの段階ごとの「次の一歩」（今の状況が「いい感じ／進展なし／順調」のとき）
const STAGE_STEPS: Record<JourneyMode, Steps[]> = {
  crush: [
    { // 距離がある
      high: ['自分から挨拶して、ひと言だけ話しかけてみましょう。「それ、どこの？」くらいの軽さで十分です。', 'SNSの投稿に、ひと言コメントを残してみて。名前を覚えてもらう日です。'],
      mid: ['共通の話題になりそうなことを1つ探しておきましょう。次に話すときの“きっかけ”になります。', '投稿に「いいね」だけ。今日は存在を思い出してもらうだけで十分です。'],
      low: ['今日は近づかず、自分磨きの日に。髪や服、ちょっとした準備が次のチャンスで効きます。', '今日は様子を見る日。相手の好きなものを1つ調べておきましょう。']
    },
    { // やりとり中
      high: ['「今度〇〇行かない？」と、軽く誘ってみましょう。日にちまで決めなくてOKです。', '相手の好きな話題で、質問を1つ送ってみて。会話が弾みやすい日です。'],
      mid: ['相手の話に「それでどうなったの？」と質問で返しましょう。聞き上手が一番の近道です。', '返信は相手のペースに合わせて。文の長さもそろえると心地よさが伝わります。'],
      low: ['返信は短めに。追いLINEはしないのが正解です。', '今日は自分から話題を広げず、来た話にやさしく返すだけにしましょう。']
    },
    { // デート
      high: ['次に会う日を具体的に提案してみましょう。「来週の土曜、空いてる？」がおすすめです。', '「一緒にいると楽しい」と、好意を少しだけ言葉にしてみて。'],
      mid: ['この前会ったときの「楽しかったポイント」を1つ伝えましょう。', '次に行きたい場所の話をして、自然に次の約束につなげましょう。'],
      low: ['今日は予定を詰めず、余韻を大事に。短いお礼だけで十分です。', '会う約束は急がず、相手の都合を聞くだけにしておきましょう。']
    },
    { // 告白
      high: ['今日は星が背中を押してくれる日です。伝えるかどうかは、あなたが決めていい。決めたなら、短く、まっすぐに。', '気持ちを伝えるなら、今日は追い風の日。言葉は飾らず「好きです」の一言で十分です。'],
      mid: ['二人きりで落ち着いて話せる日時を押さえておきましょう。伝える準備の日です。', '伝えたい言葉を一度メモに書いてみて。気持ちが整理できます。'],
      low: ['今日は伝えない日。焦らず、いつも通りのやりとりを大切に。', '今日は準備の日。相手を思いやる小さな気づかいを1つだけ。']
    },
    { // 交際
      high: ['付き合えたら、次は「付き合っている」の道のりへ。今日は二人の記念に残ることを1つ。'],
      mid: ['小さな「ありがとう」を言葉にして伝えましょう。'],
      low: ['今日は一人の時間も大切に。相手のペースを尊重しましょう。']
    }
  ],
  couple: [
    { // 付き合いたて
      high: ['次のデートの計画を、一緒に立てようと声をかけてみて。', '相手の好きなところを1つ、言葉にして伝えましょう。'],
      mid: ['小さな「ありがとう」を、今日は言葉にして伝えましょう。', '相手の今日の出来事を聞いてみて。関心を向けるのが一番の愛情表現です。'],
      low: ['今日は連絡の回数より、一通の丁寧さを大事に。', '相手の一人の時間を尊重する日。返事を急かさないで。']
    },
    { // 安定
      high: ['いつもと違うデートを提案してみましょう。新しい場所が二人に新鮮さをくれます。', '「最近どう？」と、相手の気持ちをじっくり聞く時間を作りましょう。'],
      mid: ['相手の最近の頑張りを、ひと言ねぎらいましょう。', '二人で笑えた思い出の話をしてみて。'],
      low: ['今日は干渉しすぎず、そっと見守る日。', '自分の機嫌を自分でとる日。余裕が二人を楽にします。']
    },
    { // 将来の話
      high: ['「いつか〇〇したいね」と、軽く未来の話をしてみましょう。', 'お互いの「これからやりたいこと」を話してみて。重くならずに未来が重なります。'],
      mid: ['お互いの家族や仕事の話を、少しだけしてみましょう。', '相手が大切にしていることを、今日は聞く側に回って。'],
      low: ['今日は重い話は避ける日。いつも通りの時間を楽しみましょう。', '将来の話は、相手に余裕がある日まで取っておきましょう。']
    },
    { // プロポーズ
      high: ['今日は星が背中を押してくれる日です。切り出すかどうかは、あなたが決めていい。決めたなら、飾らない言葉で。', '大切な話をするなら、今日は追い風の日。落ち着ける場所を選んで。'],
      mid: ['二人でゆっくり話せる時間と場所を押さえておきましょう。', '「これからも一緒にいたい」と思う理由を、心の中で整理しておきましょう。'],
      low: ['今日は切り出さない日。いつも通りのやさしさを大切に。', '大事な話はまた今度。今日は相手をねぎらう日です。']
    },
    { // 結婚
      high: ['二人の小さな記念日を作ってみましょう。「今日はありがとうの日」でも十分です。', '一緒に新しいことを始める提案をしてみて。'],
      mid: ['「いつもありがとう」を、今日は言葉にして伝えましょう。', '相手の話を、手を止めて聞く時間を作りましょう。'],
      low: ['今日はお互いの一人時間を大事に。', '小さなことに目くじらを立てず、ゆったり過ごす日です。']
    }
  ]
};

// 状況が「返信が来ない／会う予定がある／マンネリ／すれ違い・ケンカ」のときは、段階より状況を優先する
const SITUATION_STEPS: Record<string, Steps> = {
  noreply: {
    high: ['返事を急かさず、別の軽い話題を1通だけ。スタンプ1つでもOKです。', '「そういえば〇〇見たよ」くらいの、答えなくていい一言を1通だけ。'],
    mid: ['今日は送らずに待つ日。相手のペースに任せましょう。', '返事は来るものと信じて、今日は自分の予定を楽しんで。'],
    low: ['今日は引く日。送らないのが一番の近道です。', '追いLINEはしないで。返事が遅いのは、あなたのせいとは限りません。']
  },
  meet: {
    high: ['会ったら、相手のことを1つ褒めてみましょう。今日は言葉がまっすぐ届く日です。', '会ったら、次の約束を自分から切り出してみて。'],
    mid: ['会う前に「楽しみにしてるね」と短く送りましょう。', '会ったら聞き役に回って、相手の話を広げましょう。'],
    low: ['会ったら聞き役に徹して。相手は少しお疲れかもしれません。', '予定は詰め込みすぎず、早めに解散するくらいがちょうどいい日です。']
  },
  rut: {
    high: ['行ったことのない場所に誘ってみましょう。', '付き合い始めのころの思い出話をしてみて。気持ちがよみがえります。'],
    mid: ['いつものデートに、小さな変化を1つ足してみましょう。', '相手のいいところを1つ見つけて、言葉にしてみて。'],
    low: ['今日は一人の時間を楽しんで、会ったときの話題を持ち帰りましょう。', '無理に盛り上げようとせず、のんびり過ごす日です。']
  },
  fight: {
    high: ['自分から短く「ごめんね」を。仲直りのきっかけが届きやすい日です。', '「ちゃんと話したい」と、落ち着いて伝えてみましょう。'],
    mid: ['責めずに「どう思ってた？」と聞いてみましょう。', '言い分を伝えるより、まず相手の気持ちを聞く日です。'],
    low: ['今日は話し合わない日。時間を置くことが、仲直りへの近道です。', '感情的な言葉は送らないで。気持ちを書き出して、送るのは明日に。']
  }
};

const STEP_SIZE: Record<Wave, string> = { low: '控えめの一歩', mid: 'いつもの一歩', high: '踏み出す一歩' };

/** 同じ日・同じ二人なら同じ文。日によって言い回しが変わる */
const pick = <T,>(list: T[], seed: number): T => list[((seed % list.length) + list.length) % list.length];
const daySeed = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

export function getTodayStep(journey: Journey, today: PartnerToday, date: Date): TodayStep {
  const seed = daySeed(date);
  const sit = journey.situation;
  const bySituation = sit && SITUATION_STEPS[sit];
  const steps = bySituation || STAGE_STEPS[journey.mode][Math.min(4, Math.max(0, journey.stage))];
  const text = pick(steps[today.wave], seed);
  const ownChoice = !bySituation && today.wave === 'high' && journey.stage === 3;
  const wait = /送らない|送らず|話し合わない|切り出さない|伝えない|近づかず/.test(text);
  return { size: STEP_SIZE[today.wave], text, ownChoice, wait };
}

// 月・蓮の勇気の一言
const COURAGE: Record<'tsuki' | 'ren', Record<Wave, string[]>> = {
  tsuki: {
    high: ['今日は星があなたの味方。ちょっとの勇気で、景色が変わるよ。', '大丈夫、あなたの気持ちはちゃんと届く日だよ。', 'ドキドキするのは、本気の証拠。そのままのあなたでいってらっしゃい。'],
    mid: ['小さな一歩でいいの。昨日より少しだけ近づければ十分だよ。', '焦らなくていいよ。一歩ずつが、いちばん確かな道だからね。', 'あなたのやさしさは、ちゃんと伝わってるよ。'],
    low: ['引くのも立派な一歩。今日は自分を大事にしてね。', '待てるあなたは、とても素敵。今日はゆっくり休んでね。', '何もしない日があっても大丈夫。星はまた必ずめぐってくるよ。']
  },
  ren: {
    high: ['今日は動いていい日だ。迷ったら、小さく踏み出してみよう。', '準備はできている。あとは一言を送るだけだ。', '星が背中を押している。決めるのは君だ。自分を信じていい。'],
    mid: ['大きく動かなくていい。続けることが、いちばんの力になる。', '今日の一歩は小さくても、確実に前に進んでいる。', '相手を知ろうとする気持ちが、いちばんの武器だ。'],
    low: ['今日は待つのが正解だ。焦らないことが、いちばんの近道になる。', '動かない勇気もある。今日は力をためる日だ。', '返事の早さで気持ちは測れない。落ち着いていこう。']
  }
};

export function getCourage(char: 'tsuki' | 'ren', wave: Wave, date: Date): string {
  return pick(COURAGE[char][wave], daySeed(date) + (char === 'ren' ? 1 : 0));
}

export const WAVE_LABEL: Record<Wave, string> = { low: '今日は引く日', mid: '今日はふつうの日', high: '今日は追い風の日' };
