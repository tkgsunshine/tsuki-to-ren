import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Compass } from 'lucide-react';

export const SeoFooterSection: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const seoFaqs = [
    {
      q: '『月と蓮』の恋愛占い・相性診断とはどのようなサービスですか？',
      a: '『月と蓮』は、東洋の最高峰占術である「四柱推命（命式・本質）」と「九星気学（運気バイオリズム）」、そして現代の心理統計学「16タイプ性格診断（コミュニケーションの癖）」を組み合わせたハイブリッド型恋愛相性診断です。気になるお相手との相性スコアや、返信率を高めるLINE送信推奨時刻（吉時間）、お相手の取扱説明書（トリセツ）を即座に鑑定制成します。'
    },
    {
      q: '四柱推命の「魁罡（かいごう）」とは何ですか？',
      a: '魁罡（かいごう）とは、四柱推命の日干支（戊戌・庚戌・壬辰・庚辰の4種）に現れるわずか3.3%のレア属性です。凄まじい決断力・カリスマ性・逆境を覆す勝負運を秘めており、『月と蓮』では魁罡をお持ちの方専用のオーラ演出と個別の運命解説を提供しています。'
    },
    {
      q: '相性診断で相手のMBTI（16タイプ）がわからない場合はどうすればいいですか？',
      a: 'お相手の生年月日（四柱推命・九星気学）だけでも非常に高い精度で基本相性や運気のバイオリズムを鑑定可能です。16タイプを選択していただくと、より具体的なメッセージの送り方や会話の引き出し方（トリセツ）が解放されます。'
    },
    {
      q: 'どのようなキーワードや相性悩みに対応していますか？',
      a: '「片思いの相手の気持ち」「復縁の可能性・タイミング」「ツインレイ・ソウルメイト判定」「LINEの既読スルー対策」「16タイプ別恋愛相性ワースト・ベスト」「結婚・同棲の適性時期」など、あらゆる恋愛の悩みにAI守護キャラクター（月・蓮）がお応えします。'
    }
  ];

  return (
    <footer style={{
      marginTop: '0.75rem',
      padding: '1.25rem 1.25rem 0.5rem',
      background: 'linear-gradient(180deg, rgba(10, 7, 24, 0) 0%, rgba(13, 9, 32, 0.95) 20%, rgba(8, 5, 20, 0.99) 100%)',
      borderTop: '1px solid rgba(226, 192, 116, 0.15)',
      color: '#cbd5e1',
      fontSize: '0.78rem',
      lineHeight: '1.6',
      flexShrink: 0,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* SEO Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.85rem',
            background: 'rgba(226, 192, 116, 0.08)',
            border: '1px solid rgba(226, 192, 116, 0.25)',
            borderRadius: '20px',
            color: '#e2c074',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            marginBottom: '0.75rem'
          }}>
            <Compass size={13} />
            <span>四柱推命 × 九星気学 × 16タイプ心理学</span>
          </div>
          <h2 className="font-serif gold-text" style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            無料本格恋愛相性占い『月と蓮』| 片思い・復縁・好きな人の本音鑑定
          </h2>
          <p style={{ fontSize: '0.73rem', color: '#94a3b8', margin: 0, lineHeight: '1.55' }}>
            四柱推命・九星気学・16タイプ（MBTI）で片思い・復縁・好きな人との本気度を無料診断。二人の運命バイオリズムとお相手のトリセツ、心を掴むLINE吉時間を導き出します。
          </p>
        </div>

        {/* E-E-A-T Academic & Calculation Logic Box */}
        <div style={{
          padding: '1.15rem',
          background: 'rgba(226, 192, 116, 0.03)',
          border: '1px solid rgba(226, 192, 116, 0.2)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <h3 className="font-serif gold-text" style={{ fontSize: '0.88rem', fontWeight: 'bold', margin: '0 0 0.45rem 0' }}>
            鑑定精度と算出ロジックについて（E-E-A-T）
          </h3>
          <p style={{ fontSize: '0.71rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
            『月と蓮』の鑑定アルゴリズムは、伝統的な東洋占星術（萬年暦における蔵干・天干地支五行説）と、気学における九星周行モデル、および心理統計学（16要素行動特性マトリクス）の文献・データを精査し、独自開発された算術プログラムによって算出されています。
          </p>
        </div>

        {/* SEO FAQ Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#e2c074', fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
            <HelpCircle size={16} />
            <span>よくあるご質問（FAQ）</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {seoFaqs.map((faq, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: '#f3f4f6',
                    fontSize: '0.76rem',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>Q. {faq.q}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: activeFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      color: '#9ca3af',
                      flexShrink: 0,
                      marginLeft: '0.5rem'
                    }}
                  />
                </button>
                {activeFaq === idx && (
                  <div style={{
                    padding: '0 0.9rem 0.75rem',
                    fontSize: '0.71rem',
                    color: '#94a3b8',
                    lineHeight: '1.55',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.05)',
                    paddingTop: '0.55rem'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Popular 16-Type Combinations Section */}
        <div style={{
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px'
        }}>
          <h3 className="font-serif gold-text" style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 0.6rem 0', textAlign: 'center' }}>
            人気の16タイプ（MBTI）恋愛相性診断
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
            {[
              { pair: 'infp-enfj', label: 'INFP × ENFJ' },
              { pair: 'enfp-intj', label: 'ENFP × INTJ' },
              { pair: 'infj-entp', label: 'INFJ × ENTP' },
              { pair: 'intp-entj', label: 'INTP × ENTJ' },
              { pair: 'isfj-esfp', label: 'ISFJ × ESFP' },
              { pair: 'isfp-esfj', label: 'ISFP × ESFJ' },
              { pair: 'istj-estp', label: 'ISTJ × ESTP' },
              { pair: 'istp-estj', label: 'ISTP × ESTJ' },
              { pair: 'enfp-infj', label: 'ENFP × INFJ' },
              { pair: 'infp-intp', label: 'INFP × INTP' },
              { pair: 'enfj-esfj', label: 'ENFJ × ESFJ' },
              { pair: 'intj-entp', label: 'INTJ × ENTP' }
            ].map(item => (
              <a
                key={item.pair}
                href={`/compatibility/${item.pair}`}
                style={{
                  fontSize: '0.72rem',
                  color: '#cbd5e1',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <a
              href="/compatibility"
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-gold)',
                textDecoration: 'underline',
                fontWeight: 'bold'
              }}
            >
              全256通りの16タイプ恋愛相性一覧を見る →
            </a>
          </div>
        </div>

        {/* Footer Navigation Links */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem 1.25rem',
          justifyContent: 'center',
          fontSize: '0.72rem',
          color: '#94a3b8'
        }}>
          <a href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>恋愛診断ホーム</a>
          <a href="/column" style={{ color: '#cbd5e1', textDecoration: 'none' }}>開運コラム</a>
          <a href="/compatibility" style={{ color: '#cbd5e1', textDecoration: 'none' }}>16タイプ相性一覧</a>
          <a href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>利用規約</a>
          <a href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>プライバシーポリシー</a>
          <a href="/tokushoho" style={{ color: '#94a3b8', textDecoration: 'none' }}>特定商取引法に基づく表記</a>
          <a href="/company" style={{ color: '#94a3b8', textDecoration: 'none' }}>運営会社</a>
        </div>

        {/* Copyright */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.68rem',
          color: '#64748b',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1.25rem'
        }}>
          <p style={{ margin: '0 0 0.35rem 0' }}>
            © {new Date().getFullYear()} 月と蓮（Hasu to Tsuki） - 本格四柱推命・九星気学・16タイプ相性診断
          </p>
          <p style={{ margin: 0, fontSize: '0.64rem', color: '#475569' }}>
            当サービスの鑑定ロジックは東洋占術および心理統計データに基づくエンターテインメント・アドバイスです。
          </p>
        </div>

      </div>
    </footer>
  );
};
