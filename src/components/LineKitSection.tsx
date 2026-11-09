import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { LoveLetterMark } from './icons/BrandIcons';
import type { LineKit } from '../utils/lineKit';
import { LockLabel, countChars, clampLines, blurLinesFor } from './LockRest';

// トリセツの「そのまま使えるLINEキラーテンプレート」。
// 誰でも読めるのは、送り方の分析の1行目と、場面別の最初の1通だけ。残りはプレミアム限定でぼかす。

const LOCKED_FILLER = 'この先はプレミアム会員の方だけが読める内容です。';
const filler = (text: string) => {
  const n = Math.max(16, text.length);
  return LOCKED_FILLER.repeat(Math.ceil(n / LOCKED_FILLER.length)).slice(0, n);
};

// 「」の中だけをコピーする（「（写真を添えて）」のような補足は入れない）
const copyText = (message: string) => {
  const m = message.match(/「([^」]*)」/);
  return m ? m[1] : message;
};

interface Props {
  kit: LineKit;
  isSubscribed: boolean;
  isRegistered: boolean;
  onLockClick: () => void;
  // ロックのボタンの文字（買い切りが買えるときは「¥680で解放」）
  lockWord?: string;
  /** 見出しに出すお相手の呼び方（例: ゆうとさん） */
  partnerLabel?: string;
}

export const LineKitSection: React.FC<Props> = ({ kit, isSubscribed, onLockClick, lockWord = '続きを見る', partnerLabel = 'お相手' }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const locked = !isSubscribed;
  const blurred: React.CSSProperties = locked ? { filter: 'blur(4.5px)', userSelect: 'none', opacity: 0.65 } : {};
  const show = (text: string, hide: boolean) => (hide ? filler(text) : text);

  const handleCopy = async (key: string, message: string) => {
    try {
      await navigator.clipboard.writeText(copyText(message));
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1600);
    } catch {
      /* コピーできない環境では何もしない（文は画面で読める） */
    }
  };

  const [firstStyle, ...restStyle] = kit.style;
  const [firstScene, ...restScenes] = kit.scenes;
  // ぼかす部分は文字数に合わせて2〜4行に縮め、隠れている文字数をボタンに出す（結果画面が縦に長くなりすぎないように）
  const restChars = countChars(
    ...restScenes.flatMap(sc => [sc.label, sc.message, sc.why]),
    ...restStyle.flatMap(st => [st.label, st.text]),
    ...kit.fixes.flatMap(f => [f.ng, f.ok, f.why])
  );
  const lockButton = (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
      <button type="button" className="premium-lock-tag" style={{ pointerEvents: 'auto' }} onClick={onLockClick}>
        <LockLabel word={lockWord} chars={restChars} />
      </button>
    </div>
  );

  const sectionTitle: React.CSSProperties = { fontWeight: 'bold', color: '#d9c8ef', fontSize: '0.78rem', marginTop: '0.2rem' };
  const bubble: React.CSSProperties = { background: 'rgba(0,0,0,0.3)', padding: '0.45rem 0.6rem', borderRadius: '8px', color: '#f7f2fb' };

  // 場面の見出しは本文と見分けやすいように、番号つきのゴールドの見出しにする（「（話しかけるきっかけ）」のような補足は小さく）
  const sceneNo = (key: string) => kit.scenes.findIndex(sc => sc.key === key) + 1;
  const renderSceneLabel = (s: LineKit['scenes'][number]) => {
    const m = s.label.match(/^(.*?)（(.*)）$/);
    const main = m ? m[1] : s.label;
    const sub = m ? m[2] : '';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ flexShrink: 0, width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: 'linear-gradient(135deg, #f2d98f, #c9a24e)', color: '#2a1f3d', fontSize: '0.68rem', fontWeight: 'bold', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>{sceneNo(s.key)}</span>
        <span style={{ fontWeight: 'bold', color: '#f2e2b3', fontSize: '0.82rem', letterSpacing: '0.02em' }}>{main}</span>
        {sub && <span style={{ fontSize: '0.66rem', color: '#a99bbd' }}>{sub}</span>}
      </div>
    );
  };

  const renderScene = (s: LineKit['scenes'][number], hide: boolean) => (
    <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', ...(sceneNo(s.key) > 1 ? { borderTop: '1px dashed rgba(226,192,116,0.25)', paddingTop: '0.6rem' } : {}) }}>
      {renderSceneLabel(s)}
      <div style={{ ...bubble, display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
        <span style={{ flex: 1, minWidth: 0 }}>{show(s.message, hide)}</span>
        {!hide && (
          <button
            type="button"
            onClick={() => handleCopy(s.key, s.message)}
            aria-label="この文をコピー"
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(185,163,214,0.18)', border: '1px solid rgba(185,163,214,0.35)', color: '#e9defa', borderRadius: '999px', padding: '0.12rem 0.45rem', fontSize: '0.66rem', cursor: 'pointer' }}
          >
            {copiedKey === s.key ? <><Check size={11} />コピー済み</> : <><Copy size={11} />コピー</>}
          </button>
        )}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#d6cde3', lineHeight: 1.65 }}>
        <span style={{ color: '#b9a3d6' }}>なぜ効く？</span> {show(s.why, hide)}
      </div>
    </div>
  );

  return (
    <div style={{ background: 'rgba(159, 134, 192, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(159, 134, 192, 0.2)', position: 'relative' }}>
      <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#b9a3d6', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <LoveLetterMark size={18} />
        <span>そのまま使えるLINEキラーテンプレート</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: '#a99bbd', marginBottom: '0.5rem' }}>{kit.basis}</div>

      <div className="font-serif" style={{ fontSize: '0.78rem', color: '#f0ebf5', lineHeight: '1.65', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {/* 1. 送り方の分析 */}
        <div style={sectionTitle}>【{partnerLabel}に届くLINEの送り方】</div>
        {firstStyle && (
          <div><strong style={{ color: '#e9defa' }}>{firstStyle.label}：</strong>{firstStyle.text}</div>
        )}

        {/* 2. 場面別の文（最初の1通は誰でも読める） */}
        <div style={sectionTitle}>【場面別・そのまま送れる文】</div>
        {firstScene && renderScene(firstScene, false)}

        {/* ここから下はプレミアム限定 */}
        <div
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.6rem', cursor: locked ? 'pointer' : undefined, ...(locked ? clampLines(blurLinesFor(restChars), 1.65) : {}) }}
          onClick={locked ? onLockClick : undefined}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', ...blurred }}>
            {restScenes.map(s => renderScene(s, locked))}

            {restStyle.length > 0 && (
              <>
                <div style={sectionTitle}>【送り方の分析・続き】</div>
                {restStyle.map(st => (
                  <div key={st.label}><strong style={{ color: '#e9defa' }}>{st.label}：</strong>{show(st.text, locked)}</div>
                ))}
              </>
            )}

            {kit.fixes.length > 0 && (
              <>
                <div style={sectionTitle}>【やりがちなNG → こう直す】</div>
                {kit.fixes.map((f, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontSize: '0.74rem', color: '#fda4af' }}>✕ {show(f.ng, locked)}</div>
                    <div style={{ fontSize: '0.74rem', color: '#bbf7d0' }}>◯ {show(f.ok, locked)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#d6cde3' }}>{show(f.why, locked)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
          {locked && lockButton}
        </div>

        {kit.note && <div style={{ fontSize: '0.7rem', color: '#a99bbd' }}>{kit.note}</div>}
      </div>
    </div>
  );
};
