import React, { useState } from 'react';
import { BookOpen, Search, Clock, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { COLUMNS_DATA } from '../data/columnsData';

interface ColumnListViewProps {
  onSelectArticle: (slug: string) => void;
  onNavigateHome: () => void;
}

export const ColumnListView: React.FC<ColumnListViewProps> = ({
  onSelectArticle,
  onNavigateHome
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  const categories = [
    'ALL',
    '四柱推命・特殊星',
    '16タイプ・MBTI相性',
    'ツインレイ・運命の絆',
    'LINE攻略・アプローチ',
    '九星気学・バイオリズム'
  ];

  const now = new Date();
  const filteredArticles = COLUMNS_DATA.filter((art) => {
    const isPublished = new Date(art.publishedAt) <= now;
    const matchesCategory = selectedCategory === 'ALL' || art.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.metaDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return isPublished && matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;

  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div style={{
      width: '100%',
      margin: '0 auto',
      padding: '1.25rem 1rem 6rem',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
        border: '1px solid rgba(226, 192, 116, 0.3)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(226, 192, 116, 0.15)',
          border: '1px solid rgba(226, 192, 116, 0.4)',
          color: '#fef08a',
          fontSize: '0.72rem',
          fontWeight: 'bold'
        }}>
          <BookOpen size={14} />
          <span>月と蓮 開運コラム ＆ 恋愛解体新書</span>
        </div>
        <h1 className="font-serif gold-text" style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: '0.2rem 0', lineHeight: '1.4' }}>
          四柱推命 × 16タイプで紐解く<br />恋愛成就・相性攻略ガイド
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
          魁罡（かいごう）の強運本質、16タイプ相性分析、LINEの吉時間、復縁・ツインレイの深層知識を分かりやすく解説。
        </p>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          className="column-search-input"
          placeholder="キーワードでコラムを検索（例: 魁罡, INTJ, LINE吉時間）"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 2.75rem',
            borderRadius: '14px',
            background: 'rgba(15, 10, 30, 0.92)',
            border: '1.5px solid rgba(226, 192, 116, 0.5)',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 'bold',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
          }}
        />
        <Search size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#fef08a' }} />
      </div>

      {/* Category Pill Filters (Multi-line 2-3 rows) */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.45rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              border: selectedCategory === cat ? '1.5px solid #fef08a' : '1px solid rgba(255, 255, 255, 0.25)',
              background: selectedCategory === cat ? 'linear-gradient(135deg, rgba(254, 240, 138, 0.3) 0%, rgba(217, 119, 6, 0.4) 100%)' : 'rgba(15, 10, 30, 0.85)',
              color: selectedCategory === cat ? '#fef08a' : '#e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedCategory === cat ? '0 0 12px rgba(254, 240, 138, 0.3)' : 'none'
            }}
          >
            {cat === 'ALL' ? '全コラム' : cat}
          </button>
        ))}
      </div>

      {/* Article Grid List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {paginatedArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 'bold' }}>
            検索結果が見つかりませんでした。「魁罡」や「16タイプ」などキーワードを変えてお試しください。
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <article
              key={article.id}
              onClick={() => onSelectArticle(article.slug)}
              className="glass-panel"
              style={{
                padding: '1rem',
                borderRadius: '16px',
                display: 'flex',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 10, 30, 0.85)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.5)'
              }}
            >
              {/* Thumbnail Image */}
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#110c26',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Info Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#d8b4fe',
                      fontWeight: 'bold'
                    }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={11} /> {article.readTimeMinutes}分で読める
                    </span>
                  </div>

                  <h2 className="font-serif" style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    lineHeight: '1.45',
                    margin: '0 0 0.35rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {article.title}
                  </h2>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Calendar size={11} /> {article.publishedAt.split('T')[0].replace(/-/g, '/')}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#fef08a', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    読む <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination Bar Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.4rem',
          margin: '1.25rem 0 0.5rem'
        }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(p => Math.max(1, p - 1));
              const mainEl = document.querySelector('.main-content');
              if (mainEl) mainEl.scrollTop = 0;
            }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              background: currentPage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(15, 10, 30, 0.85)',
              border: currentPage === 1 ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.2)',
              color: currentPage === 1 ? '#6b7280' : '#e2e8f0',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ＜ 前へ
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => {
                setCurrentPage(page);
                const mainEl = document.querySelector('.main-content');
                if (mainEl) mainEl.scrollTop = 0;
              }}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                background: currentPage === page
                  ? 'linear-gradient(135deg, rgba(254, 240, 138, 0.35) 0%, rgba(217, 119, 6, 0.45) 100%)'
                  : 'rgba(15, 10, 30, 0.85)',
                border: currentPage === page ? '1.5px solid #fef08a' : '1px solid rgba(255,255,255,0.15)',
                color: currentPage === page ? '#fef08a' : '#cbd5e1',
                cursor: 'pointer',
                boxShadow: currentPage === page ? '0 0 12px rgba(254, 240, 138, 0.3)' : 'none'
              }}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage(p => Math.min(totalPages, p + 1));
              const mainEl = document.querySelector('.main-content');
              if (mainEl) mainEl.scrollTop = 0;
            }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(15, 10, 30, 0.85)',
              border: currentPage === totalPages ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.2)',
              color: currentPage === totalPages ? '#6b7280' : '#e2e8f0',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            次へ ＞
          </button>
        </div>
      )}

      {/* Footer CTA Box */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        borderRadius: '18px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(217, 119, 6, 0.15) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.4)',
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.65rem'
      }}>
        <Sparkles size={20} style={{ color: '#fef08a' }} />
        <h3 className="font-serif gold-text" style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
          あなたとお相手の本格相性を今すぐ占ってみませんか？
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0 }}>
          四柱推命×16タイプ診断で、二人の運命スコア・トリセツ・LINE吉時間を完全鑑定できます。
        </p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="consult-btn font-serif"
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            cursor: 'pointer',
            marginTop: '0.2rem'
          }}
        >
          ✨ 無料相性鑑定をスタートする ➔
        </button>
      </div>
    </div>
  );
};
