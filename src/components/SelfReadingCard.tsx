import React from 'react';
import { getSelfReading, maskedLead } from '../utils/selfReading';
import { san } from '../utils/fortuneEngine';
import { LockLabel, countChars } from './LockRest';

// 鑑定結果の冒頭（点数のすぐ下）に出す「あなたってこんな人」。
// 本人の性格・恋愛の傾向を先に見せて「当たってる」と感じてもらい、その先の相性・運勢を読む気持ちにつなげる。
// 点数には関わらない。文は utils/selfReading.ts。
// subject='opponent' でお相手版（「〇〇さんってこんな人」）。locked のときは短く縮めてぼかし、タップで会員登録へ（2026-11-07 TAKASHI指示）。

// ぼかす部分に置くダミー文（本物の文は画面に置かない。ぼかしは見た目だけで「検証」から読めてしまうため）
const LOCKED_FILLER = '無料会員登録をすると、お相手が普段どんな人で、恋をするとどう変わるのかが読めるようになります。';

export const SelfReadingCard: React.FC<{
  pillar: string;
  star: string;
  mbti?: string;
  name?: string;
  char: 'tsuki' | 'ren';
  charIcon: React.ReactNode;
  hasOpponent: boolean;
  oppName: string;
  // お相手版: name にお相手の名前を渡す。oppName は使わない
  subject?: 'self' | 'opponent';
  locked?: boolean;
  onUnlock?: () => void;
}> = ({ pillar, star, mbti, name, char, charIcon, hasOpponent, oppName, subject = 'self', locked = false, onUnlock }) => {
  const reading = getSelfReading(pillar, star, mbti);
  if (!reading) return null;
  if (subject === 'opponent') {
    return <OpponentReadingCard reading={reading} name={name} char={char} charIcon={charIcon} locked={locked} onUnlock={onUnlock} />;
  }

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

// お相手版の「〇〇さんってこんな人」。文は本人版と同じ（お相手の日柱・本命星・16タイプから）
const OpponentReadingCard: React.FC<{
  reading: NonNullable<ReturnType<typeof getSelfReading>>;
  name?: string;
  char: 'tsuki' | 'ren';
  charIcon: React.ReactNode;
  locked: boolean;
  onUnlock?: () => void;
}> = ({ reading, name, char, charIcon, locked, onUnlock }) => {
  const who = san(name);
  const accent = char === 'ren' ? '#9cc6d8' : '#cdbfe2';
  const intro = char === 'ren' ? `次は、${who}がどんな人かを見ておこう。` : `次は、${who}のことも見てみましょう。`;
  const label = (l: string) => l.replace('あなた', who);
  // 見出し＋月/蓮のひとことは、自分の「こんな人」と同じ形にそろえる（2026-11-07 TAKASHI指示）
  const heading = (
    <>
      <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', margin: '0 0 0.55rem', fontWeight: 'bold', textAlign: 'center', letterSpacing: '0.05em' }}>
        {who}ってこんな人
      </h2>
      <p className="font-serif" style={{ display: 'flex', alignItems: 'center', fontSize: '0.84rem', color: accent, margin: '0 0 0.85rem', lineHeight: 1.6 }}>
        {charIcon}
        <span>{intro}</span>
      </p>
    </>
  );

  if (locked) {
    // 未登録: 「ふだん」「恋愛」の2項目の1文目だけ見せ、その人らしさの核の言葉を「〇〇〇〇〇」で伏せる（2026-11-12 TAKASHI依頼）。
    // 伏せた言葉は登録すると全文の中でそのまま読める。本物の言葉と2文目以降は画面に置かない。〇〇のタップ＝「続きを見る」と同じ。
    const preview = reading.items.slice(0, 2);
    const leads = preview.map((item) => maskedLead(item.text, item.mask));
    const shown = leads.reduce((n, l) => n + (l ? countChars(l.before, l.after) : 0), 0);
    const rest = Math.max(0, countChars(...reading.items.map((it) => it.text)) - shown);
    const unlock = () => onUnlock?.();
    return (
      <div className="glass-panel" style={{ padding: '1.2rem 1.2rem 1.1rem', border: '1px solid rgba(226,192,116,0.3)' }}>
        {heading}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {preview.map((item, i) => {
            const lead = leads[i];
            return (
              <div key={item.label} style={{ borderLeft: '2px solid rgba(226,192,116,0.55)', paddingLeft: '0.75rem' }}>
                <div style={{ fontSize: '0.74rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{label(item.label)}</div>
                <p className="font-serif" style={{ fontSize: '0.88rem', lineHeight: 1.85, letterSpacing: '0.02em', color: '#e8e3d8', margin: 0 }}>
                  {lead ? (
                    <>
                      {lead.before}
                      <span
                        className="masked-word"
                        role="button"
                        tabIndex={0}
                        aria-label="伏せられた言葉。続きを見る"
                        onClick={unlock}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unlock(); } }}
                      >
                        〇〇〇〇〇
                      </span>
                      {lead.after}
                    </>
                  ) : (
                    <span style={{ filter: 'blur(4px)', userSelect: 'none', opacity: 0.7 }} aria-hidden="true">{LOCKED_FILLER.slice(0, 28)}</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
        <div
          className="premium-blur-container"
          role="button"
          tabIndex={0}
          onClick={unlock}
          onKeyDown={(e) => { if (e.key === 'Enter') unlock(); }}
          style={{ minHeight: 0, cursor: 'pointer', borderRadius: '8px', marginTop: '0.35rem' }}
        >
          <p className="font-serif" aria-hidden="true" style={{ fontSize: '0.84rem', lineHeight: 1.85, color: '#e8e3d8', margin: 0, filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.7, maxHeight: '3.7em', overflow: 'hidden' }}>
            {LOCKED_FILLER}{LOCKED_FILLER}
          </p>
          <div className="premium-lock-overlay">
            <button type="button" className="premium-lock-tag" onClick={(e) => { e.stopPropagation(); unlock(); }}>
              <LockLabel word="続きを見る" chars={rest} />
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'rgba(232,227,216,0.7)', textAlign: 'center', margin: '0.45rem 0 0' }}>
          〇〇の答えは、無料の会員登録で読めます
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '1.2rem 1.2rem 1.1rem', border: '1px solid rgba(226,192,116,0.3)' }}>
      {heading}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reading.items.map((item) => (
          <div key={item.label} style={{ borderLeft: '2px solid rgba(226,192,116,0.55)', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.74rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label(item.label)}</div>
            <p className="font-serif" style={{ fontSize: '0.88rem', lineHeight: 1.85, letterSpacing: '0.02em', color: '#e8e3d8', margin: 0 }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
