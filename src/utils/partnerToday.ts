// 月額プレミアム会員の「今日」画面: 「〇〇さんの今日」と「今日の一歩」（2026-11-12 TAKASHI）。
// 片思いの人がいちばん気になる「お相手の今日の様子」を、お相手の生まれた日の星と今日の星の関係から読む。
// - 心のモード: 十神（今日の十干が、お相手の日干から見て何にあたるか）
// - 元気の量: 十二運（お相手の日干が、今日の十二支でどの段階にあるか）
// - 心の揺れ: 空亡・六冲（getPersonDay と同じ判定）
// 点数の計算には使わない（表示だけ）。「本当の状態がわかる」とは書かず、「星から見た傾向」として出す。
// 今日の一歩: 二人の道のり（片思い／付き合っている の5段階）と、本人が1タップで選ぶ今の状況、
// お相手の今日の波から、今日やるとよい行動を1つだけ出す。告白・プロポーズは「星が背中を押す日」と示すだけで、決めるのは本人。
import { CRUSH_STEPS } from './stepTexts/crush.ts';
import { COUPLE_STEPS } from './stepTexts/couple.ts';
import { SITUATION_STEPS as SITUATION_STEPS_BY_TYPE } from './stepTexts/situation.ts';
import type { StepAxis } from './stepTexts/types.ts';
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

/** 自分の今日（お相手と同じ見方で、自分の生まれた日の星から。2026-11-12 TAKASHI「自分の分も出してOK」） */
export function getMyToday(result: FortuneResult, date: Date): PartnerToday | null {
  const me = toLuckPerson(result.myPillar, result.myStar, result.myGender);
  if (!me) return null;
  const opp = toLuckPerson(result.opponentPillar, result.opponentStar, result.opponentGender);
  return computePartnerToday(opp, me, getDayInfo(date));
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
      high: ['自分から挨拶して、ひと言話しかけてみるのもよさそう。「それ、どこの？」くらいの軽さで大丈夫です。', 'SNSの投稿に、ひと言コメントを残してみるのもいいかも。名前を覚えてもらいやすい日です。'],
      mid: ['共通の話題になりそうなことを1つ探しておくと、次に話すときの“きっかけ”になりそうです。', '投稿に「いいね」くらいでもいいかも。存在を思い出してもらえれば、それだけで前進です。'],
      low: ['今日は無理に近づかず、自分磨きにあててもよさそう。髪や服のちょっとした準備が、次のチャンスで生きてきます。', '今日は様子を見てもいい日。相手の好きなものを1つ調べておくのもおすすめです。']
    },
    { // やりとり中
      high: ['タイミングが合えば、「今度〇〇行かない？」と軽く誘ってみるのもいいかも。日にちまで決めなくても大丈夫です。', '相手の好きな話題で、質問を1つ送ってみるのもよさそう。会話が弾みやすい日です。'],
      mid: ['相手の話に「それでどうなったの？」と質問で返すと、会話が続きやすそうです。', '返信は相手のペースに合わせるのがよさそう。文の長さをそろえると、心地よさが伝わりやすくなります。'],
      low: ['返信は短めがよさそう。今日は追いLINEは控えめにしておくと安心です。', '今日は自分から話題を広げるより、来た話にやさしく返すくらいがちょうどよさそうです。']
    },
    { // デート
      high: ['次に会う日を、具体的に提案してみるのもいいかも。「来週の土曜、空いてる？」くらいが自然です。', '「一緒にいると楽しい」と、好意を少しだけ言葉にしてみるのもよさそうです。'],
      mid: ['この前会ったときの「楽しかったポイント」を1つ伝えると、喜ばれそうです。', '次に行きたい場所の話から、自然に次の約束につながるかもしれません。'],
      low: ['今日は予定を詰めず、余韻を大事にしてもよさそう。短いお礼だけでも気持ちは伝わります。', '会う約束は急がず、相手の都合を聞くくらいにしておくと安心です。']
    },
    { // 告白
      high: ['星が背中を押してくれそうな日です。伝えるかどうかは、あなたが決めていい。伝えるなら、短く、まっすぐな言葉が届きやすそうです。', '気持ちを伝えるなら、追い風が吹きやすい日。飾らない「好きです」の一言でも、きっと伝わります。'],
      mid: ['二人きりで落ち着いて話せる日時を、考えておくのもよさそう。伝える準備にあてやすい日です。', '伝えたい言葉を一度メモに書いてみると、気持ちが整理できるかもしれません。'],
      low: ['今日は無理に伝えないほうがよさそう。焦らず、いつも通りのやりとりを大切にしてみて。', '今日は準備にあててもいい日。相手を思いやる小さな気づかいを1つできたら十分です。']
    },
    { // 交際
      high: ['付き合えたら、次は「付き合っている」の道のりへ。今日は二人の記念に残ることを1つしてみるのもいいかも。'],
      mid: ['小さな「ありがとう」を言葉にしてみるのもよさそうです。'],
      low: ['今日は一人の時間も大切にしてよさそう。相手のペースに合わせると安心です。']
    }
  ],
  couple: [
    { // 付き合いたて
      high: ['次のデートの計画を、一緒に立てようと声をかけてみるのもいいかも。', '相手の好きなところを1つ、言葉にしてみるのもよさそうです。'],
      mid: ['小さな「ありがとう」を、今日は言葉にしてみるのもよさそうです。', '相手の今日の出来事を聞いてみるのもいいかも。関心を向けることも、立派な愛情表現です。'],
      low: ['今日は連絡の回数より、一通の丁寧さを大事にするとよさそうです。', '相手の一人の時間を大切にしたい日。返事はゆっくり待つくらいがよさそうです。']
    },
    { // 安定
      high: ['いつもと違うデートを提案してみるのもいいかも。新しい場所が、二人に新鮮さをくれそうです。', '「最近どう？」と、相手の気持ちをじっくり聞く時間を作れるとよさそうです。'],
      mid: ['相手の最近の頑張りを、ひと言ねぎらうと喜ばれそうです。', '二人で笑えた思い出の話をしてみるのもいいかも。'],
      low: ['今日は干渉しすぎず、そっと見守るくらいがよさそうです。', '自分の機嫌を自分でとれると、二人とも楽になりそうな日です。']
    },
    { // 将来の話
      high: ['「いつか〇〇したいね」と、軽く未来の話をしてみるのもいいかも。', 'お互いの「これからやりたいこと」を話してみるのもよさそう。重くならずに未来の話ができそうです。'],
      mid: ['お互いの家族や仕事の話を、少しだけしてみるのもいいかも。', '相手が大切にしていることを、今日は聞く側に回ってみるのもよさそうです。'],
      low: ['今日は重い話は避けたほうがよさそう。いつも通りの時間を楽しんでみて。', '将来の話は、相手に余裕がありそうな日まで取っておいてもよさそうです。']
    },
    { // プロポーズ
      high: ['星が背中を押してくれそうな日です。切り出すかどうかは、あなたが決めていい。切り出すなら、飾らない言葉が届きやすそうです。', '大切な話をするなら、追い風が吹きやすい日。落ち着ける場所を選べるとよさそうです。'],
      mid: ['二人でゆっくり話せる時間と場所を、考えておくのもよさそうです。', '「これからも一緒にいたい」と思う理由を、心の中で整理しておくのもいいかも。'],
      low: ['今日は無理に切り出さないほうがよさそう。いつも通りのやさしさを大切にしてみて。', '大事な話はまた今度でもよさそう。今日は相手をねぎらう日にしてみては。']
    },
    { // 結婚
      high: ['二人の小さな記念日を作ってみるのもいいかも。「今日はありがとうの日」くらいの気軽さで。', '一緒に新しいことを始める提案をしてみるのもよさそうです。'],
      mid: ['「いつもありがとう」を、今日は言葉にしてみるのもよさそうです。', '相手の話を、手を止めて聞く時間を作れるとよさそうです。'],
      low: ['今日はお互いの一人時間を大事にしてもよさそうです。', '小さなことは気にしすぎず、ゆったり過ごせるとよさそうな日です。']
    }
  ]
};

// 状況が「返信が来ない／会う予定がある／マンネリ／すれ違い・ケンカ」のときは、段階より状況を優先する
const SITUATION_STEPS: Record<string, Steps> = {
  noreply: {
    high: ['返事を急かさず、別の軽い話題を1通だけ送ってみるのもいいかも。スタンプ1つでも大丈夫です。', '送るなら「そういえば〇〇見たよ」くらいの、答えなくていい一言がよさそうです。'],
    mid: ['今日は送らずに待ってみてもよさそう。相手のペースに任せてみて。', '返事のことは少し置いて、今日は自分の予定を楽しんでもよさそうです。'],
    low: ['今日は少し引いてみてもいい日。無理に送らなくても大丈夫です。', '追いLINEは控えめにしておくと安心です。返事が遅いのは、あなたのせいとは限りません。']
  },
  meet: {
    high: ['会ったら、相手のことを1つ褒めてみるのもいいかも。言葉がまっすぐ届きやすい日です。', '会ったら、次の約束を自分から切り出してみるのもよさそうです。'],
    mid: ['会う前に「楽しみにしてるね」と短く送るのもいいかも。', '会ったら聞き役に回って、相手の話を広げてみるのもよさそうです。'],
    low: ['会ったら聞き役に回るのがよさそう。相手は少しお疲れかもしれません。', '予定は詰め込みすぎず、早めに解散するくらいがちょうどいいかもしれません。']
  },
  rut: {
    high: ['行ったことのない場所に誘ってみるのもいいかも。', '付き合い始めのころの思い出話をしてみるのもよさそう。当時の気持ちがよみがえるかもしれません。'],
    mid: ['いつものデートに、小さな変化を1つ足してみるのもいいかも。', '相手のいいところを1つ見つけて、言葉にしてみるのもよさそうです。'],
    low: ['今日は一人の時間を楽しんで、会ったときの話題を持ち帰るのもいいかも。', '無理に盛り上げようとせず、のんびり過ごすくらいがよさそうです。']
  },
  fight: {
    high: ['自分から短く「ごめんね」を伝えてみるのもいいかも。仲直りのきっかけが届きやすい日です。', '「ちゃんと話したい」と、落ち着いて伝えてみるのもよさそうです。'],
    mid: ['責めずに「どう思ってた？」と聞いてみるのもいいかも。', '言い分を伝えるより、まず相手の気持ちを聞いてみるとよさそうです。'],
    low: ['今日は無理に話し合わなくてもよさそう。少し時間を置くと、落ち着いて話せるかもしれません。', '感情的な言葉は送らないほうがよさそう。気持ちを書き出して、送るのは明日にしてみては。']
  }
};

const STEP_SIZE: Record<Wave, string> = { low: '控えめの一歩', mid: 'いつもの一歩', high: '踏み出す一歩' };

/** 同じ日・同じ二人なら同じ文。日によって言い回しが変わる */
const pick = <T,>(list: T[], seed: number): T => list[((seed % list.length) + list.length) % list.length];
const daySeed = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

/**
 * 今日の一歩。流れ（踏み出す／いつもの／控えめ）は星（お相手の今日）、中身はお相手の16タイプ（E/I × T/F）から選ぶ（2026-11-12 TAKASHI）。
 * 1つの段階・状況・流れ・タイプにつき5文。日によって順に変わる。タイプがわからないお相手は、従来のタイプなしの文。
 */
export function getTodayStep(journey: Journey, today: PartnerToday, date: Date, mbti?: string): TodayStep {
  const seed = daySeed(date);
  const sit = journey.situation;
  const stage = Math.min(4, Math.max(0, journey.stage));
  const m = (mbti || '').toUpperCase();
  const axis = /^[EI][NS][TF][JP]$/.test(m) ? (`${m[0]}${m[2]}` as StepAxis) : null;
  let text: string;
  let bySituation: boolean;
  if (axis) {
    const sitTable = sit ? SITUATION_STEPS_BY_TYPE[sit] : undefined;
    bySituation = !!sitTable;
    const table = sitTable || (journey.mode === 'couple' ? COUPLE_STEPS : CRUSH_STEPS)[stage];
    text = pick(table[today.wave][axis], seed);
  } else {
    const legacy = sit && SITUATION_STEPS[sit];
    bySituation = !!legacy;
    text = pick((legacy || STAGE_STEPS[journey.mode][stage])[today.wave], seed);
  }
  const ownChoice = !bySituation && today.wave === 'high' && journey.stage === 3;
  // 返信待ち・すれ違いの控えめの日は、文に関係なく「待つ」一歩
  const wait = /送らない|送らなく|送らず|話し合わない|話し合わなく|切り出さない|伝えない|近づかず/.test(text)
    || (bySituation && today.wave === 'low' && (sit === 'noreply' || sit === 'fight'));
  return { size: STEP_SIZE[today.wave], text, ownChoice, wait };
}

// 月・蓮の勇気の一言
const COURAGE: Record<'tsuki' | 'ren', Record<Wave, string[]>> = {
  tsuki: {
    high: ['今日は星があなたの味方。ちょっとの勇気で、景色が変わるよ。', '大丈夫、あなたの気持ちは届きやすい日だよ。', 'ドキドキするのは、本気の証拠。そのままのあなたでいってらっしゃい。'],
    mid: ['小さな一歩でいいの。昨日より少しだけ近づければ十分だよ。', '焦らなくていいよ。一歩ずつが、いちばん確かな道だからね。', 'あなたのやさしさは、ちゃんと伝わってるよ。'],
    low: ['引くのも立派な一歩。今日は自分を大事にしてね。', '待てるあなたは、とても素敵。今日はゆっくり休んでね。', '何もしない日があっても大丈夫。星はまためぐってくるよ。']
  },
  ren: {
    high: ['今日は動いていい日だ。迷ったら、小さく踏み出してみよう。', '準備はできている。あとは一言を送るだけだ。', '星が背中を押している。決めるのは君だ。自分を信じていい。'],
    mid: ['大きく動かなくていい。続けることが、いちばんの力になる。', '今日の一歩は小さくても、確実に前に進んでいる。', '相手を知ろうとする気持ちが、いちばんの武器だ。'],
    low: ['今日は待ってもいい日だ。焦らないことも、立派な前進になる。', '動かない勇気もある。今日は力をためる日だ。', '返事の早さで気持ちは測れない。落ち着いていこう。']
  }
};

export function getCourage(char: 'tsuki' | 'ren', wave: Wave, date: Date): string {
  return pick(COURAGE[char][wave], daySeed(date) + (char === 'ren' ? 1 : 0));
}

export const WAVE_LABEL: Record<Wave, string> = { low: '今日は引く日', mid: '今日はふつうの日', high: '今日は追い風の日' };

// ───────── 今日の接し方（状態は四柱推命、接し方は16タイプ） ─────────
// 2026-11-12 TAKASHI: 「その日の状態は四柱推命で分析し、それに対するアクションはMBTIを根拠に示す」。
// ただし画面には16タイプの名前や「外向型は〜」など、MBTIが根拠だと分かる言葉は出さない（2026-11-12 TAKASHI）。
// 十神を伝統の5つのまとまり（比劫・食傷・財・官・印）に分け、お相手の16タイプの
// 外向(E)/内向(I) × 思考(T)/感情(F) で接し方を変える。予定の立て方は 判断(J)/知覚(P) で一言添える。

type GodGroup = 'self' | 'express' | 'social' | 'pressure' | 'inner';
const GOD_GROUP: Record<TenGod, GodGroup> = {
  '比肩': 'self', '劫財': 'self',
  '食神': 'express', '傷官': 'express',
  '偏財': 'social', '正財': 'social',
  '偏官': 'pressure', '正官': 'pressure',
  '偏印': 'inner', '正印': 'inner'
};

/** まとまりごとの「今日の状態」の短い言い方（四柱推命の側） */
const GROUP_STATE: Record<GodGroup, string> = {
  self: '自分のペースを大事にしたい日',
  express: '気持ちや感性が表に出やすい日',
  social: '人付き合いや現実的なことに目が向く日',
  pressure: '仕事や周りの期待で余裕が少ない日',
  inner: '一人で考えたり、安心を求めたりする日'
};

type Axis = 'EF' | 'ET' | 'IF' | 'IT';
const ACTIONS: Record<GodGroup, Record<Axis, string>> = {
  self: {
    EF: '話を聞いてほしい気持ちが強まりやすい日。相手の話に大きめにリアクションして、主役にしてあげると喜ばれそうです。',
    ET: '自分の考えを通したくなりやすい日。意見を否定せず「なるほど、さすがだね」と認める一言が届きやすそうです。',
    IF: '自分のペースを守りたくなりやすい日。気持ちに寄り添う短い一言くらいにして、返事はゆっくり待つのがよさそうです。',
    IT: '干渉されたくない気分になりやすい日。連絡は用件を短く、結論からがよさそう。返事がなくても、追わずに待つと安心です。'
  },
  express: {
    EF: '楽しい話題に乗ってくれやすい日。スタンプや絵文字で明るく返すと、会話が弾みそうです。',
    ET: '面白いことや新しい情報に興味が向きやすい日。「これ知ってる？」とちょっとした話題を振ってみるのもいいかも。',
    IF: '感受性が強くなりやすい日。言葉選びを丁寧にするとよさそう。相手の好きなものを褒めると、深く響きそうです。',
    IT: 'こだわりが出やすい日。相手の得意分野について質問すると、たくさん話してくれるかもしれません。'
  },
  social: {
    EF: 'お誘いに乗りやすそうな日。「今度二人で行こうよ」と軽く誘ってみるのもいいかも。',
    ET: 'てきぱき決めたくなりやすい日。お誘いは場所と時間をセットで、具体的に提案すると通りやすそうです。',
    IF: '親しい人とゆっくり過ごしたくなりやすい日。少人数で落ち着いた場所の提案が喜ばれそうです。',
    IT: '現実的に考えやすい日。「〇〇を見に行こう」と目的のはっきりした誘いが通りやすそうです。'
  },
  pressure: {
    EF: '頑張りすぎて疲れが出やすい日。「いつもありがとう」「無理しないでね」のねぎらいが沁みそうです。',
    ET: 'やることで頭がいっぱいになりやすい日。連絡は簡潔にして、頑張りを認める一言を添えると好印象かもしれません。',
    IF: 'プレッシャーを内にためやすい日。返事を求めない、やさしい一言くらいがよさそうです。',
    IT: '集中したくなりやすい日。連絡は控えめがよさそう。送るなら夜に、短めがおすすめです。'
  },
  inner: {
    EF: '安心したい・甘えたい気持ちが出やすい日。共感の言葉で、相手の気持ちをそのまま受け止めてあげるとよさそうです。',
    ET: '考えごとをしていそうな日。答えを急かさず、相談されたら一緒に考える姿勢を見せると安心してもらえそうです。',
    IF: '一人の時間で心を整えたくなりやすい日。そっとしておくのも思いやり。夜に「おつかれさま」くらいがちょうどよさそうです。',
    IT: '頭の中を整理していそうな日。重い話より、短くて知的な話題を1つくらいがよさそうです。'
  }
};

const JP_TIP: Record<'J' | 'P', string> = {
  J: '予定は前もって具体的に決めておくと、安心してもらえそうです。',
  P: '予定はゆるめにして、その場のノリを大事にすると乗ってくれやすそうです。'
};

export interface MbtiAction {
  /** 四柱推命から見た今日の状態（短い言い方） */
  state: string;
  /** 16タイプから見た接し方 */
  action: string;
  /** 予定の立て方の一言（J/P） */
  plan: string;
}

/** お相手の今日の状態（十神）に対する接し方を、お相手の16タイプから出す。タイプがわからないときは null */
export function getMbtiAction(tenGod: TenGod, mbti: string | undefined): MbtiAction | null {
  const m = (mbti || '').toUpperCase();
  if (!/^[EI][NS][TF][JP]$/.test(m)) return null;
  const group = GOD_GROUP[tenGod];
  const axis = `${m[0]}${m[2]}` as Axis;
  return { state: GROUP_STATE[group], action: ACTIONS[group][axis], plan: JP_TIP[m[3] as 'J' | 'P'] };
}

// 「〇〇さんの今日」の心のモードの説明（状態だけ。行動の案内は16タイプの「接し方」に任せる。2026-11-12 TAKASHI方針）
export const TEN_GOD_STATE: Record<TenGod, string> = {
  '比肩': '自分のペースを大事にしたい日。人に合わせるより、自分のやり方を通したい気分です。',
  '劫財': '負けず嫌いな気持ちが出やすい日。周りと比べたり、張り合ったりしがちです。',
  '食神': '気持ちに余裕があり、楽しいことに心が向いている日です。',
  '傷官': '感性が鋭くなり、言葉がきつめに出やすい日です。',
  '偏財': '人付き合いが活発で、フットワークが軽い日です。',
  '正財': '落ち着いて、現実的に物事を考えている日です。',
  '偏官': '予定や周りの期待に追われて、余裕が少なめの日です。',
  '正官': 'きちんとしていたい、けじめを大事にしたい日です。',
  '偏印': '一人の時間がほしく、考えごとが増えている日です。',
  '正印': '心がやわらかく、安心や優しさを求めている日です。'
};

// 今日の一歩の「伝え方」（お相手の16タイプ: 外向/内向 × 思考/感情）。待つ一歩のときは「待っていい理由」をタイプから示す
const DELIVERY: Record<Axis, string> = {
  EF: '明るく、気持ちを込めて伝えると届きやすそうです。リアクションは多めがおすすめ。',
  ET: 'はっきり短く、結論から伝えると届きやすそうです。回りくどさより分かりやすさが響きやすい人です。',
  IF: '一対一で、やさしい言葉で伝えると届きやすそうです。返事を考える時間があると安心しやすい人です。',
  IT: '要点を短く伝えると届きやすそうです。考える時間があると、きちんと返してくれやすい人です。'
};
const WAIT_REASON: Record<'E' | 'I', string> = {
  E: '周りとの予定で忙しくて、返せないだけのことも多そうな人です。気持ちが冷めたとは限りません。',
  I: '一人で気持ちを整えてから返しやすい人です。時間があるほど、ちゃんと向き合ってくれそうです。'
};

/** 今日の一歩をどう伝えるか（またはなぜ待っていいか）を、お相手の16タイプから。タイプがわからないときは null */
export function getStepDelivery(step: TodayStep, mbti: string | undefined): string | null {
  const m = (mbti || '').toUpperCase();
  if (!/^[EI][NS][TF][JP]$/.test(m)) return null;
  return step.wait ? WAIT_REASON[m[0] as 'E' | 'I'] : DELIVERY[`${m[0]}${m[2]}` as Axis];
}
