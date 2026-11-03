import React from 'react';
import { getSelfReading } from '../utils/selfReading';
import { san } from '../utils/fortuneEngine';

// 鑑定結果の冒頭（点数のすぐ下）に出す「あなたってこんな人」。
// 本人の性格・恋愛の傾向を先に見せて「当たってる」と感じてもらい、その先の相性・運勢を読む気持ちにつなげる。
// 点数には関わらない。文は utils/selfReading.ts。

export const SelfReadingCard: React.FC<{
  pillar: string;
  star: string;
  mbti?: string;
  name?: string;
  char: 'tsuki' | 'ren';
  charIcon: React.ReactNode;
  hasOpponent: boolean;
  oppName: string;
}> = ({ pillar, star, mbti, name, char, charIcon, hasOpponent, oppName }) => {
  const reading = getSelfReading(pillar, star, mbti);
  if (!reading) return null;

  // 見出しの呼び方のルール: 自分＝ニックネーム（空欄なら「あなた」）、お相手＝「〇〇さん」、二人のこと＝「〇〇さんとの」
  const who = san(name, 'あなた');
  const accent = char === 'ren' ? '#9cc6d8' : '#cdbfe2';
  const opp = san(oppName);
  // 相性・運勢の鑑定の前置きとして読めるように、「〇〇との相性を見る前に、まずは${who}のことから」で始める
  const intro = hasOpponent
    ? (char === 'ren' ? `${opp}との相性を読む前に、まず${who}がどんな人かを見ておこう。` : `${opp}との相性を見る前に、まずは${who}のことから。`)
    : (char === 'ren' ? `運勢を読む前に、まず${who}がどんな人かを見ておこう。` : `運勢を見る前に、まずは${who}のことから。`);
  return (
    <div className="glass-panel" style={{ padding: '1.2rem 1.2rem 1.1rem', border: '1px solid rgba(226,192,116,0.3)' }}>
      <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', margin: '0 0 0.55rem', fontWeight: 'bold', textAlign: 'center', letterSpacing: '0.05em' }}>
        {who}ってこんな人
      </h2>
      <p className="font-serif" style={{ display: 'flex', alignItems: 'center', fontSize: '0.84rem', color: accent, margin: '0 0 0.85rem', lineHeight: 1.6 }}>
        {charIcon}
        <span>{intro}</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reading.items.map((item) => (
          <div key={item.label} style={{ borderLeft: '2px solid rgba(226,192,116,0.55)', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.74rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{item.label.replace('あなた', who)}</div>
            <p className="font-serif" style={{ fontSize: '0.88rem', lineHeight: 1.85, letterSpacing: '0.02em', color: '#e8e3d8', margin: 0 }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
