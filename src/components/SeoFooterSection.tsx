import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Compass } from 'lucide-react';
import topFaqs from '../data/topFaqs.json';

export const SeoFooterSection: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // トップのよくある質問。index.html の FAQ構造化データ（JSON-LD）も同じファイルからビルド時に作る（vite.config.ts）
  const seoFaqs = topFaqs;

  return (
    <footer style={{
      marginTop: '0.75rem',
      padding: '1.25rem 1.25rem 0.5rem',
      background: 'linear-gradient(180deg, rgba(10, 13, 19, 0) 0%, rgba(13, 17, 25, 0.95) 20%, rgba(8, 11, 15, 0.99) 100%)',
      borderTop: '1px solid rgba(226, 192, 116, 0.15)',
      color: '#d8d2c6',
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
          <p style={{ fontSize: '0.73rem', color: '#a39d91', margin: 0, lineHeight: '1.55' }}>
            四柱推命・九星気学・16タイプ（MBTI）で片思い・復縁・好きな人との本気度を無料診断。二人の運命バイオリズムとお相手のトリセツ、心を掴むLINE吉時間を導き出します。
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
                    color: '#f3efe6',
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
                      color: '#a9a49a',
                      flexShrink: 0,
                      marginLeft: '0.5rem'
                    }}
                  />
                </button>
                {/* 答えは閉じていてもHTMLに残す（検索エンジンが読めるように） */}
                <div hidden={activeFaq !== idx} style={{
                  padding: '0 0.9rem 0.75rem',
                  fontSize: '0.71rem',
                  color: '#a39d91',
                  lineHeight: '1.55',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.05)',
                  paddingTop: '0.55rem'
                }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation Links */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem 1.25rem',
          justifyContent: 'center',
          fontSize: '0.72rem',
          color: '#a39d91'
        }}>
          <a href="/" style={{ color: '#d8d2c6', textDecoration: 'none' }}>恋愛診断ホーム</a>
          <a href="/column" style={{ color: '#d8d2c6', textDecoration: 'none' }}>開運コラム</a>
          <a href="/compatibility" style={{ color: '#d8d2c6', textDecoration: 'none' }}>16タイプ恋愛相性表</a>
          <a href="/guardians" style={{ color: '#d8d2c6', textDecoration: 'none' }}>守護獣図鑑</a>
          <a href="/terms" style={{ color: '#a39d91', textDecoration: 'none' }}>利用規約</a>
          <a href="/privacy" style={{ color: '#a39d91', textDecoration: 'none' }}>プライバシーポリシー</a>
          <a href="/tokushoho" style={{ color: '#a39d91', textDecoration: 'none' }}>特定商取引法に基づく表記</a>
          <a href="/company" style={{ color: '#a39d91', textDecoration: 'none' }}>運営会社</a>
        </div>

        {/* Copyright */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.68rem',
          color: '#736e65',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1.25rem'
        }}>
          <p style={{ margin: '0 0 0.35rem 0' }}>
            © {new Date().getFullYear()} 月と蓮（Tsuki to Ren） - 本格四柱推命・九星気学・16タイプ相性診断
          </p>
          <p style={{ margin: 0, fontSize: '0.64rem', color: '#475569' }}>
            当サービスの鑑定ロジックは東洋占術と16タイプ性格診断の考え方に基づくエンターテインメント・アドバイスです。
          </p>
        </div>

      </div>
    </footer>
  );
};
