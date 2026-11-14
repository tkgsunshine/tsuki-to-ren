import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { coupleRank, COUPLE_TYPES, COUPLE_PAIR_COUNT } from '../utils/coupleRank';
import { RANK_TOPICS } from '../data/coupleTopics';

// X投稿（カップル相性ランキング）から来た人の入口（2026-11-12 TAKASHI）。
// 入力画面の上に、投稿のお題と「二人のMBTIを選ぶと何位か分かる」欄を出す。選ぶとその場で順位を見せ、
// 続けて生年月日を入れると、結果画面の「二人の相性ランキング50」で同じお題が開いた状態になる。

interface Props {
  topicNo: number;
  initialMy?: string;
  /** 「生年月日も入れて…」: 選んだMBTIを入力欄に入れて、入力欄へ */
  onContinue: (myMbti: string, oppMbti: string) => void;
}

const selectStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, padding: '0.55rem 0.5rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold',
  background: 'rgba(11, 15, 21, 0.85)', color: '#f3efe6', border: '1px solid rgba(212, 175, 55, 0.45)'
};

export const CoupleRankTeaser: React.FC<Props> = ({ topicNo, initialMy = '', onContinue }) => {
  const topic = RANK_TOPICS.find((t) => t.no === topicNo);
  const [my, setMy] = useState(COUPLE_TYPES.includes(initialMy) ? initialMy : '');
  const [opp, setOpp] = useState('');
  if (!topic) return null;
  const r = my && opp ? coupleRank(topicNo, my, opp) : null;
  const top = Boolean(r && r.rank <= 10);
  return (
    <div className="glass-panel" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem', border: '1px solid rgba(245, 215, 122, 0.45)' }}>
      <span style={{ fontSize: '0.7rem', color: '#d4af37', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Crown size={13} /> MBTI 二人の相性ランキング
      </span>
      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f3efe6', lineHeight: 1.5 }}>{topic.title}</div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#e8e2d4', lineHeight: 1.7 }}>
        二人のMBTIを選ぶと、全{COUPLE_PAIR_COUNT}組の中で何位か分かります。
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <select aria-label="あなたのMBTI" value={my} onChange={(e) => setMy(e.target.value)} style={selectStyle}>
          <option value="">あなた</option>
          {COUPLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ color: '#d4af37', fontWeight: 'bold' }}>×</span>
        <select aria-label="お相手のMBTI" value={opp} onChange={(e) => setOpp(e.target.value)} style={selectStyle}>
          <option value="">お相手</option>
          {COUPLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {r && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.45rem' }}>
            <span className="font-serif" style={{ fontSize: '2.3rem', fontWeight: 'bold', color: top ? '#f5d77a' : '#f3efe6', lineHeight: 1 }}>{r.rank}</span>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: top ? '#f5d77a' : '#f3efe6' }}>位</span>
            {/* 「1位 / 136組中」の順（2026-11-13 TAKASHI） */}
            <span style={{ fontSize: '0.8rem', color: '#bfb8a8' }}>/<span style={{ marginLeft: '0.35em' }}>{COUPLE_PAIR_COUNT}組中</span></span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#e8e2d4', lineHeight: 1.7, textAlign: 'center' }}>
            どうしてこの順位なのか、ほかの49のランキングでは何位かは、二人の生年月日を入れると見られます。
          </p>
          <button
            type="button"
            onClick={() => onContinue(my, opp)}
            style={{ padding: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88rem', color: '#1a1230', background: 'linear-gradient(135deg, #f2e2b3, #d4af37)' }}
          >
            生年月日も入れて、二人の相性をもっと見る
          </button>
        </>
      )}
      <span style={{ fontSize: '0.64rem', color: '#8f8778', textAlign: 'right' }}>月と蓮　tsuki-to-ren.com</span>
    </div>
  );
};
