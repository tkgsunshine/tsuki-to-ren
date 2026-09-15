import React, { useState } from 'react';
import { Sparkles, Calendar, MessageCircle } from 'lucide-react';
import type { SavedPartner } from '../App';
import { CustomDatePicker } from './CustomDatePicker';
import { mbtiOptions } from '../constants/mbti';
export { mbtiOptions };

interface UnifiedInputViewProps {
  selectedCharacter: 'ren' | 'tsuki';
  setSelectedCharacter: (char: 'ren' | 'tsuki') => void;
  onSubmit: (data: {
    myName: string;
    myBirth: string;
    myMbti: string;
    myGender: 'male' | 'female';
    oppName: string;
    oppBirth: string;
    oppMbti: string;
    oppGender: 'male' | 'female';
    relationship: string;
    mode: 'single' | 'match';
  }) => void;
  savedPartners?: SavedPartner[];
  loadedPartner?: SavedPartner | null;
  onSelectPartner?: (partner: SavedPartner) => void;
  onDeletePartner?: (id: string) => void;
  isRegistered?: boolean;
  isSubscribed?: boolean;
}

export const UnifiedInputView: React.FC<UnifiedInputViewProps> = ({
  selectedCharacter,
  setSelectedCharacter,
  onSubmit,
  savedPartners = [],
  loadedPartner = null,
  onSelectPartner = () => {},
  onDeletePartner = () => {},
  isRegistered = false,
  isSubscribed = false
}) => {
  // My Info states initialized from saved profile
  const [myName, setMyName] = useState(() => {
    try {
      const stored = localStorage.getItem('hasu_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) return parsed.name;
      }
    } catch (e) {}
    return '';
  });

  const [myBirth, setMyBirth] = useState(() => {
    try {
      const stored = localStorage.getItem('hasu_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.birth) return parsed.birth;
      }
    } catch (e) {}
    return '';
  });

  const urlPair = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    const compMatch = window.location.pathname.match(/\/compatibility\/([a-zA-Z]{4})-([a-zA-Z]{4})/i);
    if (compMatch) {
      return { my: compMatch[1].toUpperCase(), opp: compMatch[2].toUpperCase() };
    }
    const params = new URLSearchParams(window.location.search);
    const mm = params.get('mm') || params.get('mMbti');
    const om = params.get('om') || params.get('oMbti');
    if (mm && om) {
      return { my: mm.toUpperCase(), opp: om.toUpperCase() };
    }
    return null;
  }, []);

  const [myMbti, setMyMbti] = useState(() => {
    if (urlPair?.my) return urlPair.my;
    try {
      const stored = localStorage.getItem('hasu_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.mbti) return parsed.mbti;
      }
    } catch (e) {}
    return 'UNKNOWN';
  });

  const [myGender, setMyGender] = useState<'male' | 'female'>(() => {
    try {
      const stored = localStorage.getItem('hasu_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.gender) return parsed.gender;
      }
    } catch (e) {}
    return 'female';
  });

  const [mode, setMode] = useState<'single' | 'match'>('match');

  // Opponent Info states
  const [oppName, setOppName] = useState('');
  const [oppBirth, setOppBirth] = useState('');
  const [oppMbti, setOppMbti] = useState(() => {
    if (urlPair?.opp) return urlPair.opp;
    return 'UNKNOWN';
  });
  const [oppGender, setOppGender] = useState<'male' | 'female'>(() => (myGender === 'female' ? 'male' : 'female'));
  const [relationship, setRelationship] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('r');
      if (r === 'r') return '両思い・交際中';
      if (r === 'f') return '復縁したい';
      if (r === 'm') return '結婚・夫婦';
      if (r === 'c') return '複雑愛・秘密の恋';
      if (r === 'k') return '片思い中';
    }
    return '片思い中';
  });

  React.useEffect(() => {
    if (loadedPartner) {
      setOppName(loadedPartner.name);
      setOppBirth(loadedPartner.birth);
      setOppMbti(loadedPartner.mbti);
      setRelationship(loadedPartner.relationship);

      // Gender Validation: Ensure opposite gender combination (Male x Female) silently
      if (loadedPartner.gender === myGender) {
        const adjustedGender = myGender === 'female' ? 'male' : 'female';
        setOppGender(adjustedGender);
      } else {
        setOppGender(loadedPartner.gender);
      }
    }
  }, [loadedPartner, myGender]);

  const [showMyDatePicker, setShowMyDatePicker] = useState(false);
  const [showOpponentDatePicker, setShowOpponentDatePicker] = useState(false);

  const formatBirthDate = (value: string) => {
    // Convert full-width Japanese digits (０-９) to half-width digits (0-9)
    const normalized = value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
    const clean = normalized.replace(/\D/g, '');
    if (clean.length <= 4) {
      return clean;
    } else if (clean.length <= 6) {
      return `${clean.slice(0, 4)}/${clean.slice(4)}`;
    } else {
      return `${clean.slice(0, 4)}/${clean.slice(4, 6)}/${clean.slice(6, 8)}`;
    }
  };

  const handleMyGenderChange = (gender: 'male' | 'female') => {
    setMyGender(gender);
    setOppGender(gender === 'female' ? 'male' : 'female');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myBirth || myBirth.length < 10) {
      alert('あなたの生年月日は「19950401」のように数字8桁で入力してください。');
      return;
    }
    if (mode === 'match') {
      if (!oppName || !oppName.trim()) {
        alert('お相手のニックネームを入力してください。');
        return;
      }
      if (!oppBirth || oppBirth.length < 10) {
        alert('お相手の生年月日は「19951221」のように数字8桁で入力してください。');
        return;
      }
    }

    // Auto-save user profile to localStorage for future default pre-fill
    try {
      localStorage.setItem('hasu_user_profile', JSON.stringify({
        name: myName || 'あなた',
        birth: myBirth,
        mbti: myMbti,
        gender: myGender
      }));
    } catch (err) {}
    
    onSubmit({
      myName: myName || 'あなた',
      myBirth,
      myMbti,
      myGender,
      oppName: oppName || 'お相手',
      oppBirth,
      oppMbti,
      oppGender,
      relationship: relationship || '片思い中',
      mode
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', animation: 'fadeIn 0.4s ease', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden', flexShrink: 0 }}>
      
      {/* Character selection instruction */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '0.6rem 0 -0.25rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1.1rem',
          background: 'rgba(10, 7, 24, 0.85)',
          border: '1px solid rgba(226, 192, 116, 0.45)',
          borderRadius: '20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6), 0 0 15px rgba(226, 192, 116, 0.2)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#e2c074' }}>✦</span>
          <span className="font-serif" style={{ fontSize: '0.92rem', color: '#fef08a', letterSpacing: '0.08em', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
            相談するキャラクターを選んでください
          </span>
          <span style={{ fontSize: '0.75rem', color: '#e2c074' }}>✦</span>
        </div>
      </div>

      {/* 🔮 / 🌙 Side-by-side Character Visuals */}
      <div className="top-characters-container" style={{ marginTop: '0.75rem' }}>
        {/* Tsuki Character */}
        <div
          className={`top-char-card ${selectedCharacter === 'tsuki' ? 'active-tsuki' : ''}`}
          onClick={() => setSelectedCharacter('tsuki')}
        >
          <div className="top-char-avatar" style={{ position: 'relative' }}>
            <img 
              src="/assets/tsuki.jpg" 
              alt="月" 
              fetchPriority="high"
              decoding="async"
              style={{ transform: 'scale(1.22)', transformOrigin: 'center 18%' }}
            />
            {selectedCharacter === 'tsuki' && (
              <div className="active-badge-overlay font-serif">
                選択中
              </div>
            )}
          </div>
          <span className={`top-char-name ${selectedCharacter === 'tsuki' ? 'tsuki-text' : 'text-gray-300'}`}>月</span>
          <div style={{ display: 'flex', alignItems: 'center', width: '80%', margin: '0.2rem 0 0.35rem', gap: '0.5rem', opacity: 0.6 }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--color-tsuki), transparent)' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--color-tsuki)' }}>✦</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--color-tsuki), transparent)' }} />
          </div>
          <span className="top-char-desc">直感と優しさの象徴</span>
        </div>

        {/* Ren Character */}
        <div
          className={`top-char-card ${selectedCharacter === 'ren' ? 'active-ren' : ''}`}
          onClick={() => setSelectedCharacter('ren')}
        >
          <div className="top-char-avatar" style={{ position: 'relative' }}>
            <img 
              src="/assets/ren.jpg" 
              alt="蓮" 
              fetchPriority="high"
              decoding="async"
            />
            {selectedCharacter === 'ren' && (
              <div className="active-badge-overlay font-serif">
                選択中
              </div>
            )}
          </div>
          <span className={`top-char-name ${selectedCharacter === 'ren' ? 'ren-text' : 'text-gray-300'}`}>蓮</span>
          <div style={{ display: 'flex', alignItems: 'center', width: '80%', margin: '0.2rem 0 0.35rem', gap: '0.5rem', opacity: 0.6 }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--color-ren), transparent)' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--color-ren)' }}>✦</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--color-ren), transparent)' }} />
          </div>
          <span className="top-char-desc">理性と導きの象徴</span>
        </div>
      </div>

      {/* Main Integrated Form */}
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
        
        {urlPair && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(226, 192, 116, 0.4)',
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', color: '#fef08a', fontWeight: 'bold' }}>
                【{urlPair.my} × {urlPair.opp}】相性診断モード適用中
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px' }}>16タイプ設定済</span>
          </div>
        )}

        {/* Your Info Section */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>
            あなたの情報
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>ニックネーム (任意)</label>
            <input
              type="text"
              maxLength={8}
              placeholder="あなた (最大8文字)"
              value={myName}
              onChange={(e) => setMyName(e.target.value.slice(0, 8))}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.75rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>生年月日 <span style={{ color: '#ef4444' }}>(必須)</span></label>
            <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="例：19950401 (数字8桁)"
                required
                value={myBirth.replace(/-/g, '/')}
                onChange={(e) => setMyBirth(formatBirthDate(e.target.value).replace(/\//g, '-'))}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.75rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
              />
              <div style={{ position: 'relative', width: '42px', height: '42px' }}>
                <button
                  type="button"
                  onClick={() => setShowMyDatePicker(true)}
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0' }}
                >
                  <Calendar size={18} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>16タイプ診断 (任意)</label>
            <select
              value={myMbti}
              onChange={(e) => setMyMbti(e.target.value)}
              style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.75rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
            >
              {mbtiOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>性別 <span style={{ color: '#ef4444' }}>(必須)</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleMyGenderChange('female')}
                style={{
                  background: myGender === 'female' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: myGender === 'female' ? '1px solid var(--color-tsuki)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '0.55rem',
                  color: myGender === 'female' ? '#d8b4fe' : '#9ca3af',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                女性
              </button>
              <button
                type="button"
                onClick={() => handleMyGenderChange('male')}
                style={{
                  background: myGender === 'male' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: myGender === 'male' ? '1px solid var(--color-ren)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '0.55rem',
                  color: myGender === 'male' ? '#93c5fd' : '#9ca3af',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                男性
              </button>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div
            className={`glass-panel`}
            onClick={() => setMode('match')}
            style={{
              padding: '0.85rem',
              borderRadius: '14px',
              cursor: 'pointer',
              border: mode === 'match' ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: mode === 'match' ? 'var(--shadow-gold)' : 'none',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: mode === 'match' ? 'var(--color-gold)' : 'white' }}>相性を占う</div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '0.15rem' }}>お相手の情報を追加</div>
          </div>
          
          <div
            className={`glass-panel`}
            onClick={() => setMode('single')}
            style={{
              padding: '0.85rem',
              borderRadius: '14px',
              cursor: 'pointer',
              border: mode === 'single' ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: mode === 'single' ? 'var(--shadow-gold)' : 'none',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: mode === 'single' ? 'var(--color-gold)' : 'white' }}>自分だけ占う</div>
            <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '0.15rem' }}>今日の恋愛運勢を表示</div>
          </div>
        </div>

        {/* Opponent Info Section (Smooth Accordion Slide-Down) */}
        <div className={`accordion-section ${mode === 'match' ? 'expanded' : ''}`}>
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>
              お相手の情報
            </h2>

            {/* Saved Partners list */}
            {savedPartners && savedPartners.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 'bold' }}>
                  ● 保存したお相手から選ぶ ({savedPartners.length} / {isSubscribed ? 10 : (isRegistered ? 2 : 1)}人)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {savedPartners.map((partner) => {
                    const isSelected = loadedPartner && loadedPartner.id === partner.id;
                    return (
                      <div 
                        key={partner.id}
                        onClick={() => onSelectPartner && onSelectPartner(partner)}
                        style={{
                          background: isSelected ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1.5px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '0.45rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 10px rgba(52, 211, 153, 0.25)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                      >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                          {partner.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                          {partner.birth.replace(/-/g, '/')}
                        </span>
                        {partner.mbti && partner.mbti !== 'UNKNOWN' && (
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#d8b4fe',
                            background: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            fontWeight: '600'
                          }}>
                            {partner.mbti}
                          </span>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`${partner.name}様を削除しますか？`)) {
                            onDeletePartner(partner.id);
                          }
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: 0,
                          flexShrink: 0
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>お相手のニックネーム (任意)</label>
              <input
                type="text"
                maxLength={8}
                placeholder="お相手 (最大8文字)"
                value={oppName}
                onChange={(e) => setOppName(e.target.value.slice(0, 8))}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.75rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>お相手の生年月日 <span style={{ color: '#ef4444' }}>(必須)</span></label>
              <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="例：19951221 (数字8桁)"
                  value={oppBirth.replace(/-/g, '/')}
                  onChange={(e) => setOppBirth(formatBirthDate(e.target.value).replace(/\//g, '-'))}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.75rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
                />
                <div style={{ position: 'relative', width: '42px', height: '42px' }}>
                  <button
                    type="button"
                    onClick={() => setShowOpponentDatePicker(true)}
                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0' }}
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>お相手の16タイプ診断 (任意)</label>
              <select
                value={oppMbti}
                onChange={(e) => setOppMbti(e.target.value)}
                style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.75rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
              >
                {mbtiOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>
                お相手との関係性 <span style={{ color: '#e2c074' }}>(必須)</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                style={{
                  background: '#0a0a14',
                  border: '1px solid rgba(226, 192, 116, 0.35)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.75rem',
                  color: '#fef08a',
                  outline: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  boxShadow: '0 0 10px rgba(226, 192, 116, 0.1)'
                }}
              >
                <option value="片思い中">💕 片思い中</option>
                <option value="両思い・交際中">💖 両思い・交際中</option>
                <option value="復縁したい">🔄 復縁したい</option>
                <option value="結婚・夫婦">💍 結婚・夫婦</option>
                <option value="複雑愛・秘密の恋">🌙 複雑愛・秘密の恋</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#f3f4f6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>お相手の性別 <span style={{ color: '#ef4444' }}>(必須)</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={true}
                  style={{
                    background: oppGender === 'female' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.01)',
                    border: oppGender === 'female' ? '1px solid var(--color-tsuki)' : '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    padding: '0.55rem',
                    color: oppGender === 'female' ? '#d8b4fe' : '#4b5563',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: oppGender === 'female' ? 1 : 0.4
                  }}
                >
                  女性
                </button>
                <button
                  type="button"
                  disabled={true}
                  style={{
                    background: oppGender === 'male' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.01)',
                    border: oppGender === 'male' ? '1px solid var(--color-ren)' : '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    padding: '0.55rem',
                    color: oppGender === 'male' ? '#93c5fd' : '#4b5563',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: oppGender === 'male' ? 1 : 0.4
                  }}
                >
                  男性
                </button>
              </div>
              <span style={{ fontSize: '0.62rem', color: '#9ca3af', marginTop: '0.1rem', opacity: 0.7, lineHeight: '1.3' }}>
                ※相性診断は異性との組み合わせのみに対応しているため、自動的にもう一方の性別が選ばれます。
              </span>
            </div>
          </div>
        </div>

        {/* CTA Submit Button */}
        <button
          type="submit"
          className="consult-btn"
          disabled={!myBirth}
          style={{ marginTop: '0.5rem', opacity: !myBirth ? 0.5 : 1 }}
        >
          鑑定を開始する
          <Sparkles size={16} style={{ marginLeft: '0.5rem' }} />
        </button>
      </form>

      {/* Differentiators & Rare Showcase */}
      <div className="lp-features" style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
        


        <h2 className="font-serif text-center" style={{ fontSize: '1.1rem', color: '#e2c074', marginBottom: '0.25rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
          四柱推命・九星気学・16タイプ診断を融合した3大アプローチ
        </h2>
        
        <div className="glass-panel" style={{ display: 'flex', padding: '1rem', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '50%', color: '#3b82f6', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Calendar size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f3f4f6' }}>① 東洋占術の極み「四柱推命」で本質・本音を見抜く</span>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: '1.45' }}>あなたの生年月日（十干・十二支）から導き出される本質的な「命式」を多角的に分析。相手が言葉にしない本音、建前、そして既読スルーや沈黙の裏に隠された本当の理由を、確かな占術理論に基づいて論理的かつ具体的に解明します。深層心理レベルでのズレを見落としません。</span>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', padding: '1rem', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.5rem', borderRadius: '50%', color: '#a855f7', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Sparkles size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f3f4f6' }}>② 「九星気学」で動くべき黄金のタイミングを特定</span>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: '1.45' }}>運気のサイクルと時の流れを司る九星気学を用いて、二人の運勢のバイオリズムが交差する瞬間を特定。今週、あなたが取るべき「攻めの日」と「待つべき日」をピンポイントで可視化し、すれ違いを最小限に抑えながら最も引き寄せの力が強まる最適な行動タイミングを導き出します。</span>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', padding: '1rem', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(226, 192, 116, 0.1)', padding: '0.5rem', borderRadius: '50%', color: '#e2c074', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <MessageCircle size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f3f4f6' }}>③ 心理統計学「16タイプ診断」で具体的アプローチを提示</span>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: '1.45' }}>西洋の心理統計学である16タイプ性格理論と相性論を融合し、日常の会話で生じる意思疎通のすれ違いや認知の癖を解剖。お相手のタイプに最も響くコミュニケーションの取り方を分析し、今日すぐにそのままコピー＆ペーストして送信できる具体的なLINEのメッセージ文案やアプローチ法を提示します。</span>
          </div>
        </div>
      </div>

      {showMyDatePicker && (
        <CustomDatePicker
          value={myBirth}
          onChange={(val) => setMyBirth(val)}
          onClose={() => setShowMyDatePicker(false)}
        />
      )}
      {showOpponentDatePicker && (
        <CustomDatePicker
          value={oppBirth}
          onChange={(val) => setOppBirth(val)}
          onClose={() => setShowOpponentDatePicker(false)}
        />
      )}
    </div>
  );
};
