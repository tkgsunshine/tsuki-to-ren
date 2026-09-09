import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { signInWithGoogle, signInWithX } from '../services/firebase';
import type { FortuneResult } from '../utils/fortuneEngine';
import { generateChatResponse } from '../utils/chatEngine';

interface ChatModalProps {
  character: 'ren' | 'tsuki';
  isRegistered: boolean;
  isSubscribed: boolean;
  chatCount: number;
  setChatCount: React.Dispatch<React.SetStateAction<number>>;
  onRegister: (email: string) => Promise<void>;
  onSubscribe: () => void;
  onClose: () => void;
  result?: FortuneResult | null;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  character,
  isRegistered,
  isSubscribed,
  chatCount,
  setChatCount,
  onRegister,
  onSubscribe,
  onClose,
  result
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRegisterOverlay, setShowRegisterOverlay] = useState(false);
  const [showSubscribeOverlay, setShowSubscribeOverlay] = useState(false);
  const [emailSentChat, setEmailSentChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const characterName = character === 'ren' ? '蓮' : '月';
  const characterAvatar = character === 'ren' ? '/assets/ren.jpg' : '/assets/tsuki.jpg';

  // Initial greeting
  useEffect(() => {
    const greetingText = character === 'ren'
      ? '私は蓮。理性と導きを司る者。あなたの心境を整理し、進むべき道を論理的に紐解きましょう。今、どのようなことに迷っていますか？'
      : '私は月。直感と優しさを司る者。あなたの心の声に耳を傾け、優しく寄り添います。今、どんな想いを抱えていますか？';
    
    setMessages([
      { id: '1', sender: 'bot', text: greetingText }
    ]);
  }, [character]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const oppDisplayName = result?.opponentAstrologyName?.replace(/👑魁罡👑 |👑極稀👑 /g, '') || 'お相手';
  const presetOptions = [
    { key: 'no_reply', text: `${oppDisplayName}から連絡が来ない理由と対策は？` },
    { key: 'unknown_feelings', text: `${oppDisplayName}の本音や脈ありサインを教えて` },
    { key: 'next_action', text: `次のデートやお誘いはどう切り出すべき？` },
    { key: 'torisetsu', text: `${oppDisplayName}の地雷（NG行為）と喜ぶツボは？` },
  ];

  const getBotResponse = (userInput: string): string => {
    return generateChatResponse({
      userInput,
      character,
      result,
      history: messages
    });
  };

  const getDiagnosedDataText = (): string => {
    if (!result) return '';
    const hasOpp = !!result.opponentPillar;
    const basicInfo = `【あなたの属性】
命式の日干（本質）: ${result.myPillar}
本命星（九星）: ${result.myStar}
性格タイプ（16タイプ診断）: ${result.myMbtiText} (${result.myMbtiName})`;
    
    if (hasOpp) {
      return `${basicInfo}
      
【お相手の属性】
命式の日干: ${result.opponentPillar}
本命星: ${result.opponentStar}
性格タイプ: ${result.opponentMbtiText || '不明'} (${result.opponentMbtiName || '不明'})

【現在の二人の相性】
基本相性値: ${result.baseScore}点
今日のバイオリズム相性値: ${result.dailyScore}点
二人の相性一言要約: "${result.oneLiner}"`;
    }
    
    return basicInfo;
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Guest Lock Check
    if (!isRegistered) {
      setShowRegisterOverlay(true);
      return;
    }

    // 2. Free Member Limit Check (2 messages limit)
    if (!isSubscribed && chatCount >= 2) {
      setShowSubscribeOverlay(true);
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setChatCount(prev => prev + 1);

    // Trigger typing indicator
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          character,
          diagnosedData: getDiagnosedDataText(),
          history
        })
      });
      
      if (!response.ok) {
        throw new Error(`Chat API HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setIsTyping(false);
      
      const replyText = data.reply && !data.debug?.includes('API Key is missing') && !data.debug?.includes('Error')
        ? data.reply
        : getBotResponse(text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.log('Chat falling back to local engine:', err);
      setIsTyping(false);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: getBotResponse(text)
      };
      setMessages(prev => [...prev, botMsg]);
    }
  };

  return (
    <div className="chat-overlay">
      <div className="chat-window" style={{ position: 'relative', overflow: 'hidden' }}>
        
        {/* Guest Free Member Registration Form Overlay */}
        {showRegisterOverlay && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 5, 10, 0.95)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ color: 'var(--color-gold)', marginBottom: '0.75rem' }}>
              <Sparkles size={40} className="animate-float" />
            </div>
            <h3 className="font-serif gold-text" style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              蓮・月との個別相談チャット
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              無料のメンバー登録を行うことで、気になることや恋愛のお悩みなど、どうぞお気軽にご相談ください。
            </p>
            {emailSentChat ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✉️</div>
                <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>認証メールを送信しました！</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: '1.6' }}>
                  メールに届いたリンクをクリックすると<br />
                  登録が完了し、チャットが解放されます。
                </p>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const emailInput = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value.trim().toLowerCase();
                if (!emailInput || !emailInput.includes('@')) {
                  alert('有効なメールアドレスを入力してください。');
                  return;
                }
                try {
                  await onRegister(emailInput);
                  setEmailSentChat(true);
                } catch {
                  alert('メール送信に失敗しました。もう一度お試しください。');
                }
              }} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="メールアドレスを入力..."
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    color: 'white',
                    outline: 'none',
                    textAlign: 'center',
                    fontSize: '0.8rem'
                  }}
                />
                <button type="submit" className="consult-btn" style={{ fontSize: '0.85rem', padding: '0.75rem', background: 'linear-gradient(135deg, #fbbf24 0%, #ca8a04 100%)', color: '#000', fontWeight: 'bold' }}>
                  無料で登録してチャットを開始
                </button>
              </form>
            )}

            <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '1rem 0', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }}></div>
              <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>または</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }}></div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button 
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    setShowRegisterOverlay(false);
                  } catch(e) {
                    console.error(e);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#ffffff',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.7rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#ea4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.339 0 3.38 2.673 1.455 6.564l3.81 3.201z"/>
                  <path fill="#34a853" d="M16.04 15.345c-1.077.732-2.43 1.164-4.04 1.164-2.955 0-5.466-1.996-6.36-4.686L1.83 15.024C3.755 18.915 7.714 21.588 12 21.588c2.903 0 5.642-.99 7.712-2.82l-3.673-3.423z"/>
                  <path fill="#4285f4" d="M23.49 12.275c0-.687-.06-1.387-.18-2.075H12v4.512h6.458c-.27 1.455-1.09 2.69-2.316 3.513l3.673 3.423C21.982 19.336 23.49 16.073 23.49 12.275z"/>
                  <path fill="#fbbc05" d="M5.64 11.823A6.953 6.953 0 0 1 5.266 9.77l-3.81-3.2A11.968 11.968 0 0 0 0 12c0 2.01.5 3.905 1.385 5.586l4.255-3.2a6.953 6.953 0 0 1-.382-2.073z"/>
                </svg>
                Googleで登録
              </button>

              <button 
                onClick={async () => {
                  try {
                    await signInWithX();
                    setShowRegisterOverlay(false);
                  } catch(e) {
                    console.error(e);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '0.7rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#000000')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Xで登録
              </button>
            </div>

            <button 
              onClick={() => setShowRegisterOverlay(false)}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '0.7rem', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              閉じる
            </button>
          </div>
        )}

        {/* Free Member Limit Overlay (Premium subscription CTA) */}
        {showSubscribeOverlay && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2, 2, 5, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '380px',
              background: 'rgba(15, 7, 40, 0.95)',
              border: '1px solid rgba(226, 192, 116, 0.25)',
              borderRadius: '28px',
              padding: '1.5rem 1.25rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              {/* Badge */}
              <div style={{
                fontSize: '0.62rem',
                color: '#fef08a',
                border: '1px solid rgba(254, 240, 138, 0.3)',
                background: 'rgba(254, 240, 138, 0.1)',
                borderRadius: '20px',
                padding: '3px 12px',
                fontWeight: 'bold',
                marginBottom: '0.75rem',
                letterSpacing: '0.05em'
              }}>
                ✦ プレミアムプラン解放 ✦
              </div>

              {/* Title */}
              <h3 className="font-serif gold-text" style={{
                fontSize: '1.05rem',
                fontWeight: 'bold',
                marginBottom: '0.4rem',
                lineHeight: '1.4'
              }}>
                二人の未来予測スケジュールをすべて解禁
              </h3>

              {/* Subtitle */}
              <p style={{
                fontSize: '0.68rem',
                color: '#cbd5e1',
                lineHeight: '1.4',
                marginBottom: '1rem'
              }}>
                月額500円で、今後の運勢バイオリズムや恋愛成就へのロードマップをいつでも確認できます。
              </p>

              {/* Feature Checklist Box */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '1rem 0.85rem',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
                textAlign: 'left',
                boxSizing: 'border-box',
                marginBottom: '1.25rem'
              }}>
                {[
                  'お相手の取扱説明書（トリセツ）＆深層鑑定の全解禁',
                  '月次・年次運勢スケジュールの完全閲覧',
                  'お相手の保存上限が10人に拡大（無料会員2人 → 10人）',
                  '月 & 蓮へのチャット相談が無制限・全開放',
                  '本日の運気の波・LINE吉時間を毎日お届け'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                    <span style={{ color: '#fbbf24', fontSize: '0.75rem', lineHeight: '1.1', fontWeight: 'bold' }}>✓</span>
                    <span style={{ fontSize: '0.68rem', color: '#e2e8f0', lineHeight: '1.3' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button 
                onClick={() => {
                  onSubscribe();
                  setShowSubscribeOverlay(false);
                  alert('プレミアムプランに登録しました！チャットが無制限になります。');
                }} 
                className="consult-btn" 
                style={{
                  width: '100%',
                  fontSize: '0.82rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #e2c074 0%, #c5a059 100%)',
                  color: '#0f0728',
                  fontWeight: '900',
                  borderRadius: '30px',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(226, 192, 116, 0.4), 0 0 10px rgba(254, 240, 138, 0.2)',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>🔒</span> プレミアム登録して全解禁 (月額500円)
              </button>

              {/* Close Link */}
              <button 
                onClick={() => setShowSubscribeOverlay(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '0.7rem',
                  marginTop: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-user">
            <div className="chat-header-avatar">
              <img src={characterAvatar} alt={characterName} />
            </div>
            <div className="chat-header-info">
              <span className="chat-header-name text-white">{characterName}</span>
              <span className="chat-header-status">
                {isSubscribed ? 'プレミアム対話中' : (isRegistered ? `本日あと ${Math.max(0, 2 - chatCount)} 回` : '要無料登録')}
              </span>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages chat-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble bot text-gray-400 italic">
              {characterName}が言葉を紡いでいます...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Predefined Options */}
        {messages.length === 1 && !isTyping && (
          <div className="chat-options-container">
            <div className="chat-options-title">よくあるお悩み</div>
            {presetOptions.map((opt) => (
              <button
                key={opt.key}
                className="chat-option-btn"
                onClick={() => handleSend(opt.text)}
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder={isRegistered ? "メッセージを入力..." : "無料メンバー登録後に送信できます"}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button className="chat-send-btn" onClick={() => handleSend(inputText)}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
