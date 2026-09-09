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
    const hasOpp = !!result?.opponentPillar;
    const oppName = hasOpp ? (result?.opponentAstrologyName?.replace(/👑魁罡👑 |👑極稀👑 /g, '') || 'お相手') : 'お相手';
    const oppMbti = result?.opponentMbtiCode || '不明';
    const oppT = oppMbti.includes('T');
    const myStem = result?.myPillar?.[0] || '甲';
    const oppStem = result?.opponentPillar?.[0] || '己';
    const torisetsu = result?.opponentTorisetsu;
    const bestHour = result?.bestContactHour || '20:00〜21:30';

    // 1. LINE・連絡・返信・既読スルー・未読に関する相談
    if (input.includes('連絡') || input.includes('返信') || input.includes('既読') || input.includes('未読') || input.includes('line') || input.includes('ライン')) {
      if (character === 'ren') {
        const deepReason = torisetsu?.slowReplyPsychology || `${oppMbti}の認知特性上、重要タスクの処理中は私用連絡を後回しにする傾向があります。`;
        const actionAdvice = torisetsu?.slowReplyAction || '焦って連投せず、要件を絞った軽やかな1通に留めるのが賢明です。';
        return `【客観的データ分析】
${oppName}様（${oppMbti}）の返信遅延の本質的な理由は「嫌悪」ではありません。
命式と認知行動パターンから解析すると、${deepReason}

🔮 蓮の戦略的一手：
1. 追撃・催促メッセージは即時凍結してください。
2. 送信推奨タイミングは本日【${bestHour}】。
3. ${actionAdvice}

感情で動くのではなく、相手の認知的キャパシティを計算に入れたアプローチが最短で既読・返信を勝ち取る唯一の方法です。`;
      } else {
        const deepReason = torisetsu?.slowReplyPsychology || '今は少し心のエネルギーを充電しているところです。';
        return `連絡が途絶えたり返信が遅いと、胸がぎゅっと締め付けられて本当に不安になりますよね。そのお気持ち、月は痛いほどよくわかります。

でも安心してくださいね。${oppName}様はあなたのことを嫌いになったわけではありません。${deepReason}

🌙 月からの温かいメッセージ：
本日の推奨時間帯は【${bestHour}】です。
もし連絡するなら、「今日もお疲れ様♪ 返信は落ち着いた時でいいからね」と、相手の心の重荷をふわりと下ろしてあげる言葉を添えてみてください。あなたの優しさは、必ずお相手の心に光として届きますよ。`;
      }
    }

    // 2. 相手の気持ち・本音・脈あり/脈なし・不安に関する相談
    if (input.includes('気持ち') || input.includes('分から') || input.includes('不安') || input.includes('脈') || input.includes('好き') || input.includes('嫌い') || input.includes('本音')) {
      const green1 = torisetsu?.greenFlagSign || 'メッセージの頻度が増え、日常の報告が届く。';
      const green2 = torisetsu?.greenFlagLevel2 || 'あなたの好みや過去の言動を細かく覚えている。';
      const redSign = torisetsu?.redFlagSign || '質問返しがなく、短文のみで会話を切り上げようとする。';
      const recovery = torisetsu?.redFlagRecovery || '数日間連絡を控え、軽やかな話題で再アプローチする。';

      if (character === 'ren') {
        return `【相手の本音と脈あり判定データ】
主観的な妄想や不安で相手の心理を推し量るのは極めて非合理的です。${oppName}様（${oppMbti}）の行動指標から測定してください。

🟢 脈ありシグナル（高確率）：
・Lv.1: ${green1}
・Lv.2（本気度高）: ${green2}

🔴 警戒シグナル（リスク検知）：
・${redSign}
・挽回プロトコル: ${recovery}

推測ではなく、お相手があなたに対して選択した『実際の行動』だけを冷静にカウントしてください。手応えのデータは必ずそこにあります。`;
      } else {
        return `お相手の気持ちが見えないと、まるで暗闇を一人で歩いているように心細くなってしまいますよね。誰かを大切に想うからこそ、些細な変化にも心が揺れてしまうのです。

${oppName}様（${oppMbti}）が見せるサインを、星の視点からそっとお伝えしますね。

✨ 心を開いてくれているサイン：
${green1}
また、${green2}といった行動が見られたら、あなたの存在が相手の中でとても大きくなっている証拠です。

⚠️ もし少し冷たく感じたら：
${redSign}のような時は、相手が少し疲れているだけです。${recovery}を意識して、優しく見守ってあげてくださいね。`;
      }
    }

    // 3. 次のアクション・デート・誘い方・どう動くべきか
    if (input.includes('アクション') || input.includes('動く') || input.includes('どうすべき') || input.includes('迷って') || input.includes('デート') || input.includes('誘う') || input.includes('次')) {
      const dateSpot = torisetsu?.idealDateSpot || '落ち着いた雰囲気のカフェや静かなレストラン';
      const inviteMsg = torisetsu?.lineTemplateInvite || '「前話してたあのお店、行ってみない？」';
      const killingWord = torisetsu?.killingWords?.[0] || '「有言実行で頼りになるところ尊敬してる」';

      if (character === 'ren') {
        return `【次期アプローチの最適解】
感情論ではなく、5W1Hに基づく段階的アプローチを設計しましょう。

📍 推奨スポット：
『${dateSpot}』
※${oppName}様の価値観（${oppMbti}）と日干五行（${oppStem}）に最も調和する環境です。

💬 送信すべき招待メッセージ例文：
${inviteMsg}

💡 刺さる褒め言葉（心理的トリガー）：
${killingWord}

曖昧な「いつかご飯行こう」は承諾率を著しく低下させます。日程の二者択一（「金曜の夜か日曜の昼」等）を提示し、論理的に合意を取り付けてください。`;
      } else {
        return `次のステップへ進もうとするあなたの前向きな勇気、とても素敵です！

${oppName}様と距離をぐっと縮めるための開運アクションをお伝えしますね。

🌸 惹かれやすいデート空間：
『${dateSpot}』
お二人が自然体でいられ、心地よい波長が重なり合う特別な場所です。

💌 そのまま送れるお誘いメッセージ：
${inviteMsg}

💕 心をキュンとさせる魔法の言葉：
会話の合間に${killingWord}と伝えてみてください。お相手の警戒心がふっと解けて、あなたを特別な人として意識し始めますよ。`;
      }
    }

    // 4. 相性・運勢・点数・宿命に関する相談
    if (input.includes('相性') || input.includes('点数') || input.includes('占い') || input.includes('運勢') || input.includes('運命')) {
      const base = result?.baseScore || 75;
      const daily = result?.dailyScore || 80;
      const title = result?.compatibilityTitle || '【宿命の調和】';
      const oneLine = result?.oneLiner || 'お互いの長所を引き出し合う好運相性です。';

      if (character === 'ren') {
        return `【相性スコアおよび構造解析】
二人の基本相性値：${base}点（${title}）
本日のバイオリズム相性：${daily}点

判定サマリー：
${oneLine}

命式（日柱：あなた【${myStem}】× 相手【${oppStem}】）と認知機能（MBTI：${oppMbti}）の複合データが示す通り、点数は運気の天井ではなく「攻略のベースライン」です。相手の心理特性（${oppT ? '論理・課題解決志向' : '共感・心情共有志向'}）に合わせたコミュニケーションを徹底することで、関係値は確実に引き上げられます。`;
      } else {
        return `星々の配置とお二人の魂のつながりを紐解いてみましょう。

現在、二人の基本相性は【${base}点】、今日の運気は【${daily}点】という温かい光に包まれています。
タイトルは『${title}』。

${oneLine}

数字以上に、あなたとお相手の間には見えない魂の結びつきがあります。焦らず、お互いの持っている優しさを信じて一歩ずつ歩んでいけば、必ず理想の未来へと花開いていきますよ。`;
      }
    }

    // 5. 例文・テンプレ・文案の要求
    if (input.includes('例文') || input.includes('文案') || input.includes('文章') || input.includes('なんて送') || input.includes('テンプレート')) {
      const inviteMsg = torisetsu?.lineTemplateInvite || '「気になってたあのお店、今度一緒に行かない？」';
      const topicMsg = torisetsu?.lineTemplateTopic || '「最近何かハマってることってある？」';

      if (character === 'ren') {
        return `【即実践可能なLINEメッセージ文案】

① デート・食事への誘導文：
${inviteMsg}

② 雑談を再開させる質問文：
${topicMsg}

⚠️ 送信時の鉄則：
長文は避け、スマホ画面でスクロール不要な3行以内に収めてください。送信タイミングは本日【${bestHour}】を推奨します。`;
      } else {
        return `お相手の心にすっと届く、優しいメッセージ文案をご用意しました♪

💌 お誘いしたいとき：
${inviteMsg}

💬 自然に会話を始めたいとき：
${topicMsg}

絵文字やスタンプを添えて、あなたの温かい笑顔が目に浮かぶようなトーンで届けてあげてくださいね。応援しています！`;
      }
    }

    // 6. 汎用フォールバック（命式・MBTI個別データ織り込み）
    if (character === 'ren') {
      const renFallbacks = [
        `状況を論理的に整理しましょう。あなたの本質（日干【${myStem}】）とお相手の認知傾向（${oppMbti}）を照らし合わせると、現在の課題は「互いのコミュニケーション前提のズレ」に起因している可能性が高いです。感情で動く前に、お相手の取扱説明書（トリセツ）のNG行動を再確認し、リスクを排除した行動を取ってください。`,
        `その疑問に対してデータから回答します。現在お二人の関係性は${result?.baseScore ? `基本相性${result.baseScore}点の軌道上` : '安定した推移'}にあります。感情に左右されて拙速な行動を起こすのではなく、相手の関心領域に合わせた的確な話題提供から対話を再構築するのが合理的です。`,
        `お悩みの本質を見極めましょう。相手の心理機能（${oppT ? '思考機能T優位' : '感情機能F優位'}）を理解すれば、どのようなアプローチが相手の心を開くかは数学的に導き出せます。まずは日頃の接し方において、相手の境界線を尊重できているか見直してください。`
      ];
      const reply = renFallbacks[renFallbackIndex];
      setRenFallbackIndex((prev) => (prev + 1) % renFallbacks.length);
      return reply;
    } else {
      const tsukiFallbacks = [
        `その深い想い、しっかりと受け止めました。誰かを真剣に愛しているからこそ、答えが見えなくて立ち止まってしまうのですよね。あなたの日干【${myStem}】の持つ温かいエネルギーは、間違いなく相手の心を癒やす力を持っています。焦らず、自分の心もたっぷり愛してあげてくださいね。`,
        `胸の内のモヤモヤを打ち明けてくださってありがとうございます。お相手（${oppName}様）の星とあなたの星は、今も静かに共鳴し合っています。言葉にできない想いも、二人の絆を育む大切な糧になります。月の光が、あなたの恋路を優しく照らし守っていますよ。`,
        `愛することに迷いを感じた時は、深呼吸して一度心を空っぽにしてみてください。宇宙の星々は、あなたにとって一番美しく花開くタイミングを知っています。あなたのピュアな優しさを信じて、穏やかな笑顔で過ごしてくださいね。奇跡はすぐそばにあります。`
      ];
      const reply = tsukiFallbacks[tsukiFallbackIndex];
      setTsukiFallbackIndex((prev) => (prev + 1) % tsukiFallbacks.length);
      return reply;
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
