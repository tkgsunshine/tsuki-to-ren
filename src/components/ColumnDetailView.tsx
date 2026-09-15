import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, Clock, Calendar, Share2, Sparkles, BookOpen, ChevronRight, HelpCircle } from 'lucide-react';
import { COLUMNS_DATA } from '../data/columnsData';

interface ColumnDetailViewProps {
  slug: string;
  onBackToList: () => void;
  onNavigateHome: () => void;
  onSelectArticle: (slug: string) => void;
}

interface ColumnCtaBoxProps {
  onNavigateHome: () => void;
  style?: React.CSSProperties;
  headingTag?: 'h2' | 'h3';
}

const ColumnCtaBox: React.FC<ColumnCtaBoxProps> = ({ onNavigateHome, style, headingTag = 'h2' }) => {
  const Heading = headingTag;
  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        borderRadius: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        border: '1.5px solid rgba(234, 179, 8, 0.5)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        ...style
      }}
    >
      <div
        style={{
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          background: 'rgba(254, 240, 138, 0.2)',
          border: '1px solid rgba(254, 240, 138, 0.5)',
          color: '#fef08a',
          fontSize: '0.72rem',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
      >
        <Sparkles size={14} />
        <span>完全無料・約2.7億通り即時鑑定</span>
      </div>
      <Heading
        className="font-serif gold-text"
        style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: 0, lineHeight: '1.4' }}
      >
        あなたとお相手の運命の相性を今すぐ確かめてみませんか？
      </Heading>
      <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0, maxWidth: '500px' }}>
        生年月日と16タイプを入力するだけで、全273,088,320通り（約2.7億通り）の算術マトリクスから二人の本格相性スコア・トリセツ（取扱説明書）・返信率MAXのLINE吉時間が瞬時に鑑定できます。
      </p>
      <button
        type="button"
        onClick={onNavigateHome}
        className="consult-btn font-serif"
        style={{
          padding: '0.85rem 1.75rem',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          borderRadius: '9999px',
          cursor: 'pointer',
          marginTop: '0.35rem',
          boxShadow: '0 8px 25px rgba(234, 179, 8, 0.4)'
        }}
      >
        ✨ 今すぐ無料で相性を鑑定する ➔
      </button>
    </div>
  );
};

/**
 * Splits article HTML content near the midpoint at an <h2> tag boundary.
 * If 2 or more <h2> tags exist, splits right before the middle <h2>.
 * Falls back to paragraph closing tag if no or only 1 <h2> tag exists.
 */
function splitArticleContent(content: string): [string, string | null] {
  if (!content) return ['', null];

  const h2Regex = /<h2[\s>]/gi;
  const matches: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = h2Regex.exec(content)) !== null) {
    matches.push(match.index);
  }

  if (matches.length >= 2) {
    // Pick the middle h2 index (e.g. 2 -> index 1, 3 -> index 2, 4 -> index 2, 5 -> index 3)
    const targetH2Index = Math.min(matches.length - 1, Math.max(1, Math.round(matches.length / 2)));
    const splitPos = matches[targetH2Index];
    return [content.slice(0, splitPos), content.slice(splitPos)];
  }

  // Fallback: If no or only 1 <h2>, split at a paragraph closing tag near halfway
  const pCloseRegex = /<\/p>/gi;
  const pMatches: number[] = [];
  while ((match = pCloseRegex.exec(content)) !== null) {
    pMatches.push(match.index + 4);
  }

  if (pMatches.length >= 2) {
    const halfLen = content.length / 2;
    let bestPos = pMatches[0];
    let minDiff = Math.abs(bestPos - halfLen);
    for (const pos of pMatches) {
      const diff = Math.abs(pos - halfLen);
      if (diff < minDiff) {
        minDiff = diff;
        bestPos = pos;
      }
    }
    return [content.slice(0, bestPos), content.slice(bestPos)];
  }

  return [content, null];
}

export const ColumnDetailView: React.FC<ColumnDetailViewProps> = ({
  slug,
  onBackToList,
  onNavigateHome,
  onSelectArticle
}) => {
  const article = COLUMNS_DATA.find(a => a.slug === slug) || COLUMNS_DATA[0];

  useEffect(() => {
    // Force reset scroll on both window and .main-content scroll container
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainContentEl = document.querySelector('.main-content');
    if (mainContentEl) {
      mainContentEl.scrollTop = 0;
    }

    // SEO Meta Injection for Article Page
    document.title = `${article.title} | 月と蓮`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', article.metaDescription);

    // Dynamic JSON-LD Structured Data Injection (Article & FAQPage & BreadcrumbList)
    const scriptId = 'column-jsonld-schema';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const canonicalUrl = `https://tsuki-to-ren.com/column/${article.slug}`;

    const jsonLdData = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': article.title,
        'description': article.metaDescription,
        'image': article.thumbnailUrl,
        'datePublished': article.publishedAt,
        'dateModified': article.publishedAt,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        'author': {
          '@type': 'Organization',
          'name': '月と蓮 占い編集部'
        },
        'publisher': {
          '@type': 'Organization',
          'name': '月と蓮',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://tsuki-to-ren.com/favicon.ico'
          }
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'ホーム',
            'item': 'https://tsuki-to-ren.com/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': '開運コラム',
            'item': 'https://tsuki-to-ren.com/column'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': article.title,
            'item': canonicalUrl
          }
        ]
      }
    ];

    if (article.faqs && article.faqs.length > 0) {
      jsonLdData.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': article.faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      } as any);
    }

    script.textContent = JSON.stringify(jsonLdData);

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [slug, article]);

  // Related Articles
  const relatedArticles = COLUMNS_DATA.filter(a => a.slug !== slug && new Date(a.publishedAt) <= new Date()).slice(0, 3);

  // Split content at midpoint for midway CTA insertion
  const [firstContentPart, secondContentPart] = useMemo(() => {
    return splitArticleContent(article.content);
  }, [article.content]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.metaDescription,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('記事URLをコピーしました！');
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '680px',
      margin: '0 auto',
      padding: '1.25rem 1rem 6rem',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Top Back Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBackToList}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '0.4rem 0.85rem',
            color: '#cbd5e1',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={14} /> コラム一覧へ戻る
        </button>

        <button
          type="button"
          onClick={handleShare}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(226, 192, 116, 0.15)',
            border: '1px solid rgba(226, 192, 116, 0.35)',
            borderRadius: '20px',
            padding: '0.4rem 0.85rem',
            color: '#fef08a',
            fontSize: '0.78rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          <Share2 size={14} /> シェア
        </button>
      </div>

      {/* Main Article Container */}
      <article className="glass-panel" style={{
        padding: '1.5rem 1.25rem',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        {/* Category Tag & Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
          <span style={{
            fontSize: '0.72rem',
            padding: '3px 10px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#d8b4fe',
            fontWeight: 'bold'
          }}>
            {article.category}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={12} /> {article.publishedAt.split('T')[0].replace(/-/g, '/')}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> 読了目安 {article.readTimeMinutes}分
          </span>
        </div>

        {/* H1 Title */}
        <h1 className="font-serif gold-text" style={{
          fontSize: '1.35rem',
          fontWeight: 'bold',
          lineHeight: '1.4',
          margin: '0 0 1rem 0'
        }}>
          {article.title}
        </h1>

        {/* Featured Thumbnail */}
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '14px',
          overflow: 'hidden',
          marginBottom: '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Table of Contents (TOC) Component (Regulated 2-level numbering) */}
        {article.toc && article.toc.length > 0 && (
          <nav style={{
            background: 'rgba(15, 10, 30, 0.65)',
            border: '1px solid rgba(226, 192, 116, 0.3)',
            borderRadius: '14px',
            padding: '1rem 1.15rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fef08a', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
              <BookOpen size={16} /> 目次
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {article.toc.map((item) => (
                <li key={item.id} style={{ paddingLeft: item.level === 2 ? '1rem' : '0' }}>
                  <a
                    href={`#${item.id}`}
                    style={{
                      color: item.level === 1 ? '#e2e8f0' : '#cbd5e1',
                      fontSize: item.level === 1 ? '0.82rem' : '0.78rem',
                      fontWeight: item.level === 1 ? 'bold' : 'normal',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span style={{ color: '#e2c074' }}>•</span> {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Article Body HTML Content with Midway CTA */}
        {secondContentPart ? (
          <>
            <div
              className="article-body-content"
              dangerouslySetInnerHTML={{ __html: firstContentPart }}
              style={{
                color: '#e2e8f0',
                fontSize: '0.88rem',
                lineHeight: '1.8',
                wordBreak: 'break-word'
              }}
            />
            <ColumnCtaBox
              onNavigateHome={onNavigateHome}
              headingTag="h3"
              style={{ margin: '2rem 0' }}
            />
            <div
              className="article-body-content"
              dangerouslySetInnerHTML={{ __html: secondContentPart }}
              style={{
                color: '#e2e8f0',
                fontSize: '0.88rem',
                lineHeight: '1.8',
                wordBreak: 'break-word'
              }}
            />
          </>
        ) : (
          <div
            className="article-body-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
            style={{
              color: '#e2e8f0',
              fontSize: '0.88rem',
              lineHeight: '1.8',
              wordBreak: 'break-word'
            }}
          />
        )}

        {/* Structured FAQ Section */}
        {article.faqs && article.faqs.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
            <h3 className="font-serif gold-text" style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
              <HelpCircle size={16} /> よくある質問 (FAQ)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {article.faqs.map((faq, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fef08a', marginBottom: '0.35rem' }}>
                    Q. {faq.question}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.55' }}>
                    A. {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* High-Converting Bottom CTA Box */}
      <ColumnCtaBox onNavigateHome={onNavigateHome} headingTag="h2" />

      {/* Related Articles Carousel / List */}
      {relatedArticles.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <h3 className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            おすすめの関連コラム
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectArticle(rel.slug)}
                className="glass-panel"
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#cbd5e1', paddingRight: '0.5rem' }}>
                  {rel.title}
                </div>
                <ChevronRight size={16} style={{ color: '#fef08a', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
