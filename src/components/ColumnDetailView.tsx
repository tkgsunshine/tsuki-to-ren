import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Calendar, Share2, BookOpen, ChevronRight, HelpCircle, Heart } from 'lucide-react';
import { COLUMNS_DATA } from '../data/columnsData';
import type { ColumnArticle } from '../data/columnsData';
import { trackColumnCta } from '../services/analytics';
import { pickRelatedColumns } from '../utils/relatedColumns';
import { columnAnswer, columnModified } from '../utils/columnAnswer';
import { showAlert } from './AppDialog';

interface ColumnDetailViewProps {
  slug: string;
  onBackToList: () => void;
  onNavigateHome: (prefill?: FortunePrefill) => void;
  onSelectArticle: (slug: string) => void;
}

type FortunePrefill = { myBirth?: string; oppBirth?: string };

const formatBirthDate = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
};

// 入力欄の値（YYYY/MM/DD）を、日付として正しいときだけ YYYY-MM-DD にする
const toIsoBirth = (val: string): string | undefined => {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(val);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (y < 1900 || date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d || date > new Date()) return undefined;
  return `${m[1]}-${m[2]}-${m[3]}`;
};

const savedMyBirth = (): string => {
  try {
    const parsed = JSON.parse(localStorage.getItem('hasu_user_profile') || '{}');
    return typeof parsed.birth === 'string' ? parsed.birth.replace(/-/g, '/') : '';
  } catch {
    return '';
  }
};

const ctaBoxStyle: React.CSSProperties = {
  padding: '1.4rem 1.25rem',
  borderRadius: '20px',
  textAlign: 'center',
  background: 'linear-gradient(135deg, rgba(217, 164, 65, 0.15) 0%, rgba(159, 134, 192, 0.15) 100%)',
  border: '1.5px solid rgba(217, 164, 65, 0.5)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem'
};

const ctaButtonStyle: React.CSSProperties = {
  padding: '0.85rem 1.5rem',
  fontSize: '0.92rem',
  fontWeight: 'bold',
  borderRadius: '9999px',
  cursor: 'pointer',
  marginTop: '0.2rem',
  boxShadow: '0 8px 25px rgba(217, 164, 65, 0.4)'
};

const ctaNoteStyle: React.CSSProperties = { fontSize: '0.7rem', color: '#b8b0c6', margin: 0 };

const birthInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '10px',
  padding: '0.6rem 0.5rem',
  color: 'white',
  outline: 'none',
  fontSize: '16px', // 16px未満だと iOS Safari が入力時に画面を拡大する
  textAlign: 'center'
};

const CTA_GETS: { icon: React.ReactNode; label: string }[] = [
  { icon: <Heart size={12} />, label: '相性スコア' },
  { icon: <BookOpen size={12} />, label: 'トリセツ' },
  { icon: <Clock size={12} />, label: 'LINE吉時間' }
];

/** 記事の途中の案内：分かることを短く見せ、その場で二人の生年月日を入れて鑑定の入力画面へ */
const ColumnMidCta: React.FC<{ onNavigateHome: (prefill?: FortunePrefill) => void }> = ({ onNavigateHome }) => {
  const [myBirth, setMyBirth] = useState(savedMyBirth);
  const [oppBirth, setOppBirth] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackColumnCta('mid');
    onNavigateHome({ myBirth: toIsoBirth(myBirth), oppBirth: toIsoBirth(oppBirth) });
  };

  const field = (label: string, value: string, setValue: (v: string) => void, placeholder: string) => (
    <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left' }}>
      <span style={{ fontSize: '0.72rem', color: '#e8dfc9', fontWeight: 'bold' }}>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(formatBirthDate(e.target.value))}
        style={birthInputStyle}
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ ...ctaBoxStyle, margin: '2rem 0' }}>
      <h3 className="font-serif gold-text" style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, lineHeight: '1.45' }}>
        あの人との相性、<br />無料で占ってみませんか？
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.3rem' }}>
        {CTA_GETS.map((g) => (
          <span
            key={g.label}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.28rem 0.5rem', borderRadius: '9999px', background: 'rgba(242, 226, 179, 0.12)', border: '1px solid rgba(242, 226, 179, 0.35)', color: '#f2e2b3', fontSize: '0.68rem', whiteSpace: 'nowrap', fontWeight: 'bold' }}
          >
            {g.icon}{g.label}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', width: '100%' }}>
        {field('あなたの生年月日', myBirth, setMyBirth, '20010418')}
        {field('お相手の生年月日', oppBirth, setOppBirth, '20000921')}
      </div>
      <button type="submit" className="consult-btn font-serif" style={ctaButtonStyle}>
        相性を占う（無料） ➔
      </button>
      <p style={ctaNoteStyle}>数字8桁で入力。16タイプは次の画面で選べます</p>
    </form>
  );
};

interface EndCtaCopy {
  char: 'tsuki' | 'ren';
  heading: string;
  message: string;
  button: string;
}

const LINE_COPY: EndCtaCopy = {
  char: 'ren',
  heading: 'あの人に送るなら、今日は何時？',
  message: '記事のコツは、相手によって効き方が変わる。二人の相性から、今日あの人に送るといい時間まで出せるよ。',
  button: '二人のLINE吉時間を見る'
};
const SHICHU_COPY: EndCtaCopy = {
  char: 'ren',
  heading: '記事の星を、二人で出してみよう',
  message: '読んだ内容が、自分とあの人にどう当てはまるか。二人の生年月日から、性格の傾向と相性をまとめて出せるよ。',
  button: '二人の相性を見る'
};

// 記事の種類ごとの、記事のあとの案内（見出し・月か蓮の一言・ボタン）
const END_CTA_COPY: Record<ColumnArticle['category'], EndCtaCopy> = {
  '恋愛アプローチ・トリセツ': {
    char: 'tsuki',
    heading: 'あの人のトリセツ、見てみませんか？',
    message: '記事のコツも、相手のタイプによって合う・合わないがあるの。二人の生年月日から、あの人の取扱説明書と相性を出してみるね。',
    button: 'あの人のトリセツを見る'
  },
  '16タイプ・MBTI相性': {
    char: 'ren',
    heading: '16タイプに、生まれた日を重ねると',
    message: '16タイプだけだと、同じタイプ同士はみんな同じ結果になる。生年月日も入れると、二人だけの相性が出せるよ。',
    button: '二人だけの相性を見る'
  },
  'LINE攻略・アプローチ': LINE_COPY,
  'LINE攻略・16タイプ': LINE_COPY,
  'ツインレイ・運命の絆': {
    char: 'tsuki',
    heading: '二人のご縁、生まれた日から見てみませんか？',
    message: '運命の相手かどうか、気になるよね。二人の生年月日から、ひかれ合うところと、すれ違いやすいところを一緒に見てみよう。',
    button: '二人の相性を見る'
  },
  '復縁・引き寄せ': {
    char: 'tsuki',
    heading: 'いまの二人の流れを、一緒に見てみませんか？',
    message: '焦らなくて大丈夫。二人の相性と、今日のあの人との流れを見てから、次の一歩を考えようね。',
    button: 'いまの二人の相性を見る'
  },
  '四柱推命・特殊星': SHICHU_COPY,
  '四柱推命入門': SHICHU_COPY,
  '九星気学・バイオリズム': {
    char: 'ren',
    heading: '今日の二人の流れを見てみよう',
    message: '運気には波がある。二人の相性に今日の流れを重ねて、動きやすい時間を出せるよ。',
    button: '今日の二人の流れを見る'
  },
  '未来予測・結婚運': {
    char: 'tsuki',
    heading: '二人のこれから、のぞいてみませんか？',
    message: '未来は決まっていないけれど、二人の相性を知っておくと、これからを話し合うときのヒントになるよ。',
    button: '二人の相性を見る'
  }
};

const DEFAULT_END_COPY: EndCtaCopy = {
  char: 'tsuki',
  heading: 'あの人との相性、見てみませんか？',
  message: '二人の生年月日から、相性スコアとあの人のトリセツ、今日のLINEの吉時間を出してみるね。',
  button: '二人の相性を見る'
};

const CHAR_STYLE = {
  tsuki: { name: '月', img: '/assets/tsuki.webp', ring: 'rgba(214, 139, 164, 0.6)', bg: 'rgba(214, 139, 164, 0.08)', border: 'rgba(214, 139, 164, 0.3)', nameColor: '#e8b7c7' },
  ren: { name: '蓮', img: '/assets/ren.webp', ring: 'rgba(58, 134, 171, 0.7)', bg: 'rgba(58, 134, 171, 0.1)', border: 'rgba(58, 134, 171, 0.4)', nameColor: '#8fc6e0' }
};

/** 記事のあとの案内：記事の種類に合わせて、月か蓮が一言そえる */
const ColumnEndCta: React.FC<{ category: ColumnArticle['category']; onNavigateHome: () => void }> = ({ category, onNavigateHome }) => {
  const copy = END_CTA_COPY[category] || DEFAULT_END_COPY;
  const ch = CHAR_STYLE[copy.char];
  return (
    <div className="glass-panel" style={ctaBoxStyle}>
      <h2 className="font-serif gold-text" style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, lineHeight: '1.45' }}>
        {copy.heading}
      </h2>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', textAlign: 'left', maxWidth: '500px' }}>
        <img
          src={ch.img}
          alt={ch.name}
          loading="lazy"
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 12%', border: `1.5px solid ${ch.ring}`, flexShrink: 0 }}
        />
        <div
          style={{ flex: 1, padding: '0.7rem 0.9rem', background: ch.bg, border: `1px solid ${ch.border}`, borderRadius: '4px 16px 16px 16px', fontSize: '0.82rem', color: '#f0ebf5', lineHeight: '1.7' }}
        >
          <div style={{ fontSize: '0.68rem', color: ch.nameColor, fontWeight: 'bold', marginBottom: '0.2rem' }}>{ch.name}</div>
          {copy.message}
        </div>
      </div>
      <button
        type="button"
        onClick={() => { trackColumnCta('end'); onNavigateHome(); }}
        className="consult-btn font-serif"
        style={ctaButtonStyle}
      >
        {copy.button} ➔
      </button>
      <p style={ctaNoteStyle}>無料で占えます</p>
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

    const canonicalUrl = `https://www.tsuki-to-ren.com/column/${article.slug}`;

    const jsonLdData = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': article.title,
        'description': article.metaDescription,
        'image': article.thumbnailUrl.startsWith('/') ? `https://www.tsuki-to-ren.com${article.thumbnailUrl}` : article.thumbnailUrl,
        'datePublished': article.publishedAt,
        'dateModified': columnModified(article),
        'abstract': columnAnswer(article),
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        'author': {
          '@type': 'Organization',
          'name': '月と蓮 占い編集部',
          'url': 'https://www.tsuki-to-ren.com/'
        },
        'publisher': {
          '@type': 'Organization',
          'name': '月と蓮',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://www.tsuki-to-ren.com/favicon.ico'
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
            'item': 'https://www.tsuki-to-ren.com/'
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
  const relatedArticles = pickRelatedColumns(COLUMNS_DATA, slug, 3);

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
      showAlert('記事URLをコピーしました！');
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
            color: '#d8d2c6',
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
            color: '#f2e2b3',
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
            background: 'rgba(159, 134, 192, 0.2)',
            border: '1px solid rgba(159, 134, 192, 0.4)',
            color: '#cdbfe2',
            fontWeight: 'bold'
          }}>
            {article.category}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#a9a49a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={12} /> {article.publishedAt.split('T')[0].replace(/-/g, '/')}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#a9a49a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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

        {/* 結論（AI検索・検索結果の要約に引用されやすいよう、目次より先に置く） */}
        <section aria-label="この記事の結論" style={{
          background: 'rgba(226, 192, 116, 0.08)',
          border: '1px solid rgba(226, 192, 116, 0.35)',
          borderRadius: '14px',
          padding: '0.9rem 1.1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ color: '#f2e2b3', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.4rem' }}>この記事の結論</div>
          <p style={{ margin: 0, color: '#f3efe6', fontSize: '0.9rem', lineHeight: 1.75 }}>{columnAnswer(article)}</p>
        </section>

        {/* Table of Contents (TOC) Component (Regulated 2-level numbering) */}
        {article.toc && article.toc.length > 0 && (
          <nav style={{
            background: 'rgba(13, 18, 26, 0.65)',
            border: '1px solid rgba(226, 192, 116, 0.3)',
            borderRadius: '14px',
            padding: '1rem 1.15rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f2e2b3', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
              <BookOpen size={16} /> 目次
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {article.toc.map((item) => (
                <li key={item.id} style={{ paddingLeft: item.level === 2 ? '1rem' : '0' }}>
                  <a
                    href={`#${item.id}`}
                    style={{
                      color: item.level === 1 ? '#e7e1d5' : '#d8d2c6',
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
                color: '#e7e1d5',
                fontSize: '0.88rem',
                lineHeight: '1.8',
                wordBreak: 'break-word'
              }}
            />
            <ColumnMidCta onNavigateHome={onNavigateHome} />
            <div
              className="article-body-content"
              dangerouslySetInnerHTML={{ __html: secondContentPart }}
              style={{
                color: '#e7e1d5',
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
              color: '#e7e1d5',
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
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#f2e2b3', marginBottom: '0.35rem' }}>
                    Q. {faq.question}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#d8d2c6', lineHeight: '1.55' }}>
                    A. {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* High-Converting Bottom CTA Box */}
      <ColumnEndCta category={article.category} onNavigateHome={() => onNavigateHome()} />

      {/* Related Articles Carousel / List */}
      {relatedArticles.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <h3 className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            おすすめの関連コラム
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {relatedArticles.map((rel) => (
              <a
                key={rel.id}
                href={`/column/${rel.slug}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  onSelectArticle(rel.slug);
                }}
                className="glass-panel"
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#d8d2c6', paddingRight: '0.5rem' }}>
                  {rel.title}
                </div>
                <ChevronRight size={16} style={{ color: '#f2e2b3', flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
