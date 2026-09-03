import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { signInWithGoogle, signInWithX } from '../services/firebase';
import type { FortuneResult } from '../utils/fortuneEngine';

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

  const presetOptions = [
    { key: 'no_reply', text: '好きな人から連絡が来ません' },
    { key: 'unknown_feelings', text: '相手の気持ちが分からなくて不安です' },
    { key: 'next_action', text: '次のアクションをどう起こすべきか迷っています' },
  ];

  // Rotating fallback message index to prevent repeating identical messages
  const [renFallbackIndex, setRenFallbackIndex] = useState(0);
  const [tsukiFallbackIndex, setTsukiFallbackIndex] = useState(0);

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('連絡') || input.includes('返信') || input.includes('既読') || input.includes('未読') || input.includes('line')) {
      return character === 'ren'
        ? '感情に流されず状況を分析しましょう。相手の沈黙や未読は嫌悪ではなく、単に忙しいか、返信に迷っている確率が高いです。焦って何度も追撃するのではなく、数日置いて簡潔で返信しやすい内容を一度だけ送るのが論理的に最善の策です。'
        : '連絡が来ないと不安で胸が締め付けられますよね。既読や未読に一喜一憂してしまうのは、それだけ真剣に想っている証拠。今は相手も心に少しの余白が必要な時期なのかもしれません。優しい風が届くのを信じて、今は自分の時間を温めましょう。';
    } else if (input.includes('気持ち') || input.includes('分から') || input.includes('不安') || input.includes('脈') || input.includes('好き') || input.includes('嫌い')) {
      return character === 'ren'
        ? '他人の心を読むことは不可能です。相手の行動履歴（行動の頻度、対話の速度、共有した時間の長さ）から客観的に好意や信頼度を測定すべきです。推測や脳内補正で不安を膨らませるのではなく、冷静に事実だけを積み上げてください。'
        : '相手の気持ちは見えなくて、霧の中にいるように感じてしまいますよね。でも言葉以上に、ふとした瞬間の優しい視線や、あなたに向けられる微笑みに真実が隠されています。あなたの温かい直感を信じて、焦らず関係を育んでいきましょう。';
    } else if (input.includes('アクション') || input.includes('動く') || input.includes('どうすべき') || input.includes('迷って') || input.includes('デート') || input.includes('誘う')) {
      return character === 'ren'
        ? '感情を行動の動機にするのではなく、次の接点での「具体的な目的」を定義しましょう。軽いランチやお互いの共通の関心事に基づくお誘いなど、心理的ハードルの極めて低い段階的アプローチを計画的に実行すること。行動なき予測は無意味です。'
        : '心が心地よく動く瞬間を大切にしてくださいね。あれこれ計画して計算するよりも、ただ「素敵なお店を見つけたから共有したい」「声が聞きたくなった」という素直で純粋なエネルギーのままに誘うのが、一番美しい結果を呼び寄せます。';
    } else if (input.includes('相性') || input.includes('点数') || input.includes('占い')) {
      return character === 'ren'
        ? '相性の点数は現在の星の配置とデータに基づく一つの静的なシミュレーション値です。点数に一喜一憂するのではなく、相手の性格的ボトルネックをどう補い合うかという分析的アプローチを取ることで、相性値は自ずと100%に近づけられます。'
        : '二人の魂の引き合う力は、目に見える数字（点数）以上に素晴らしい可能性を秘めています。星々の調和が示すサインを受け止めながら、互いの光を補い合い、支え合っていくことで、最高の愛のカタチをクリエイトしていくことができますよ。';
    } else {
      // Rotate fallback messages
      if (character === 'ren') {
        const fallbacks = [
          'なるほど、そのような迷いを抱えているのですね。理性の光で整理すると、問題の本質はあなたの心の中にある「焦り」にあります。一度深呼吸し、客観的に状況を見つめ直してください。解決の糸口は必ず見つかります。',
          'そのお悩みについて、論理的アプローチを試みましょう。不安というフィルターを排除して状況を細分化すれば、次にあなたが取るべき具体的な一手（接点の創出や距離感の再考）が自然と定義されるはずです。',
          '主観的な感情だけでなく、客観的な事実に焦点を当ててください。相手が日頃あなたに対して選択している実体的な行動こそが、最も確実な答えです。冷静な観察眼を維持しましょう。'
        ];
        const reply = fallbacks[renFallbackIndex];
        setRenFallbackIndex((prev) => (prev + 1) % fallbacks.length);
        return reply;
      } else {
        const fallbacks = [
          'その想い、しっかりと受け止めました。とても一生懸命に人を愛しているからこそ、深く悩んでしまうのですね。あなたの優しい心が傷つかないよう、月明かりがそっと行く先を照らしてくれますよ。自分を信じて進んでくださいね。',
          '胸の内に秘めた温かい感情が切々と伝わってきます。心が少し疲れてしまった時は、まず自分自身の心を温かい愛情で満たしてあげることが先決です。焦らず、二人の魂のつながりを信じてゆったりと待ちましょう。',
          '宇宙の星々は、常にあなたにとって最良のタイミングで動きを見せています。今抱えているモヤモヤにも、きっと未来の幸せに必要な意味があるはず。愛に満ちた優しい奇跡を、どうか信じていてくださいね。'
        ];
        const reply = fallbacks[tsukiFallbackIndex];
        setTsukiFallbackIndex((prev) => (prev + 1) % fallbacks.length);
        return reply;
      }
    }
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
      
      const data = await response.json();
      setIsTyping(false);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || getBotResponse(text)
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat API error, falling back to local engine:', err);
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
