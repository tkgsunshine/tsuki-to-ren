import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { FortuneResult } from '../utils/fortuneEngine';
import { getPillarWithReading } from '../utils/fortuneEngine';

interface ShareCardModalProps {
  selectedChar: 'ren' | 'tsuki';
  result: FortuneResult;
  myName: string;
  opponentName?: string;
  hasOpponent: boolean;
  shareUrl: string;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  selectedChar,
  result,
  myName,
  opponentName,
  hasOpponent,
  shareUrl,
  onClose
}) => {
  const oppNickname = opponentName || 'お相手';
  const isRen = selectedChar === 'ren';

  const [activeTab, setActiveTab] = useState<'match' | 'single'>('match');
  const showOpponent = hasOpponent && activeTab === 'match';

  const myTagColor = isRen ? '#93c5fd' : '#d8b4fe';
  const myTagBg = isRen ? 'rgba(59, 130, 246, 0.12)' : 'rgba(168, 85, 247, 0.12)';
  const myTagBorder = isRen ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)';

  const cardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [myAvatarBase64, setMyAvatarBase64] = useState<string>(result.myAvatarUrl);
  const [oppAvatarBase64, setOppAvatarBase64] = useState<string>(result.opponentAvatarUrl || '');

  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      if (result.myAvatarUrl) {
        try {
          const res = await fetch(result.myAvatarUrl);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (active && reader.result) setMyAvatarBase64(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (e) {}
      }
      if (result.opponentAvatarUrl) {
        try {
          const res = await fetch(result.opponentAvatarUrl);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (active && reader.result) setOppAvatarBase64(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (e) {}
      }
    };
    loadImages();
    return () => { active = false; };
  }, [result.myAvatarUrl, result.opponentAvatarUrl]);

  // Limit nickname character length to 8 max
  const formatName = (name: string) => {
    return name.slice(0, 8);
  };

  const getShareUrlForTab = () => {
    try {
      const u = new URL(shareUrl);
      if (!showOpponent) {
        u.searchParams.set('mode', 'single');
      } else {
        u.searchParams.delete('mode');
      }
      return u.toString();
    } catch (e) {
      return shareUrl;
    }
  };

  const targetShareUrl = getShareUrlForTab();

  const handleDownload = async () => {
    const targetEl = captureRef.current || cardRef.current;
    if (!targetEl || isSaving) return;
    setIsSaving(true);
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Small delay to ensure Base64 images are rendered
      await new Promise(r => setTimeout(r, 100));

      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(targetEl, {
        useCORS: true,
        allowTaint: true,
        scale: 3, // 3x scale for 2400x3000 ultra crisp export
        backgroundColor: '#05040a',
        logging: false,
        width: 800,
        height: 1000
      });
      const dataUrl = canvas.toDataURL('image/png');

      // Direct file download on all devices
      const link = document.createElement('a');
      link.download = showOpponent
        ? `月と蓮_相性カード_${myName}_${oppNickname}.png`
        : `月と蓮_運勢カード_${myName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to save image:', err);
      alert('画像の保存に失敗しました。スマホ端末やブラウザによっては制限されている場合があります。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback
      const input = document.createElement('input');
      input.value = targetShareUrl;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        alert('リンクのコピーに失敗しました。');
      }
      document.body.removeChild(input);
    }
  };

  const handleXShare = () => {
    const text = showOpponent
      ? `宿命を紡ぐ恋愛占い「月と蓮」で二人の相性を鑑定しました🔮\n\n今日の相性は【${result.dailyScore}点】✨\n「${result.oneLiner}」\n\n四柱推命×16タイプで紐解く本格相性診断はこちら👇\n${targetShareUrl}\n\n#月と蓮 #恋愛占い #相性診断 #16タイプ相性 #四柱推命 #ツインレイ`
      : `宿命を紡ぐ恋愛占い「月と蓮」で本日の運勢を鑑定しました🔮\n\n今日の運勢は【${result.dailyScore}点】✨\n「${result.oneLiner}」\n\n四柱推命×九星気学の本気の恋愛鑑定はこちら👇\n${targetShareUrl}\n\n#月と蓮 #恋愛占い #本日の運勢 #四柱推命 #16タイプ診断`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  };

  const handleLineShare = () => {
    const text = showOpponent
      ? `宿命を紡ぐ恋愛占い「月と蓮」で二人の相性を鑑定しました🔮\n\n今日の相性は【${result.dailyScore}点】✨\n「${result.oneLiner}」\n\n四柱推命×16タイプで紐解く本格相性診断結果はこちら👇\n${targetShareUrl}`
      : `宿命を紡ぐ恋愛占い「月と蓮」で本日の運勢を鑑定しました🔮\n\n今日の運勢は【${result.dailyScore}点】✨\n「${result.oneLiner}」\n\n本格恋愛鑑定結果はこちら👇\n${targetShareUrl}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 2, 5, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 100000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem 1rem calc(5.5rem + var(--safe-bottom, 0px))',
      overflowY: 'auto'
    }}>
      {/* Hidden 800x1180 Off-screen DOM Container for high-res lossless capture */}
      <div
        ref={captureRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '800px',
          height: '1180px',
          backgroundColor: '#05040a',
          borderRadius: '36px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 40px',
          boxSizing: 'border-box',
          fontFamily: '"Cinzel", "Shippori Mincho", "Noto Serif JP", serif',
          zIndex: -9999
        }}
      >
        {/* Background Base64 Images (Vertical stacked avatars with extended height) */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 1, backgroundColor: '#05040a' }}>
          {showOpponent && result.opponentAvatarUrl ? (
            <>
              <div style={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={myAvatarBase64} alt="" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={oppAvatarBase64} alt="" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
              </div>
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <img src={myAvatarBase64} alt="" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
            </div>
          )}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(5, 5, 12, 0.2) 0%, rgba(5, 5, 12, 0.35) 60%, rgba(5, 5, 12, 0.65) 100%)'
          }} />
        </div>

        {/* Offscreen Card Top */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          {!showOpponent && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(10, 10, 25, 0.75)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                padding: '16px 28px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                  {formatName(myName)} <span style={{ fontSize: '24px', color: '#fbbf24' }}>の運勢</span>
                </div>
                {(result.isKaigo || result.isRare) && (
                  <span style={{
                    fontSize: '18px',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    background: result.isKaigo ? 'linear-gradient(135deg, #7f1d1d, #b91c1c)' : 'linear-gradient(135deg, #b45309, #d97706)',
                    color: '#fff',
                    fontWeight: 'bold',
                    alignSelf: 'flex-start'
                  }}>
                    {result.isKaigo ? '👑 魁罡 (かいごう)' : '👑 選ばれし極星'}
                  </span>
                )}
              </div>

              <div style={{
                background: 'rgba(10, 10, 25, 0.75)',
                border: '2px solid rgba(147, 197, 253, 0.4)',
                padding: '16px 28px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '18px', color: '#94a3b8' }}>今日の運勢</span>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#93c5fd', lineHeight: '1.1' }}>
                  {result.dailyScore}<span style={{ fontSize: '24px' }}>点</span>
                </span>
                <span style={{ fontSize: '16px', color: '#64748b', marginTop: '4px' }}>
                  {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Offscreen Card Bottom */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {showOpponent && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%'
            }}>
              {/* Top Row: Compatibility Title & Names Badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                flexWrap: 'wrap'
              }}>
                {result.compatibilityTitle && (
                  <div style={{
                    fontSize: '18px',
                    color: '#fef08a',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                    background: 'rgba(5, 5, 15, 0.75)',
                    border: '1.5px solid rgba(226, 192, 116, 0.5)',
                    padding: '6px 20px',
                    borderRadius: '30px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                  }}>
                    {result.compatibilityTitle}
                  </div>
                )}

                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  background: 'rgba(5, 5, 15, 0.75)',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  padding: '6px 20px',
                  borderRadius: '30px',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                }}>
                  <span>{formatName(myName)}</span>
                  <span style={{ color: '#fbbf24', fontSize: '20px' }}>×</span>
                  <span>{formatName(oppNickname)}</span>
                </div>
              </div>

              {(result.isKaigo || result.isRare || result.opponentIsKaigo || result.opponentIsRare) && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {(result.isKaigo || result.isRare) && (
                    <span style={{
                      fontSize: '15px',
                      padding: '4px 14px',
                      borderRadius: '10px',
                      background: result.isKaigo ? 'linear-gradient(135deg, #7f1d1d, #b91c1c)' : 'linear-gradient(135deg, #b45309, #d97706)',
                      color: '#fff',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      {formatName(myName)}: {result.isKaigo ? '👑 魁罡' : '👑 選ばれし極星'}
                    </span>
                  )}
                  {(result.opponentIsKaigo || result.opponentIsRare) && (
                    <span style={{
                      fontSize: '15px',
                      padding: '4px 14px',
                      borderRadius: '10px',
                      background: result.opponentIsKaigo ? 'linear-gradient(135deg, #7f1d1d, #b91c1c)' : 'linear-gradient(135deg, #b45309, #d97706)',
                      color: '#fff',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      {formatName(oppNickname)}: {result.opponentIsKaigo ? '👑 魁罡' : '👑 選ばれし極星'}
                    </span>
                  )}
                </div>
              )}

              {/* Middle Row: Left and Right Split Floating Badges (Center is 100% open for character) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '4px 0'
              }}>
                {/* Left Floating Badge: 基本相性 */}
                <div style={{
                  background: 'rgba(5, 5, 15, 0.72)',
                  border: '1.5px solid rgba(251, 191, 36, 0.45)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '20px',
                  padding: '10px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
                }}>
                  <span style={{ fontSize: '14px', color: '#cbd5e1' }}>基本相性</span>
                  <span style={{ fontSize: '38px', fontWeight: 'bold', color: '#fbbf24', lineHeight: '1.1' }}>
                    {result.baseScore}<span style={{ fontSize: '18px' }}>点</span>
                  </span>
                </div>

                {/* Center space: EMPTY so character in center is 100% visible */}

                {/* Right Floating Badge: 今日の相性 */}
                <div style={{
                  background: 'rgba(5, 5, 15, 0.72)',
                  border: '1.5px solid rgba(147, 197, 253, 0.45)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '20px',
                  padding: '10px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
                }}>
                  <span style={{ fontSize: '14px', color: '#cbd5e1' }}>今日の相性</span>
                  <span style={{ fontSize: '38px', fontWeight: 'bold', color: '#93c5fd', lineHeight: '1.1' }}>
                    {result.dailyScore}<span style={{ fontSize: '18px' }}>点</span>
                  </span>
                </div>
              </div>

              <div style={{
                fontSize: '14px',
                color: '#cbd5e1',
                textAlign: 'center',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)'
              }}>
                鑑定日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
              </div>
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 16px',
            textAlign: 'center'
          }}>
            <span style={{
              fontSize: '20px',
              color: '#ffffff',
              lineHeight: '1.4',
              textAlign: 'center',
              fontWeight: 'bold',
              letterSpacing: '0.02em',
              textShadow: '0 2px 12px rgba(0,0,0,0.98), 0 0 20px rgba(0,0,0,0.95)'
            }}>
              「{result.oneLiner}」
            </span>
          </div>

          {!showOpponent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.25)',
                border: '1px solid rgba(59, 130, 246, 0.6)',
                color: '#93c5fd',
                padding: '10px 20px',
                borderRadius: '14px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                あなた：{getPillarWithReading(result.myPillar)} / {result.myStar} / {result.myMbtiText.split(' ')[0]}
                {result.isKaigo ? ' / 👑 魁罡' : (result.isRare ? ' / 👑 極星' : '')}
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '8px',
            marginTop: '2px'
          }}>
            <span style={{ fontSize: '16px', color: '#cbd5e1', letterSpacing: '0.08em', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
              恋愛鑑定アプリ - 蓮と月
            </span>
          </div>
        </div>
      </div>

      {/* Visible Container */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        animation: 'fadeIn 0.3s ease'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          width: '100%'
        }}>
          <span className="font-serif gold-text" style={{ fontSize: '1.05rem', fontWeight: '600', letterSpacing: '0.04em' }}>
            {showOpponent ? '相性鑑定シェアカード' : '恋愛運シェアカード'}
          </span>
          <button onClick={onClose} style={{
            position: 'absolute',
            right: 0,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#cbd5e1',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Toggle Switch (only shown if in match mode) */}
        {hasOpponent && (
          <div style={{
            display: 'flex',
            background: 'rgba(15, 15, 25, 0.8)',
            borderRadius: '25px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            gap: '4px'
          }}>
            <button
              onClick={() => setActiveTab('match')}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'match' ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'transparent',
                color: activeTab === 'match' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'match' ? '0 2px 8px rgba(168, 85, 247, 0.4)' : 'none'
              }}
            >
              二人の相性
            </button>
            <button
              onClick={() => setActiveTab('single')}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'single' ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'transparent',
                color: activeTab === 'single' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'single' ? '0 2px 8px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              自分の運勢
            </button>
          </div>
        )}

        {/* Extended Share Card Preview */}
        <div ref={cardRef}
          className={(result.isKaigo || (showOpponent && result.opponentIsKaigo)) ? 'kaigo-border' : ((result.isRare || (showOpponent && result.opponentIsRare)) ? 'rare-rainbow-border' : '')}
          style={{
            width: '100%',
            aspectRatio: '3/4.6',
            border: (result.isKaigo || result.isRare || (showOpponent && (result.opponentIsKaigo || result.opponentIsRare))) ? 'none' : '1.5px solid rgba(255, 255, 255, 0.12)',
            boxShadow: result.isKaigo ? '0 0 25px rgba(220, 38, 38, 0.45)' : (result.isRare ? '0 0 25px rgba(251, 191, 36, 0.45)' : (selectedChar === 'tsuki' 
              ? '0 20px 40px rgba(168, 85, 247, 0.25)' 
              : '0 20px 40px rgba(59, 130, 246, 0.25)')),
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background Images Layer (Vertical 2-tier stacked avatars with clean dark base) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#05040a'
          }}>
            {showOpponent && result.opponentAvatarUrl ? (
              <>
                <div style={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={myAvatarBase64} alt="" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={oppAvatarBase64} alt="" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
                </div>
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                <img src={myAvatarBase64} alt="" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
              </div>
            )}
            {/* Dark overlay gradient for readability */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(5, 5, 12, 0.15) 0%, rgba(5, 5, 12, 0.3) 60%, rgba(5, 5, 12, 0.65) 100%)'
            }} />
          </div>
          {/* Card Top */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 2 }}>
            {!showOpponent && (
              /* Single Mode Top Corner Layout (Unobstructed Character) */
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%'
              }}>
                {/* Top Left: Title Badge */}
                <div style={{
                  background: 'rgba(10, 10, 25, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '8px 14px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'white', letterSpacing: '0.04em' }}>
                    {formatName(myName)} <span style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>の運勢</span>
                  </div>
                  {(result.isKaigo || result.isRare) && (
                    <div>
                      <span className={result.isKaigo ? 'kaigo-badge' : 'rare-badge'} style={{ fontSize: '0.58rem', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>
                        {result.isKaigo ? '👑 魁罡 (かいごう)' : '👑 選ばれし極星'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Top Right: Score & Date Card */}
                <div style={{
                  background: 'rgba(10, 10, 25, 0.75)',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}>
                  <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>今日の運勢</span>
                  <span className="font-serif" style={{ fontSize: '1.4rem', color: '#93c5fd', fontWeight: 'bold', lineHeight: '1.1' }}>
                    {result.dailyScore}<span style={{ fontSize: '0.75rem' }}>点</span>
                  </span>
                  <span style={{ fontSize: '0.52rem', color: '#64748b', marginTop: '2px' }}>
                    {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card Bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', zIndex: 2 }}>
            {showOpponent && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                width: '100%'
              }}>
                {/* Top Row: Compatibility Title & Names Badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.35rem',
                  width: '100%',
                  flexWrap: 'wrap'
                }}>
                  {result.compatibilityTitle && (
                    <div style={{
                      fontSize: '0.62rem',
                      color: '#fef08a',
                      fontWeight: 'bold',
                      letterSpacing: '0.06em',
                      background: 'rgba(5, 5, 15, 0.72)',
                      border: '1px solid rgba(226, 192, 116, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}>
                      {result.compatibilityTitle}
                    </div>
                  )}

                  <div className="font-serif" style={{
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    letterSpacing: '0.02em',
                    background: 'rgba(5, 5, 15, 0.72)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}>
                    <span>{formatName(myName)}</span>
                    <span style={{ color: '#fbbf24', fontSize: '0.72rem' }}>×</span>
                    <span>{formatName(oppNickname)}</span>
                  </div>
                </div>

                {(result.isKaigo || result.isRare || result.opponentIsKaigo || result.opponentIsRare) && (
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {(result.isKaigo || result.isRare) && (
                      <span className={result.isKaigo ? 'kaigo-badge' : 'rare-badge'} style={{ fontSize: '0.5rem', padding: '1px 5px', borderRadius: '5px' }}>
                        {formatName(myName)}: {result.isKaigo ? '👑 魁罡' : '👑 選ばれし極星'}
                      </span>
                    )}
                    {(result.opponentIsKaigo || result.opponentIsRare) && (
                      <span className={result.opponentIsKaigo ? 'kaigo-badge' : 'rare-badge'} style={{ fontSize: '0.5rem', padding: '1px 5px', borderRadius: '5px' }}>
                        {formatName(oppNickname)}: {result.opponentIsKaigo ? '👑 魁罡' : '👑 選ばれし極星'}
                      </span>
                    )}
                  </div>
                )}

                {/* Middle Row: Left & Right Split Floating Badges (Center is 100% open for character) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '2px 0'
                }}>
                  {/* Left Floating Badge: 基本相性 */}
                  <div style={{
                    background: 'rgba(5, 5, 15, 0.72)',
                    border: '1.2px solid rgba(251, 191, 36, 0.45)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: '14px',
                    padding: '4px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
                  }}>
                    <span style={{ fontSize: '0.52rem', color: '#cbd5e1' }}>基本相性</span>
                    <span className="font-serif gold-text" style={{ fontSize: '1.15rem', fontWeight: 'bold', lineHeight: '1.1' }}>
                      {result.baseScore}<span style={{ fontSize: '0.65rem' }}>点</span>
                    </span>
                  </div>

                  {/* Center space: EMPTY so character in center is 100% visible */}

                  {/* Right Floating Badge: 今日の相性 */}
                  <div style={{
                    background: 'rgba(5, 5, 15, 0.72)',
                    border: '1.2px solid rgba(147, 197, 253, 0.45)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: '14px',
                    padding: '4px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
                  }}>
                    <span style={{ fontSize: '0.52rem', color: '#cbd5e1' }}>今日の相性</span>
                    <span className="font-serif" style={{ fontSize: '1.15rem', color: '#93c5fd', fontWeight: 'bold', lineHeight: '1.1' }}>
                      {result.dailyScore}<span style={{ fontSize: '0.65rem' }}>点</span>
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.5rem', color: '#cbd5e1', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                  鑑定日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
                </div>
              </div>
            )}
            {/* One Liner Message */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem 0.5rem',
              textAlign: 'center'
            }}>
              <span className="font-serif" style={{
                fontSize: '0.72rem',
                color: '#ffffff',
                lineHeight: '1.4',
                textAlign: 'center',
                fontWeight: 'bold',
                letterSpacing: '0.02em',
                textShadow: '0 2px 10px rgba(0,0,0,0.98), 0 0 15px rgba(0,0,0,0.95)'
              }}>
                「{result.oneLiner}」
              </span>
            </div>

            {/* My Tags (Only in single mode) */}
            {!showOpponent && (
              <div style={{ fontSize: '0.6rem', color: myTagColor, display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span style={{ background: myTagBg, padding: '4px 10px', borderRadius: '8px', border: myTagBorder, fontWeight: '500', width: '100%', boxSizing: 'border-box' }}>
                  あなた：{getPillarWithReading(result.myPillar)} / {result.myStar} / {result.myMbtiText.split(' ')[0]}
                  {result.isKaigo ? ' / 👑 魁罡' : (result.isRare ? ' / 👑 極星' : '')}
                </span>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: '0.2rem',
              marginTop: '0.1rem'
            }}>
              <span style={{ fontSize: '0.58rem', color: '#cbd5e1', letterSpacing: '0.05em', textShadow: '0 1px 4px rgba(0,0,0,0.95)', fontWeight: '500' }}>恋愛鑑定アプリ - 蓮と月</span>
            </div>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
          <div style={{ display: 'flex', gap: '0.6rem', width: '100%' }}>
            <button
              onClick={handleDownload}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{isSaving ? '保存中...' : '画像で保存'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <span>{copied ? 'コピーしました！' : 'リンクをコピー'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', width: '100%' }}>
            <button
              onClick={handleXShare}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '24px',
                background: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Xでシェア</span>
            </button>

            <button
              onClick={handleLineShare}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '24px',
                background: '#06C755',
                border: 'none',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(6, 199, 85, 0.3)'
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 5.82 2 10.53c0 4.22 3.6 7.76 8.46 8.43.33.07.78.22.89.5.1.26.07.67.03.93-.05.32-.24 1.25-.27 1.52-.05.42-.25 1.63 1.43.89 1.68-.74 4.54-2.67 6.19-4.57C20.67 16.27 22 13.56 22 10.53 22 5.82 17.52 2 12 2z"/>
              </svg>
              <span>LINEでシェア</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
