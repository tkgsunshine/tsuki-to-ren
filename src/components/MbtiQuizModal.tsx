import { useState } from 'react';
import { createPortal } from 'react-dom';
import { mbtiOptions } from '../constants/mbti';
import { getQuizQuestions, quizToMbti } from '../utils/mbtiQuiz';
import { getMbtiColor } from '../utils/mbtiColor';
import type { QuizSubject } from '../utils/mbtiQuiz';

// 16タイプがわからない人向けの「かんたん質問」（4問・2択）。答えると近いタイプを出して、入力欄に入れる。
// 16タイプは鑑定の必須入力（TAKASHI 2026-11-12）。閉じる（×）と選んでいないままになり、鑑定には進めない。
export default function MbtiQuizModal({
  subject,
  name,
  onDone,
  onClose
}: {
  subject: QuizSubject;
  /** お相手の呼び名（「ハルさん」）。自分のときは使わない */
  name?: string;
  onDone: (mbti: string) => void;
  onClose: () => void;
}) {
  const questions = getQuizQuestions(subject, name || 'お相手');
  const [answers, setAnswers] = useState<(string | null)[]>(() => questions.map(() => null));
  const result = quizToMbti(answers);
  const label = result ? (mbtiOptions.find(o => o.value === result)?.label || result) : '';
  const who = subject === 'self' ? 'あなた' : (name || 'お相手');

  const pick = (i: number, letter: string) => setAnswers(prev => prev.map((a, j) => (j === i ? letter : a)));

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(5, 7, 12, 0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'max(16px, env(safe-area-inset-top, 0px)) 16px max(16px, env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '420px', maxHeight: '100%', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', background: '#121826', border: '1px solid rgba(226, 192, 116, 0.35)', borderRadius: '16px', padding: '1.1rem 1rem 1rem', boxSizing: 'border-box', position: 'relative' }}
      >
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          style={{ position: 'absolute', top: '8px', right: '10px', background: 'none', border: 'none', color: '#a9a49a', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}
        >
          ×
        </button>
        <div className="font-serif" style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f2e2b3', marginBottom: '0.3rem', paddingRight: '1.5rem' }}>
          {subject === 'self' ? 'あなたのタイプを4つの質問で決める' : `${who}のタイプを4つの質問で決める`}
        </div>
        <div style={{ fontSize: '0.74rem', color: '#a9a49a', marginBottom: '0.9rem', lineHeight: 1.6 }}>
          {subject === 'self' ? 'いちばん近いほうを選んでください。' : `${who}を思い浮かべて、近いほうを選んでください。`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {questions.map((q, i) => (
            <div key={q.idx}>
              <div style={{ fontSize: '0.82rem', color: '#f3efe6', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                {i + 1}. {q.text}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem' }}>
                {q.options.map(o => {
                  const on = answers[i] === o.letter;
                  return (
                    <button
                      key={o.letter}
                      type="button"
                      onClick={() => pick(i, o.letter)}
                      style={{
                        textAlign: 'left',
                        background: on ? 'rgba(226, 192, 116, 0.16)' : 'rgba(255,255,255,0.03)',
                        border: on ? '1px solid var(--color-gold, #e2c074)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '0.6rem 0.75rem',
                        color: on ? '#f2e2b3' : '#d5cfc3',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          {result ? (
            <>
              <div style={{ fontSize: '0.76rem', color: '#a9a49a' }}>{who}にいちばん近いタイプ</div>
              <div className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: getMbtiColor(result), margin: '0.2rem 0 0.6rem' }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: '#a9a49a', lineHeight: 1.6, margin: '-0.2rem 0 0.6rem', textAlign: 'left' }}>
                4つの質問からの予想です。正確な16タイプがわかると、鑑定結果の精度がもっと上がります。わかったときは、あとから選び直せます。
              </div>
              <button type="button" onClick={() => onDone(result)} style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', color: '#1a1230', background: 'linear-gradient(135deg, #f2e2b3, #d4af37)' }}>
                このタイプで決める
              </button>
            </>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#a9a49a' }}>
              あと{answers.filter(a => !a).length}問です
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
