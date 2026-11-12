// 16タイプがわからないときの「かんたん質問」（TAKASHI 2026-11-12: 16タイプは必須入力。わからないときは簡易質問に答えてもらう）。
// 4つの軸（外向/内向・感覚/直観・思考/感情・判断/知覚）を1問ずつ、2択で決める。正式な診断ではなく「近いタイプの予想」。
// 自分用と、お相手を思い浮かべて答える用の2種類。点数の計算はこのファイルではしない（決まったタイプを入力に入れるだけ）。

export type QuizSubject = 'self' | 'partner';

export interface QuizQuestion {
  /** 何文字目を決めるか（0: E/I, 1: S/N, 2: T/F, 3: J/P） */
  idx: number;
  text: string;
  options: [{ label: string; letter: string }, { label: string; letter: string }];
}

const Q = (idx: number, text: string, a: [string, string], b: [string, string]): QuizQuestion => ({
  idx,
  text,
  options: [{ label: a[0], letter: a[1] }, { label: b[0], letter: b[1] }]
});

/** 質問。{name} はお相手の呼び名（「ハルさん」）に置き換える */
const QUESTIONS: Record<QuizSubject, QuizQuestion[]> = {
  self: [
    Q(0, '休みの日、元気が出るのは？', ['人と会って、わいわい過ごす', 'E'], ['ひとりの時間で、ゆっくり過ごす', 'I']),
    Q(1, '話していて楽しいのは？', ['今日あったことや、食べもの・お店の話', 'S'], ['将来のことや、「もしも」の話', 'N']),
    Q(2, '友だちに相談されたら？', ['どうすれば解決するかを一緒に考える', 'T'], ['まず「つらかったね」と気持ちに寄りそう', 'F']),
    Q(3, '旅行の計画は？', ['行き先や時間を、早めにきっちり決めたい', 'J'], ['だいたい決めて、あとはその場の気分で', 'P'])
  ],
  partner: [
    Q(0, '大人数で集まったとき、{name}は？', ['輪の中心で、よく話している', 'E'], ['少人数や1対1で、静かに話している', 'I']),
    Q(1, '{name}がよく話すのは？', ['その日の出来事や、食べもの・お店の話', 'S'], ['将来のことや、アイデア・「もしも」の話', 'N']),
    Q(2, '相談をしたら、{name}は？', ['理由や解決のしかたを考えてくれる', 'T'], ['まず気持ちをわかってくれる', 'F']),
    Q(3, '予定の決め方は？', ['日にちや時間を早めにきっちり決めたい人', 'J'], ['その日の気分で決めたい人', 'P'])
  ]
};

export function getQuizQuestions(subject: QuizSubject, name = 'お相手'): QuizQuestion[] {
  return QUESTIONS[subject].map(q => ({ ...q, text: q.text.replace(/\{name\}/g, name) }));
}

/** 答え（各問で選んだ文字）から4文字のタイプを作る。全部答えていなければ null */
export function quizToMbti(answers: (string | null | undefined)[]): string | null {
  const out = ['', '', '', ''];
  const qs = QUESTIONS.self;
  for (let i = 0; i < qs.length; i++) {
    const a = answers[i];
    if (!a || !qs[i].options.some(o => o.letter === a)) return null;
    out[qs[i].idx] = a;
  }
  return out.join('');
}

/** 16タイプが選ばれているか（未選択は ''・'UNKNOWN'） */
export const isMbtiCode = (t?: string | null): t is string => !!t && /^[EI][NS][TF][JP]$/i.test(t);
