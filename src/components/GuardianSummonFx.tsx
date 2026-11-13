import React, { useEffect, useRef } from 'react';

// 鑑定結果の守護獣カードが画面に入ったとき1回だけ流す「召喚」の演出（約1.8秒）。
// 親の .guardian-hero に is-summon-wait → is-summon-play を付ける。光の層はタップを素通りする。
// 「視差効果を減らす」の端末と、IntersectionObserver が無い環境では何もしない（普通に表示）。
const SPARKS = [
  { x: 18, y: 70, d: 0.55, s: 3 }, { x: 30, y: 58, d: 0.75, s: 2 }, { x: 42, y: 74, d: 0.6, s: 4 },
  { x: 55, y: 62, d: 0.85, s: 2 }, { x: 66, y: 72, d: 0.65, s: 3 }, { x: 78, y: 60, d: 0.9, s: 2 },
  { x: 86, y: 76, d: 0.7, s: 3 }, { x: 10, y: 80, d: 0.95, s: 2 }, { x: 48, y: 82, d: 1.0, s: 3 },
  { x: 72, y: 84, d: 1.05, s: 2 },
];

// 見比べ用（仮）: ?gsa=b で月光のベール、?gsa=c で蓮の花びら。決まったら1つに絞る
const variant = (): 'a' | 'b' | 'c' => {
  try {
    const v = new URLSearchParams(window.location.search).get('gsa');
    return v === 'b' || v === 'c' ? v : 'a';
  } catch { return 'a'; }
};

const PETALS = [
  { x: 8, d: 0.0, r: -30, s: 1 }, { x: 22, d: 0.15, r: 20, s: 0.8 }, { x: 36, d: 0.05, r: -10, s: 1.1 },
  { x: 50, d: 0.25, r: 40, s: 0.9 }, { x: 64, d: 0.1, r: -45, s: 1 }, { x: 78, d: 0.3, r: 15, s: 0.85 },
  { x: 90, d: 0.2, r: -20, s: 1.05 }, { x: 14, d: 0.4, r: 35, s: 0.75 }, { x: 44, d: 0.45, r: -35, s: 0.9 },
  { x: 70, d: 0.5, r: 25, s: 0.8 },
];

export const GuardianSummonFx: React.FC = () => {
  const v = variant();
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* noop */ }
    if (reduce || typeof IntersectionObserver === 'undefined') return;
    host.classList.add('is-summon-wait', `gs-v-${v}`);
    let timer = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      host.classList.remove('is-summon-wait');
      host.classList.add('is-summon-play');
      timer = window.setTimeout(() => host.classList.remove('is-summon-play'), 2400);
    // カードの上端が画面の上から6割の線を越えたら始める（2026-11-13 TAKASHI「このくらいまでスクロールしたら」＝絵が半分ほど見えた所）
    }, { threshold: 0, rootMargin: '0px 0px -40% 0px' });
    io.observe(host);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      host.classList.remove('is-summon-wait', 'is-summon-play', `gs-v-${v}`);
    };
  }, [v]);
  if (v === 'b') {
    return (
      <div ref={ref} className="guardian-summon" aria-hidden="true">
        <div className="gs-veil" />
        <div className="gs-veil-edge" />
        <div className="gs-veil-moon" />
        {SPARKS.map((p, i) => (
          <span key={i} className="guardian-summon-spark" style={{ left: `${p.x}%`, top: `${p.y - 40}%`, width: `${p.s}px`, height: `${p.s}px`, animationDelay: `${p.d * 0.6 + 0.3}s` }} />
        ))}
      </div>
    );
  }
  if (v === 'c') {
    return (
      <div ref={ref} className="guardian-summon" aria-hidden="true">
        <div className="gs-bloom-ring" />
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="gs-petal"
            style={{ left: `${p.x}%`, animationDelay: `${p.d}s`, ['--r' as string]: `${p.r}deg`, ['--s' as string]: p.s } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }
  return (
    <div ref={ref} className="guardian-summon" aria-hidden="true">
      <div className="guardian-summon-pillar" />
      <svg className="guardian-summon-circle" viewBox="-50 -50 100 100">
        <circle r="46" className="gs-ring gs-ring-outer" />
        <circle r="38" className="gs-ring gs-ring-dash" />
        <circle r="30" className="gs-ring" />
        <polygon points="0,-38 33,19 -33,19" className="gs-ring gs-tri" />
        <polygon points="0,38 33,-19 -33,-19" className="gs-ring gs-tri" />
      </svg>
      {SPARKS.map((p, i) => (
        <span
          key={i}
          className="guardian-summon-spark"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}px`, height: `${p.s}px`, animationDelay: `${p.d}s` }}
        />
      ))}
    </div>
  );
};
