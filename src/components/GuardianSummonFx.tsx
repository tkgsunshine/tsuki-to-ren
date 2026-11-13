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

export const GuardianSummonFx: React.FC = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* noop */ }
    if (reduce || typeof IntersectionObserver === 'undefined') return;
    host.classList.add('is-summon-wait');
    let timer = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      host.classList.remove('is-summon-wait');
      host.classList.add('is-summon-play');
      timer = window.setTimeout(() => host.classList.remove('is-summon-play'), 2400);
    }, { threshold: 0.35 });
    io.observe(host);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      host.classList.remove('is-summon-wait', 'is-summon-play');
    };
  }, []);
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
