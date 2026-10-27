import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { FortuneResult } from '../utils/fortuneEngine';
import { getPillarWithReading } from '../utils/fortuneEngine';
import { showAlert } from './AppDialog';

interface ShareCardModalProps {
  selectedChar: 'ren' | 'tsuki';
  result: FortuneResult;
  myName: string;
  opponentName?: string;
  hasOpponent: boolean;
  shareUrl: string;
  /** 無料の日数を使い切ったお相手: 今日の点数は「??」にする */
  hideDailyScore?: boolean;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  selectedChar,
  result,
  myName,
  opponentName,
  hasOpponent,
  shareUrl,
  hideDailyScore = false,
  onClose
}) => {
  const oppNickname = opponentName || 'お相手';
  const dailyScoreLabel = hideDailyScore ? '??' : String(result.dailyScore);
  const isRen = selectedChar === 'ren';

  const [activeTab, setActiveTab] = useState<'match' | 'single'>('match');
  const showOpponent = hasOpponent && activeTab === 'match';

  const myTagColor = isRen ? '#9cc6d8' : '#cdbfe2';
  const myTagBg = isRen ? 'rgba(58, 134, 171, 0.12)' : 'rgba(159, 134, 192, 0.12)';
  const myTagBorder = isRen ? '1px solid rgba(58, 134, 171, 0.3)' : '1px solid rgba(159, 134, 192, 0.3)';

  const cardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
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

  // カードの背景（守護獣の画像）。保存用画像とプレビューで共通。
  // 正方形の画像を余白なしで敷き詰めるため、背景画像の cover で切り抜く（html2canvasは object-fit 非対応のため）。
  const coverImage = (src: string, position: string): React.CSSProperties => ({
    backgroundImage: src ? `url(${src})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: position,
    backgroundRepeat: 'no-repeat'
  });

  const renderCardBackground = () => (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: '#05080d', overflow: 'hidden' }}>
      {showOpponent && result.opponentAvatarUrl ? (
        <>
          {/* 上半分: 自分（頭が切れないよう上端合わせ） / 下半分: お相手（中央合わせ） */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%', ...coverImage(myAvatarBase64, 'center top') }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', bottom: 0, ...coverImage(oppAvatarBase64, 'center center') }} />
          {/* 2枚の継ぎ目をぼかし、二つ名と名前ラベルを読みやすくする */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '43%',
            height: '14%',
            background: 'linear-gradient(to bottom, rgba(5, 8, 13, 0) 0%, rgba(5, 8, 13, 0.6) 50%, rgba(5, 8, 13, 0) 100%)'
          }} />
        </>
      ) : (
        <div style={{ position: 'absolute', top: 0, left: '-10%', width: '120%', aspectRatio: '1 / 1', ...coverImage(myAvatarBase64, 'center') }}>
          {/* 画像の下端を背景色へなじませる */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(5, 8, 13, 0) 0%, rgba(5, 8, 13, 0) 72%, #05080d 100%)'
          }} />
        </div>
      )}
      {/* 下部テキストを読みやすくする暗いグラデーション */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 66%, rgba(5, 7, 10, 0.7) 100%)'
      }} />
    </div>
  );

  const handleDownload = async () => {
    const targetEl = captureRef.current || cardRef.current;
    if (!targetEl || isSaving) return;
    setIsSaving(true);
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      await new Promise(r => setTimeout(r, 60));

      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(targetEl, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#05080d',
        logging: false,
        width: targetEl.offsetWidth || 800,
        height: targetEl.offsetHeight || 1240
      });

      const filename = showOpponent
        ? `月と蓮_相性カード_${myName}_${oppNickname}.png`
        : `月と蓮_運勢カード_${myName}.png`;

      // Convert to Blob for direct high-speed download & WebShare
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Blob creation failed');

      // 1. Try Native Web Share API (Files API) for native iOS / Android photo saving
      if (navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: '月と蓮 鑑定カード'
            });
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2500);
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Direct instant download via Object URL
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save image:', err);
      showAlert('画像の保存に失敗しました。もう一度お試しください。');
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
        showAlert('リンクのコピーに失敗しました。');
      }
      document.body.removeChild(input);
    }
  };

  const handleXShare = () => {
    const text = showOpponent
      ? `宿命を紡ぐ恋愛占い「月と蓮」で二人の相性を鑑定しました🔮\n\n今日の相性は【${dailyScoreLabel}点】✨\n「${result.oneLiner}」\n\n四柱推命×16タイプで紐解く本格相性診断はこちら👇\n${targetShareUrl}\n\n#月と蓮 #恋愛占い #相性診断 #16タイプ相性 #四柱推命 #ツインレイ`
      : `宿命を紡ぐ恋愛占い「月と蓮」で本日の運勢を鑑定しました🔮\n\n今日の運勢は【${dailyScoreLabel}点】✨\n「${result.oneLiner}」\n\n四柱推命×九星気学の本気の恋愛鑑定はこちら👇\n${targetShareUrl}\n\n#月と蓮 #恋愛占い #本日の運勢 #四柱推命 #16タイプ診断`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  };

  const handleLineShare = () => {
    const text = showOpponent
      ? `宿命を紡ぐ恋愛占い「月と蓮」で二人の相性を鑑定しました🔮\n\n今日の相性は【${dailyScoreLabel}点】✨\n「${result.oneLiner}」\n\n四柱推命×16タイプで紐解く本格相性診断結果はこちら👇\n${targetShareUrl}`
      : `宿命を紡ぐ恋愛占い「月と蓮」で本日の運勢を鑑定しました🔮\n\n今日の運勢は【${dailyScoreLabel}点】✨\n「${result.oneLiner}」\n\n本格恋愛鑑定結果はこちら👇\n${targetShareUrl}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 3, 4, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 100000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: 'calc(1.5rem + env(safe-area-inset-top, 28px)) 1rem calc(5.5rem + env(safe-area-inset-bottom, 20px))',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      {/* Hidden 800x1180 Off-screen DOM Container for high-res lossless capture */}
      <div
        ref={captureRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '800px',
          height: '1240px',
          backgroundColor: '#05080d',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 40px 52px 40px',
          boxSizing: 'border-box',
          fontFamily: '"Cinzel", "Shippori Mincho", "Noto Serif JP", serif',
          zIndex: -9999
        }}
      >
        {renderCardBackground()}

        {/* Offscreen Card Top */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', width: '100%' }}>
          {showOpponent ? (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Top Left: My Name Badge */}
              <div style={{
                background: 'rgba(6, 8, 12, 0.75)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                padding: '8px 20px',
                borderRadius: '20px',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '20px',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}>
                <span>{formatName(myName)}</span>
                {(result.isKaigo || result.isRare) && (
                  <span style={{ fontSize: '13px', color: '#e8a93a', fontWeight: 'bold' }}>
                    {result.isKaigo ? '魁罡' : '極星'}
                  </span>
                )}
              </div>

              {/* Top Right: 基本相性 (画面の右上) */}
              <div style={{
                background: 'rgba(6, 8, 12, 0.75)',
                border: '1.5px solid rgba(232, 169, 58, 0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: '20px',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '15px', color: '#d8d2c6' }}>基本相性</span>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#e8a93a', lineHeight: '1' }}>
                  {result.baseScore}<span style={{ fontSize: '16px' }}>点</span>
                </span>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(10, 15, 21, 0.75)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                padding: '16px 28px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                  {formatName(myName)} <span style={{ fontSize: '24px', color: '#e8a93a' }}>の運勢</span>
                </div>
                {(result.isKaigo || result.isRare) && (
                  <span style={{
                    fontSize: '18px',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    background: result.isKaigo ? 'linear-gradient(135deg, #7f1d1d, #9e3a2c)' : 'linear-gradient(135deg, #b45309, #b8692d)',
                    color: '#fff',
                    fontWeight: 'bold',
                    alignSelf: 'flex-start'
                  }}>
                    {result.isKaigo ? '魁罡 (かいごう)' : '選ばれし極星'}
                  </span>
                )}
              </div>

              <div style={{
                background: 'rgba(10, 15, 21, 0.75)',
                border: '2px solid rgba(156, 198, 216, 0.4)',
                padding: '16px 28px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '18px', color: '#a39d91' }}>今日の運勢</span>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#9cc6d8', lineHeight: '1.1' }}>
                  {dailyScoreLabel}<span style={{ fontSize: '24px' }}>点</span>
                </span>
                <span style={{ fontSize: '16px', color: '#736e65', marginTop: '4px' }}>
                  {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Offscreen Card Middle (Boundary: 二つ名, Lower Character Top: Left Opponent Name & Right Today Score) */}
        {showOpponent && (
          <div style={{
            position: 'absolute',
            zIndex: 2,
            left: '40px',
            right: '40px',
            top: '50%'
          }}>
            {/* Boundary Line Level: 二つ名 (継ぎ目の真上に中央揃え) */}
            {result.compatibilityTitle && (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', transform: 'translateY(-50%)' }}>
                <div style={{
                  fontSize: '18px',
                  color: '#f2e2b3',
                  fontWeight: 'bold',
                  letterSpacing: '0.08em',
                  background: 'rgba(6, 8, 12, 0.85)',
                  border: '1.5px solid rgba(226, 192, 116, 0.6)',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.2'
                }}>
                  {result.compatibilityTitle}
                </div>
              </div>
            )}

            {/* Lower Character Top Level: Opponent Name on Left & Today Score on Right */}
            <div style={{ position: 'absolute', top: '38px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Left: Opponent Name (相手のキャラの左上) */}
              <div style={{
                background: 'rgba(6, 8, 12, 0.75)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                padding: '8px 20px',
                borderRadius: '20px',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '20px',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}>
                <span>{formatName(oppNickname)}</span>
                {(result.opponentIsKaigo || result.opponentIsRare) && (
                  <span style={{ fontSize: '13px', color: '#e8a93a', fontWeight: 'bold' }}>
                    {result.opponentIsKaigo ? '魁罡' : '極星'}
                  </span>
                )}
              </div>

              {/* Right: 今日の相性 (基本相性と同じ右端位置) */}
              <div style={{
                background: 'rgba(6, 8, 12, 0.75)',
                border: '1.5px solid rgba(156, 198, 216, 0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: '20px',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '15px', color: '#d8d2c6' }}>今日の相性</span>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#9cc6d8', lineHeight: '1' }}>
                  {dailyScoreLabel}<span style={{ fontSize: '16px' }}>点</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Offscreen Card Bottom */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            transform: 'none'
          }}>
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
                textWrap: 'balance',
                textShadow: '0 2px 12px rgba(0,0,0,0.98), 0 0 20px rgba(0,0,0,0.95)'
              }}>
                「{result.oneLiner}」
              </span>
            </div>

            {!showOpponent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  background: 'rgba(58, 134, 171, 0.25)',
                  border: '1px solid rgba(58, 134, 171, 0.6)',
                  color: '#9cc6d8',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  あなた：{getPillarWithReading(result.myPillar)} / {result.myStar} / {result.myMbtiText.split(' ')[0]}
                  {result.isKaigo ? ' / 魁罡' : (result.isRare ? ' / 極星' : '')}
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '6px'
          }}>
            <span style={{ fontSize: '14px', color: '#d8d2c6', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              鑑定日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <span style={{ fontSize: '16px', color: '#d8d2c6', letterSpacing: '0.08em', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
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
        margin: 'auto auto',
        flexShrink: 0,
        boxSizing: 'border-box',
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
          <button className="tap-target" aria-label="閉じる" onClick={onClose} style={{
            position: 'absolute',
            right: 0,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#d8d2c6',
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
            background: 'rgba(13, 18, 26, 0.8)',
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
                background: activeTab === 'match' ? 'linear-gradient(135deg, #9f86c0 0%, #5b6aa8 100%)' : 'transparent',
                color: activeTab === 'match' ? '#ffffff' : '#a39d91',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'match' ? '0 2px 8px rgba(159, 134, 192, 0.4)' : 'none'
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
                background: activeTab === 'single' ? 'linear-gradient(135deg, #3a86ab 0%, #5b6aa8 100%)' : 'transparent',
                color: activeTab === 'single' ? '#ffffff' : '#a39d91',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'single' ? '0 2px 8px rgba(58, 134, 171, 0.4)' : 'none'
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
            boxShadow: result.isKaigo ? '0 0 25px rgba(184, 74, 55, 0.45)' : (result.isRare ? '0 0 25px rgba(232, 169, 58, 0.45)' : (selectedChar === 'tsuki' 
              ? '0 20px 40px rgba(159, 134, 192, 0.25)' 
              : '0 20px 40px rgba(58, 134, 171, 0.25)')),
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {renderCardBackground()}
          {/* Card Top */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2, width: '100%' }}>
            {showOpponent ? (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '0 0.1rem'
              }}>
                {/* Top Left Name Badge */}
                <div style={{
                  background: 'rgba(6, 8, 12, 0.72)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}>
                  <span>{formatName(myName)}</span>
                  {(result.isKaigo || result.isRare) && (
                    <span className={result.isKaigo ? 'kaigo-badge' : 'rare-badge'} style={{ fontSize: '0.48rem', padding: '1px 4px', borderRadius: '4px' }}>
                      {result.isKaigo ? '魁罡' : '極星'}
                    </span>
                  )}
                </div>

                {/* Top Right: 基本相性 */}
                <div style={{
                  background: 'rgba(6, 8, 12, 0.72)',
                  border: '1.2px solid rgba(232, 169, 58, 0.45)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}>
                  <span style={{ fontSize: '0.55rem', color: '#d8d2c6' }}>基本相性</span>
                  <span className="font-serif gold-text" style={{ fontSize: '0.9rem', fontWeight: 'bold', lineHeight: '1' }}>
                    {result.baseScore}<span style={{ fontSize: '0.55rem' }}>点</span>
                  </span>
                </div>
              </div>
            ) : (
              /* Single Mode Top Corner Layout (Unobstructed Character) */
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%'
              }}>
                {/* Top Left: Title Badge */}
                <div style={{
                  background: 'rgba(10, 15, 21, 0.75)',
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
                        {result.isKaigo ? '魁罡 (かいごう)' : '選ばれし極星'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Top Right: Score & Date Card */}
                <div style={{
                  background: 'rgba(10, 15, 21, 0.75)',
                  border: '1px solid rgba(156, 198, 216, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}>
                  <span style={{ fontSize: '0.58rem', color: '#a39d91' }}>今日の運勢</span>
                  <span className="font-serif" style={{ fontSize: '1.4rem', color: '#9cc6d8', fontWeight: 'bold', lineHeight: '1.1' }}>
                    {dailyScoreLabel}<span style={{ fontSize: '0.75rem' }}>点</span>
                  </span>
                  <span style={{ fontSize: '0.52rem', color: '#736e65', marginTop: '2px' }}>
                    {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card Middle (Boundary: 二つ名, Lower Character Top: 相手の名前 on Left, 今日の相性 on Right) */}
          {showOpponent && (
            <div style={{
              position: 'absolute',
              zIndex: 2,
              left: '1.5rem',
              right: '1.5rem',
              top: '50%'
            }}>
              {/* Boundary Line Level: 二つ名 (継ぎ目の真上に中央揃え) */}
              {result.compatibilityTitle && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', transform: 'translateY(-50%)' }}>
                  <div style={{
                    fontSize: '0.62rem',
                    color: '#f2e2b3',
                    fontWeight: 'bold',
                    letterSpacing: '0.04em',
                    background: 'rgba(6, 8, 12, 0.85)',
                    border: '1px solid rgba(226, 192, 116, 0.5)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2'
                  }}>
                    {result.compatibilityTitle}
                  </div>
                </div>
              )}

              {/* Lower Character Top Level: 相手の名前 on Left & 今日の相性 on Right */}
              <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: 相手の名前 (相手のキャラ画像の左上) */}
                <div style={{
                  background: 'rgba(6, 8, 12, 0.72)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  flexShrink: 0
                }}>
                  <span>{formatName(oppNickname)}</span>
                  {(result.opponentIsKaigo || result.opponentIsRare) && (
                    <span className={result.opponentIsKaigo ? 'kaigo-badge' : 'rare-badge'} style={{ fontSize: '0.48rem', padding: '1px 4px', borderRadius: '4px' }}>
                      {result.opponentIsKaigo ? '魁罡' : '極星'}
                    </span>
                  )}
                </div>

                {/* Right: 今日の相性 (基本相性と全く同じ右端揃え) */}
                <div style={{
                  background: 'rgba(6, 8, 12, 0.72)',
                  border: '1.2px solid rgba(156, 198, 216, 0.45)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '0.55rem', color: '#d8d2c6' }}>今日の相性</span>
                  <span className="font-serif" style={{ fontSize: '0.9rem', color: '#9cc6d8', fontWeight: 'bold', lineHeight: '1' }}>
                    {dailyScoreLabel}<span style={{ fontSize: '0.55rem' }}>点</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Card Bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              transform: 'none'
            }}>
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
                  textWrap: 'balance',
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
                    {result.isKaigo ? ' / 魁罡' : (result.isRare ? ' / 極星' : '')}
                  </span>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '0.2rem',
              marginTop: '0.1rem'
            }}>
              <span style={{ fontSize: '0.52rem', color: '#d8d2c6', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                鑑定日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.52rem' }}>|</span>
              <span style={{ fontSize: '0.58rem', color: '#d8d2c6', letterSpacing: '0.05em', textShadow: '0 1px 4px rgba(0,0,0,0.95)', fontWeight: '500' }}>
                恋愛鑑定アプリ - 蓮と月
              </span>
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
              <span style={{ color: savedSuccess ? '#7dbb8a' : 'white', fontWeight: 'bold' }}>
                {isSaving ? '生成・保存中...' : savedSuccess ? '✓ 保存しました' : '画像で保存'}
              </span>
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
