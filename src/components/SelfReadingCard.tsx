import React, { useState } from 'react';
import { getSelfReading } from '../utils/selfReading';
import { trackSelfReading } from '../services/analytics';
import { san } from '../utils/fortuneEngine';

// 鑑定結果の冒頭（点数のすぐ下）に出す「あなたってこんな人」。
// 本人の性格・恋愛の傾向を先に見せて「当たってる」と感じてもらい、その先の相性・運勢を読む気持ちにつなげる。
// 点数には関わらない。文は utils/selfReading.ts。

const FEEDBACK_KEY = 'hasu_self_fb_';

const readFeedback = (key: string): 'hit' | 'miss' | null => {
  try {
    const v = window.localStorage.getItem(FEEDBACK_KEY + key);
    return v === 'hit' || v === 'miss' ? v : null;
  } catch {
    return null;
  }
};

export const SelfReadingCard: React.FC<{
  pillar: string;
  star: string;
  mbti?: string;
  name?: string;
  char: 'tsuki' | 'ren';
  charIcon: React.ReactNode;
  hasOpponent: boolean;
  oppName: string;
  /** 共有リンクから開いた他人の結果では、当たり/はずれのボタンを出さない */
  showFeedback: boolean;
}> = ({ pillar, star, mbti, char, charIcon, hasOpponent, oppName, showFeedback }) => {
  const reading = getSelfReading(pillar, star, mbti);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(() => (reading ? readFeedback(reading.key) : null));
  if (!reading) return null;

  // 見出しの呼び方のルール: 自分＝「あなた」、お相手＝「〇〇さん」、二人のこと＝「〇〇さんとの」
  const who = 'あなた';
  const accent = char === 'ren' ? '#9cc6d8' : '#cdbfe2';
  const opp = san(oppName);
  // 相性・運勢の鑑定の前置きとして読めるように、「〇〇との相性を見る前に、まずはあなたのことから」で始める
  const intro = hasOpponent
    ? (char === 'ren' ? `${opp}との相性を読む前に、まずあなたがどんな人かを見ておこう。` : `${opp}との相性を見る前に、まずはあなたのことから。こんなところ、ありませんか？`)
    : (char === 'ren' ? `運勢を読む前に、まずあなたがどんな人かを見ておこう。` : `運勢を見る前に、まずはあなたのことから。こんなところ、ありませんか？`);
  const next = hasOpponent ? `${opp}との相性` : `${who}の運勢`;
  const afterText = feedback === 'hit'
    ? (char === 'ren' ? `やっぱりね。この性格をふまえて、${next}を読み解いていこう。` : `よかった。この性格をふまえて、${next}を見ていきましょうね。`)
    : (char === 'ren' ? `あくまで傾向だから、違う部分もあると思う。${next}も読んでみて。` : `あくまで傾向なので、違うところもありますよね。${next}も読んでみてくださいね。`);

  const answer = (v: 'hit' | 'miss') => {
    if (feedback) return;
    setFeedback(v);
    try { window.localStorage.setItem(FEEDBACK_KEY + reading.key, v); } catch {}
    trackSelfReading(v === 'hit');
  };

  const btn = (primary: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '0.6rem 0.5rem',
    borderRadius: '12px',
    border: primary ? '1px solid rgba(226,192,116,0.6)' : '1px solid rgba(255,255,255,0.15)',
    background: primary ? 'linear-gradient(135deg, rgba(226,192,116,0.25) 0%, rgba(226,192,116,0.1) 100%)' : 'rgba(255,255,255,0.04)',
    color: primary ? '#f6e6c2' : '#cfc8b8',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'var(--font-serif)'
  });

  return (
    <>
    <div className="glass-panel" style={{ padding: '1.2rem 1.2rem 1.1rem', border: '1px solid rgba(226,192,116,0.3)' }}>
      <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', margin: '0 0 0.55rem', fontWeight: 'bold', textAlign: 'center', letterSpacing: '0.05em' }}>
        あなたってこんな人
      </h2>
      <p className="font-serif" style={{ display: 'flex', alignItems: 'center', fontSize: '0.84rem', color: accent, margin: '0 0 0.85rem', lineHeight: 1.6 }}>
        {charIcon}
        <span>{intro}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reading.items.map((item) => (
          <div key={item.label} style={{ borderLeft: '2px solid rgba(226,192,116,0.55)', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.74rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{item.label}</div>
            <p className="font-serif" style={{ fontSize: '0.88rem', lineHeight: 1.85, letterSpacing: '0.02em', color: '#e8e3d8', margin: 0 }}>{item.text}</p>
          </div>
        ))}
      </div>
      {showFeedback && (
        <div style={{ marginTop: '1rem' }}>
          {feedback ? (
            <p className="font-serif" style={{ fontSize: '0.8rem', lineHeight: 1.7, color: '#cfc8b8', margin: 0, textAlign: 'center' }}>{afterText}</p>
          ) : (
            <>
              <div style={{ fontSize: '0.74rem', color: '#a9a293', textAlign: 'center', marginBottom: '0.45rem' }}>当たっていましたか？</div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" style={btn(true)} onClick={() => answer('hit')}>当たってる！</button>
                <button type="button" style={btn(false)} onClick={() => answer('miss')}>ちょっと違うかも</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
};
