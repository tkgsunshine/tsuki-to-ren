import { useState, useEffect } from 'react';

export interface SavedPartner {
  id: string;
  name: string;
  birth: string;
  mbti: string;
  gender: 'male' | 'female';
  relationship: string;
}
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { ChatModal } from './components/ChatModal';
import { UnifiedInputView, mbtiOptions } from './components/UnifiedInputView';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultView } from './components/ResultView';
import { ShareCardModal } from './components/ShareCardModal';
import { generateFortuneResult } from './utils/fortuneEngine';
import type { FortuneResult } from './utils/fortuneEngine';
import { Sparkles, HelpCircle, Lock, ChevronRight, User, Users, Trash2, Pencil, BookOpen, ShieldAlert, FileText, Building2, ArrowLeft, Calendar, Bell, MessageCircle, Crown } from 'lucide-react';
import { CustomDatePicker } from './components/CustomDatePicker';
import { AuthModal } from './components/AuthModal';
import { LegalPage } from './components/LegalPage';
import { PremiumLPModal } from './components/PremiumLPModal';
import { SeoFooterSection } from './components/SeoFooterSection';
import { ColumnListView } from './components/ColumnListView';
import { ColumnDetailView } from './components/ColumnDetailView';
import { subscribeAuthChange, sendEmailMagicLink, completeEmailMagicLinkSignIn, type UserProfile as FirebaseUser } from './services/firebase';

const formatBirthDate = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
};

function App() {
  // Navigation & Flow
  const [activeTab, setActiveTab] = useState('home');
  const [selectedColumnSlug, setSelectedColumnSlug] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsChatOpen(false);
    setShowPremiumLP(false);
    setShowAuthModal(false);
    setShowLegalPage(false);
    setShowShareCard(false);

    if (tab === 'home') {
      setFlowStep('input');
      setLoadedPartner(null);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainEl = document.querySelector('.main-content');
      if (mainEl) mainEl.scrollTop = 0;
    } else if (tab === 'profile') {
      setSettingsSubView('main');
    } else if (tab === 'column') {
      setSelectedColumnSlug(null);
      window.scrollTo(0, 0);
      const mainEl = document.querySelector('.main-content');
      if (mainEl) mainEl.scrollTop = 0;
    }
  };
  const [flowStep, setFlowStep] = useState<'input' | 'loading' | 'result'>('input');
  
  // Characters
  const [selectedCharacter, setSelectedCharacter] = useState<'ren' | 'tsuki'>('tsuki');
  const [isChatOpen, setIsChatOpen] = useState(false); // Standalone chat simulator in Chat tab
  
  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLegalPage, setShowLegalPage] = useState(false);
  const [showEmailPromptModal, setShowEmailPromptModal] = useState(false);
  const [promptEmailInput, setPromptEmailInput] = useState('');

  useEffect(() => {
    completeEmailMagicLinkSignIn().then((res) => {
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setIsRegistered(true);
      } else if (res.needsEmailPrompt) {
        setShowEmailPromptModal(true);
      }
    });

    const unsubscribe = subscribeAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        setIsRegistered(true);
        if (user.displayName && user.displayName !== 'Google ユーザー' && user.displayName !== 'Apple ユーザー' && user.displayName !== 'X ユーザー') {
          setMyName(user.displayName);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Registration & Subscription Wall
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPremiumLP, setShowPremiumLP] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'profile' | 'partners' | 'about' | 'tokushoho' | 'privacy' | 'company'>('main');

  // My Info (Step 1)
  const [userProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('hasu_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [myName, setMyName] = useState(userProfile?.name || 'あなた');
  const [myBirth, setMyBirth] = useState(userProfile?.birth || '');
  const [myMbti, setMyMbti] = useState(userProfile?.mbti || 'UNKNOWN');
  const [myGender, setMyGender] = useState<'female' | 'male'>(userProfile?.gender || 'female');
  const [showProfileDatePicker, setShowProfileDatePicker] = useState(false);
  const [mode, setMode] = useState<'single' | 'match'>('match');

  // Opponent Info (Step 2)
  const [oppName, setOppName] = useState('お相手');
  const [oppBirth, setOppBirth] = useState('');
  const [oppMbti, setOppMbti] = useState('UNKNOWN');
  const [oppGender, setOppGender] = useState<'male' | 'female'>('male');
  const [relationship, setRelationship] = useState('single');
  const [loadedPartner, setLoadedPartner] = useState<SavedPartner | null>(null);

  const [savedPartners, setSavedPartners] = useState<SavedPartner[]>(() => {
    try {
      const stored = localStorage.getItem('hasu_saved_partners');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('hasu_saved_partners', JSON.stringify(savedPartners));
  }, [savedPartners]);

  // Handle browser back / forward navigation (popstate) & Parse share link query parameters
  useEffect(() => {
    if (!window.history.state || !window.history.state.flowStep) {
      window.history.replaceState({ flowStep: 'input' }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      const targetStep = e.state?.flowStep || 'input';
      setFlowStep(targetStep);
      if (targetStep === 'input') {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Helper to decode 1-char relationship codes & short params
    const decodeRel = (val: string | null) => {
      if (!val) return '片思い中';
      if (val === 'k' || val === 'single' || val === '片思い中') return '片思い中';
      if (val === 'r' || val === 'ryoomoi' || val === '交際中' || val === '両思い・交際中') return '両思い・交際中';
      if (val === 'f' || val === 'fukuen' || val === '復縁したい') return '復縁したい';
      if (val === 'm' || val === 'kekkon' || val === '結婚・夫婦') return '結婚・夫婦';
      if (val === 'c' || val === 'complex' || val === '複雑愛・秘密の恋') return '複雑愛・秘密の恋';
      return val;
    };

    const decodeBirth = (val: string | null) => {
      if (!val) return '';
      if (val.length === 8 && !val.includes('-')) {
        return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6)}`;
      }
      return val;
    };

    const decodeGender = (val: string | null): 'male' | 'female' => {
      if (val === 'm' || val === 'male') return 'male';
      if (val === 'f' || val === 'female') return 'female';
      return 'female';
    };

    // Parse URL params (supports both compact short keys: mn, mb, mm, mg, on, ob, om, og, r & legacy long keys)
    const params = new URLSearchParams(window.location.search);
    const mName = params.get('mn') || params.get('mName') || 'あなた';
    const mBirth = decodeBirth(params.get('mb') || params.get('mBirth'));
    const mMbti = params.get('mm') || params.get('mMbti');
    const mGender = decodeGender(params.get('mg') || params.get('mGender'));
    const oName = params.get('on') || params.get('oName') || 'お相手';
    const oBirth = decodeBirth(params.get('ob') || params.get('oBirth'));
    const oMbti = params.get('om') || params.get('oMbti');
    const oGender = decodeGender(params.get('og') || params.get('oGender'));
    const rel = decodeRel(params.get('r') || params.get('rel'));
    const rawMode = params.get('mode');
    const runMode = (rawMode === 's' || rawMode === 'single') ? 'single' : (rawMode === 'm' || rawMode === 'match' || (oBirth && oMbti)) ? 'match' : null;

    // Dynamic SEO Metadata Injection for 256 MBTI combinations & search terms
    if (mMbti && oMbti && mMbti !== 'UNKNOWN' && oMbti !== 'UNKNOWN') {
      const dynamicTitle = `【16タイプ相性診断】${mMbti} × ${oMbti} の恋愛相性・トリセツ | 月と蓮`;
      const dynamicDesc = `${mMbti}と${oMbti}の恋愛相性スコア、会話のコツ、刺さるLINEメッセージ例、返信率MAXの吉時間を四柱推命×16タイプ診断で完全鑑定。`;
      document.title = dynamicTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', dynamicDesc);
    } else if (params.get('type') === 'kaigou') {
      document.title = `【四柱推命 魁罡（かいごう）】約3.3%の強運特殊干支・恋愛運勢鑑定 | 月と蓮`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', '四柱推命において極めて珍しい強運・カリスマの特殊星「魁罡（かいごう）」の性格特徴、相性の良い相手、恋愛開運バイオリズムを本格解密。');
    }

    if (mName && mBirth && mMbti && mGender) {
      setMyName(mName);
      setMyBirth(mBirth);
      setMyMbti(mMbti);
      setMyGender(mGender);
      if (runMode === 'match' && oName && oBirth && oMbti && oGender) {
        setOppName(oName);
        setOppBirth(oBirth);
        setOppMbti(oMbti);
        setOppGender(oGender);
        setRelationship(rel);
        setMode('match');
        startDiagnosis(mName, mBirth, mMbti, mGender, oName, oBirth, oMbti, oGender, rel, 'match');
      } else {
        setMode('single');
        setRelationship(rel);
        startDiagnosis(mName, mBirth, mMbti, mGender, '', '', 'UNKNOWN', 'female', rel, 'single');
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleResetFlow = () => {
    setFlowStep('input');
    setActiveTab('home');
    setLoadedPartner(null);
    if (window.history.state?.flowStep === 'result') {
      try {
        window.history.pushState({ flowStep: 'input' }, '');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const generateShareUrl = () => {
    const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const baseUrl = isLocal ? window.location.origin + '/share/card' : 'https://tsuki-to-ren.com/share/card';
    const params = new URLSearchParams();
    
    if (!isLocal && window.location.hostname.includes('vercel.app')) {
      params.set('x-vercel-protection-bypass', 'fosYc2r3CdMOALx4Jk0mD0fAz0tzUMs2');
    }

    if (myName && myName !== 'あなた') params.set('mn', myName.slice(0, 8));
    if (myBirth) params.set('mb', myBirth.replace(/-/g, ''));
    if (myMbti) params.set('mm', myMbti);
    params.set('mg', myGender === 'male' ? 'm' : 'f');

    if (mode === 'match') {
      if (oppName && oppName !== 'お相手') params.set('on', oppName.slice(0, 8));
      if (oppBirth) params.set('ob', oppBirth.replace(/-/g, ''));
      if (oppMbti) params.set('om', oppMbti);
      params.set('og', oppGender === 'male' ? 'm' : 'f');

      const relMap: Record<string, string> = {
        '片思い中': 'k',
        '両思い・交際中': 'r',
        '交際中': 'r',
        '復縁したい': 'f',
        '結婚・夫婦': 'm',
        '複雑愛・秘密の恋': 'c'
      };
      params.set('r', relMap[relationship] || 'k');
    } else {
      params.set('mode', 's');
    }

    if (activeResult) {
      params.set('bs', String(activeResult.baseScore));
      params.set('ds', String(activeResult.dailyScore));
    }
    return `${baseUrl}?${params.toString()}`;
  };

  // Notification setting (Every morning 8:00 AM daily luck & LINE hour)
  const [notifyDailyLuck, setNotifyDailyLuck] = useState(() => {
    try {
      const stored = localStorage.getItem('hasu_notify_daily_luck');
      return stored !== null ? JSON.parse(stored) : false;
    } catch (e) {
      return false;
    }
  });
  const [notifyEmail, setNotifyEmail] = useState(() => {
    try {
      return localStorage.getItem('hasu_notify_email') || '';
    } catch (e) {
      return '';
    }
  });
  const [showNotifyEmailModal, setShowNotifyEmailModal] = useState(false);
  const [notifyEmailInput, setNotifyEmailInput] = useState('');

  useEffect(() => {
    localStorage.setItem('hasu_notify_daily_luck', JSON.stringify(notifyDailyLuck));
  }, [notifyDailyLuck]);

  useEffect(() => {
    if (notifyEmail) {
      localStorage.setItem('hasu_notify_email', notifyEmail);
    }
  }, [notifyEmail]);

  // Saved partner editing state
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerBirth, setEditPartnerBirth] = useState('');
  const [editPartnerMbti, setEditPartnerMbti] = useState('UNKNOWN');
  const [editPartnerGender, setEditPartnerGender] = useState<'male' | 'female'>('female');
  const [editPartnerRel, setEditPartnerRel] = useState('single');
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const startEditPartner = (partner: SavedPartner) => {
    setEditingPartnerId(partner.id);
    setEditPartnerName(partner.name);
    setEditPartnerBirth(partner.birth);
    setEditPartnerMbti(partner.mbti);
    setEditPartnerGender(partner.gender);
    setEditPartnerRel(partner.relationship);
  };

  const saveEditPartner = () => {
    if (!editingPartnerId) return;
    if (!editPartnerBirth || editPartnerBirth.length < 10) {
      alert('生年月日は「19950401」のように数字8桁で入力してください。');
      return;
    }
    const updated = savedPartners.map(p => {
      if (p.id === editingPartnerId) {
        return {
          ...p,
          name: editPartnerName || 'お相手',
          birth: editPartnerBirth,
          mbti: editPartnerMbti,
          gender: editPartnerGender,
          relationship: editPartnerRel
        };
      }
      return p;
    });
    setSavedPartners(updated);
    setEditingPartnerId(null);
    alert('お相手の情報を更新しました。');
  };

  const handleSavePartner = () => {
    if (!oppBirth) {
      alert('保存するお相手の情報がありません。');
      return;
    }
    const exists = savedPartners.some(p => p.name === oppName && p.birth === oppBirth);
    if (exists) {
      alert('このお相手は既に保存されています。');
      return;
    }

    const limit = isSubscribed ? 10 : (isRegistered ? 2 : 1);
    if (savedPartners.length >= limit) {
      if (!isRegistered) {
        if (confirm(`非会員の保存上限（1人）に達しています。\n無料会員登録を行うと最大2人まで保存できます。無料登録しますか？`)) {
          setActiveTab('profile');
          setSettingsSubView('profile');
        }
      } else if (!isSubscribed) {
        if (confirm(`無料会員の保存上限（2人）に達しています。\n月額500円の有料会員（プレミアム）になると最大10人まで保存できます。登録しますか？`)) {
          setActiveTab('profile');
          setSettingsSubView('main');
        }
      } else {
        alert('有料会員の保存上限（10人）に達しています。新しいお相手を保存する場合は、不要なデータを削除してください。');
      }
      return;
    }

    const newPartner: SavedPartner = {
      id: `${oppName}_${oppBirth}_${Date.now()}`,
      name: oppName || 'お相手',
      birth: oppBirth,
      mbti: oppMbti,
      gender: oppGender,
      relationship: relationship
    };

    setSavedPartners([...savedPartners, newPartner]);
    alert(`${newPartner.name}様の情報を保存しました。`);
  };

  const handleDeletePartner = (id: string) => {
    setSavedPartners(savedPartners.filter(p => p.id !== id));
    if (loadedPartner && loadedPartner.id === id) {
      setLoadedPartner(null);
    }
  };

  const handleSelectPartner = (partner: SavedPartner) => {
    setLoadedPartner(partner);
    setOppName(partner.name);
    setOppBirth(partner.birth);
    setOppMbti(partner.mbti);

    // Gender Validation: Ensure opposite gender combination (Male x Female)
    const validOppGender = partner.gender === myGender ? (myGender === 'female' ? 'male' : 'female') : partner.gender;
    setOppGender(validOppGender);
    setRelationship(partner.relationship);
    setMode('match');
  };

  // Diagnostic Results Cache
  const [renResult, setRenResult] = useState<FortuneResult | null>(null);
  const [tsukiResult, setTsukiResult] = useState<FortuneResult | null>(null);

  // Form submits
  const handleDiagnosisSubmit = (data: {
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
  }) => {
    setMyName(data.myName);
    setMyBirth(data.myBirth);
    setMyMbti(data.myMbti);
    setOppName(data.oppName);
    setOppBirth(data.oppBirth);
    setOppMbti(data.oppMbti);
    setOppGender(data.oppGender);
    setRelationship(data.relationship);
    setMode(data.mode);

    startDiagnosis(
      data.myName,
      data.myBirth,
      data.myMbti,
      data.myGender,
      data.oppName,
      data.oppBirth,
      data.oppMbti,
      data.oppGender,
      data.relationship,
      data.mode
    );
  };

  const startDiagnosis = (
    mName: string,
    mBirth: string,
    mMbti: string,
    mGender: 'male' | 'female',
    oName: string,
    oBirth: string,
    oMbti: string,
    oGender: 'male' | 'female',
    rel: string,
    runMode: 'single' | 'match'
  ) => {
    setFlowStep('loading');
    
    // Simulate Loading animation for 3 seconds
    setTimeout(() => {
      const input = {
        myName: mName,
        myBirth: mBirth,
        myMbti: mMbti,
        myGender: mGender,
        opponentName: runMode === 'match' ? oName : undefined,
        opponentBirth: runMode === 'match' ? oBirth : undefined,
        opponentMbti: runMode === 'match' ? oMbti : undefined,
        opponentGender: runMode === 'match' ? oGender : undefined,
        relationship: rel
      };

      // Generate results for both characters to allow instant tab toggling
      const resRen = generateFortuneResult(input, 'ren');
      const resTsuki = generateFortuneResult(input, 'tsuki');
      
      setRenResult(resRen);
      setTsukiResult(resTsuki);
      
      setFlowStep('result');
      // Transition active view automatically to result detail and push history entry for browser back
      setActiveTab('home');
      window.history.pushState({ flowStep: 'result' }, '');
    }, 3000);
  };

  const handleRegister = async (email: string) => {
    console.log(`Sending registration email link to: ${email}`);
    const cleanEmail = email.trim().toLowerCase();
    // Strictly send email verification link. Member status is ONLY granted after clicking email link.
    await sendEmailMagicLink(cleanEmail);
  };

  // Helper to get active result based on chosen character tab
  const activeResult = selectedCharacter === 'ren' ? renResult : tsukiResult;

  return (
    <div className="app-container" style={{
      '--color-theme': selectedCharacter === 'tsuki' ? '#d8b4fe' : '#93c5fd',
      '--color-theme-accent': selectedCharacter === 'tsuki' ? '#a855f7' : '#3b82f6',
      '--shadow-theme-glow': selectedCharacter === 'tsuki' ? '0 0 15px rgba(168, 85, 247, 0.45)' : '0 0 15px rgba(59, 130, 246, 0.45)',
    } as React.CSSProperties}>
      {/* Dynamic Background Glow Orb (Smooth transition) */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: selectedCharacter === 'tsuki' 
          ? 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(244, 63, 94, 0.08) 50%, rgba(0,0,0,0) 100%)' 
          : 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(0,0,0,0) 100%)',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none',
        transition: 'all 1.0s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }} />
      {/* Scrollable Main Area */}
      <main className="main-content no-scrollbar">
        
        {/* Tab 1: HOME (Includes Diagnosis Flow) */}
        {activeTab === 'home' && (
          <>
            {flowStep === 'input' && (
              <>
                <Header currentUser={currentUser} onOpenAuth={() => setShowAuthModal(true)} />
                <UnifiedInputView
                  selectedCharacter={selectedCharacter}
                  setSelectedCharacter={setSelectedCharacter}
                  onSubmit={handleDiagnosisSubmit}
                  savedPartners={savedPartners}
                  loadedPartner={loadedPartner}
                  onSelectPartner={handleSelectPartner}
                  onDeletePartner={handleDeletePartner}
                  isRegistered={isRegistered}
                  isSubscribed={isSubscribed}
                />
              </>
            )}

            {flowStep === 'loading' && <LoadingScreen />}

            {flowStep === 'result' && activeResult && renResult && tsukiResult && (
              <ResultView
                result={activeResult}
                renResult={renResult}
                tsukiResult={tsukiResult}
                selectedChar={selectedCharacter}
                setSelectedChar={setSelectedCharacter}
                isRegistered={isRegistered}
                onRegister={handleRegister}
                isSubscribed={isSubscribed}
                onSubscribe={() => setIsSubscribed(true)}
                onOpenPremiumLP={() => setShowPremiumLP(true)}
                onOpenShareCard={() => setShowShareCard(true)}
                myName={myName}
                opponentName={mode === 'match' ? oppName : undefined}
                hasOpponent={mode === 'match'}
                onReset={handleResetFlow}
                onSavePartner={handleSavePartner}
                isPartnerSaved={savedPartners.some(p => p.name === oppName && p.birth === oppBirth)}
                onShowLegal={() => setShowLegalPage(true)}
              />
            )}
          </>
        )}

        {/* Tab 2: LOVE FORTUNE (Direct access to diagnostic result) */}
        {activeTab === 'fortune' && (
          <div style={{ padding: '1rem 0' }}>
            {renResult && tsukiResult && activeResult ? (
              <ResultView
                result={activeResult}
                renResult={renResult}
                tsukiResult={tsukiResult}
                selectedChar={selectedCharacter}
                setSelectedChar={setSelectedCharacter}
                isRegistered={isRegistered}
                onRegister={handleRegister}
                isSubscribed={isSubscribed}
                onSubscribe={() => setIsSubscribed(true)}
                onOpenPremiumLP={() => setShowPremiumLP(true)}
                onOpenShareCard={() => setShowShareCard(true)}
                myName={myName}
                opponentName={mode === 'match' ? oppName : undefined}
                hasOpponent={mode === 'match'}
                onReset={handleResetFlow}
                onSavePartner={handleSavePartner}
                isPartnerSaved={savedPartners.some(p => p.name === oppName && p.birth === oppBirth)}
                onShowLegal={() => setShowLegalPage(true)}
              />
            ) : (
              <div className="glass-panel" style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
                <div style={{ color: 'var(--color-gold)', display: 'flex', justifyContent: 'center' }}>
                  <Sparkles size={48} className="animate-float" />
                </div>
                <h3 className="font-serif gold-text" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                  まだ恋愛相性鑑定がありません
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: '1.5' }}>
                  四柱推命・九星気学・16タイプ診断を掛け合わせた詳細な相性診断を行うには、ホーム画面から占いを開始してください。
                </p>
                <button className="consult-btn" onClick={() => { setActiveTab('home'); setFlowStep('input'); }}>
                  今すぐ相性を占う
                </button>

                {/* 3 Approaches Showcase in Fortune Tab Empty State */}
                <div style={{ marginTop: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

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
              </div>
            )}
          </div>
        )}

        {/* Tab 3: CHAT (Standalone Interactive Chat Simulator) */}
        {activeTab === 'chat' && (
          <div style={{ animation: 'fadeIn 0.5s ease', padding: '1rem 0' }}>
            <h2 className="font-serif gold-text" style={{ fontSize: '1.8rem', textAlign: 'center', margin: '1rem 0 0.5rem' }}>
              対話ロビー
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', marginBottom: '2rem' }}>
              相談したいガイドのチャットルームに入室してください。
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', zIndex: 1, position: 'relative' }}>
              {/* Ren Lobby Card */}
              <div className="glass-panel" style={{
                display: 'flex',
                padding: '1.25rem 1rem',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                border: '1px solid rgba(59,130,246,0.15)',
                transition: 'all 0.3s ease',
                opacity: isRegistered ? 1 : 0.85
              }} onClick={() => {
                if (!isRegistered) {
                  setShowAuthModal(true);
                } else {
                  setSelectedCharacter('ren');
                  setIsChatOpen(true);
                }
              }}>
                <div style={{ position: 'relative' }}>
                  <img src="/assets/ren.jpg" alt="蓮" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-ren)', boxShadow: 'var(--shadow-ren)', filter: isRegistered ? 'none' : 'grayscale(25%) blur(0.3px)' }} />
                  {!isRegistered && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.45)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-gold)'
                    }}>
                      <Lock size={16} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-serif" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    蓮の書斎 (🔮) {!isRegistered && <span style={{ fontSize: '0.6rem', color: 'var(--color-gold)', border: '1px solid rgba(226,192,116,0.3)', padding: '1px 4px', borderRadius: '4px', background: 'rgba(226,192,116,0.05)' }}>要登録</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>男性心理に基づき理性的・分析的なアドバイスを授けます</div>
                </div>
                {isRegistered ? (
                  <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%', boxShadow: '0 0 8px #34d399' }} />
                    待機中
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(226,192,116,0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(226,192,116,0.2)', fontWeight: 'bold' }}>
                    無料登録して開放
                  </span>
                )}
              </div>

              {/* Tsuki Lobby Card */}
              <div className="glass-panel" style={{
                display: 'flex',
                padding: '1.25rem 1rem',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                border: '1px solid rgba(168,85,247,0.15)',
                transition: 'all 0.3s ease',
                opacity: isRegistered ? 1 : 0.85
              }} onClick={() => {
                if (!isRegistered) {
                  setShowAuthModal(true);
                } else {
                  setSelectedCharacter('tsuki');
                  setIsChatOpen(true);
                }
              }}>
                <div style={{ position: 'relative' }}>
                  <img src="/assets/tsuki.jpg" alt="月" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-tsuki)', boxShadow: 'var(--shadow-tsuki)', filter: isRegistered ? 'none' : 'grayscale(25%) blur(0.3px)' }} />
                  {!isRegistered && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.45)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-gold)'
                    }}>
                      <Lock size={16} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-serif" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    月の温室 (🌙) {!isRegistered && <span style={{ fontSize: '0.6rem', color: 'var(--color-gold)', border: '1px solid rgba(226,192,116,0.3)', padding: '1px 4px', borderRadius: '4px', background: 'rgba(226,192,116,0.05)' }}>要登録</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>あなたの不安に共感し、優しく包み込む言葉で寄り添います</div>
                </div>
                {isRegistered ? (
                  <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%', boxShadow: '0 0 8px #34d399' }} />
                    待機中
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(226,192,116,0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(226,192,116,0.2)', fontWeight: 'bold' }}>
                    無料登録して開放
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', margin: '2.5rem 0 1rem', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <HelpCircle size={14} style={{ color: '#ca8a04' }} />
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                {isRegistered 
                  ? '相性診断の結果について質問すると、より深い解説が得られます。' 
                  : '※チャットでの対話相談機能は、無料会員登録が必要です。'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: COLUMNS */}
        {activeTab === 'column' && (
          <div style={{ animation: 'fadeIn 0.4s ease', width: '100%' }}>
            {selectedColumnSlug ? (
              <ColumnDetailView
                slug={selectedColumnSlug}
                onBackToList={() => {
                  setSelectedColumnSlug(null);
                  window.scrollTo(0, 0);
                  const mainContentEl = document.querySelector('.main-content');
                  if (mainContentEl) mainContentEl.scrollTop = 0;
                }}
                onNavigateHome={() => handleTabChange('home')}
                onSelectArticle={(slug) => {
                  setSelectedColumnSlug(slug);
                  window.scrollTo(0, 0);
                  const mainContentEl = document.querySelector('.main-content');
                  if (mainContentEl) mainContentEl.scrollTop = 0;
                }}
              />
            ) : (
              <ColumnListView
                onSelectArticle={(slug) => {
                  setSelectedColumnSlug(slug);
                  window.scrollTo(0, 0);
                  const mainContentEl = document.querySelector('.main-content');
                  if (mainContentEl) mainContentEl.scrollTop = 0;
                }}
                onNavigateHome={() => handleTabChange('home')}
              />
            )}
          </div>
        )}

        {/* Tab 4: SETTINGS */}
        {activeTab === 'profile' && (
          <div style={{ animation: 'fadeIn 0.4s ease', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
            {/* Header / Back Navigation */}
            {settingsSubView !== 'main' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setSettingsSubView('main')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="font-serif gold-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {settingsSubView === 'profile' && 'プロフィール編集'}
                  {settingsSubView === 'partners' && '保存したお相手'}
                  {settingsSubView === 'about' && '月と蓮の占術ロジック'}
                  {settingsSubView === 'tokushoho' && '特定商取引法に基づく表記'}
                  {settingsSubView === 'privacy' && 'プライバシーポリシー'}
                  {settingsSubView === 'company' && '運営会社情報'}
                </span>
              </div>
            ) : (
              <h2 className="font-serif gold-text" style={{ fontSize: '1.8rem', textAlign: 'center', margin: '0.5rem 0 1.5rem' }}>
                アプリ設定・情報
              </h2>
            )}

            {/* Sub-View: MAIN MENU */}
            {settingsSubView === 'main' && (
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                {/* Account Status / Login Banner (1st) */}
                <div 
                  onClick={() => setShowAuthModal(true)}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: currentUser 
                      ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(20, 16, 35, 0.8) 100%)' 
                      : 'linear-gradient(135deg, rgba(226, 192, 116, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                    border: currentUser 
                      ? '1px solid rgba(74, 222, 128, 0.4)' 
                      : '1.5px solid rgba(226, 192, 116, 0.5)',
                    borderRadius: '18px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    marginBottom: '0.85rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid var(--color-gold)' }} />
                    ) : (
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        border: '1.5px solid var(--color-gold)'
                      }}>
                        {currentUser ? (currentUser.displayName || 'U').charAt(0) : <User size={20} />}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: currentUser ? '#ffffff' : '#fef08a' }}>
                        {currentUser ? currentUser.displayName : 'Google / X で無料登録・ログイン'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: currentUser ? '#4ade80' : '#cbd5e1', marginTop: '2px' }}>
                        {currentUser ? `${currentUser.providerId === 'twitter.com' ? 'X 連携中' : 'Google 連携中'} (${currentUser.email || '登録済み'})` : '鑑定履歴・お相手データをクラウド保存'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: currentUser ? '#4ade80' : 'var(--color-gold)' }} />
                </div>

                {/* Premium Plan Upgrade Banner Card / Member Rank (2nd) */}
                <div 
                  onClick={() => setShowPremiumLP(true)}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.12) 0%, rgba(217, 119, 6, 0.15) 100%)',
                    border: '1px solid rgba(250, 204, 21, 0.4)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                    <Crown size={18} style={{ color: '#fef08a', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff' }}>
                          月と蓮 プレミアムプラン
                        </span>
                        <span style={{
                          fontSize: '0.6rem',
                          background: isSubscribed ? '#22c55e' : '#ef4444',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          fontWeight: 'bold'
                        }}>
                          {isSubscribed ? '購読中' : '未登録'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#fef08a', flexShrink: 0 }} />
                </div>

                <div 
                  onClick={() => setSettingsSubView('profile')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <User size={18} style={{ color: '#e2c074' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>プロフィール編集</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#6b7280' }} />
                </div>

                <div 
                  onClick={() => setSettingsSubView('partners')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <Users size={18} style={{ color: '#34d399' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>保存したお相手 ({savedPartners.length}人)</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#6b7280' }} />
                </div>

                {/* 毎朝8時 運勢・吉時間通知設定 (ON / OFF Toggle) */}
                <div 
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                    <Bell size={18} style={{ color: '#fef08a', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>毎朝8時の運勢・吉時間通知</span>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                        {notifyDailyLuck && notifyEmail ? `送信先: ${notifyEmail}` : '本日の運気とLINE推奨時間を毎朝お届け'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isRegistered) {
                        setShowAuthModal(true);
                      } else if (!isSubscribed) {
                        setShowPremiumLP(true);
                      } else if (notifyDailyLuck) {
                        setNotifyDailyLuck(false);
                      } else {
                        setNotifyEmailInput(notifyEmail || currentUser?.email || '');
                        setShowNotifyEmailModal(true);
                      }
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '13px',
                      background: notifyDailyLuck ? 'linear-gradient(135deg, #fbbf24 0%, #ca8a04 100%)' : 'rgba(255,255,255,0.15)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                      boxShadow: notifyDailyLuck ? '0 0 10px rgba(251, 191, 36, 0.4)' : 'none'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: notifyDailyLuck ? '23px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }} />
                  </button>
                </div>

                <div 
                  onClick={() => setSettingsSubView('about')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <BookOpen size={18} style={{ color: '#a855f7' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>月と蓮について (占い解説)</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#6b7280' }} />
                </div>

                <div 
                  onClick={() => setSettingsSubView('tokushoho')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <ShieldAlert size={18} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>特定商取引法に基づく表記</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#6b7280' }} />
                </div>

                <div 
                  onClick={() => setShowLegalPage(true)}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <FileText size={18} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>利用規約・プライバシーポリシー</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#6b7280' }} />
                </div>

                <div 
                  onClick={() => setSettingsSubView('company')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    color: '#f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <Building2 size={18} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>運営会社</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#6b7280' }} />
                </div>
              </div>
            )}

            {/* Sub-View: PROFILE EDIT */}
            {settingsSubView === 'profile' && (
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>お名前</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={myName === 'あなた' ? '' : myName}
                    placeholder="あなた (最大8文字)"
                    onChange={(e) => setMyName(e.target.value.slice(0, 8) || 'あなた')}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.7rem 0.9rem', color: 'white', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>生年月日</label>
                  <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="例：19950401 (数字8桁)"
                      value={myBirth.replace(/-/g, '/')}
                      onChange={(e) => setMyBirth(formatBirthDate(e.target.value).replace(/\//g, '-'))}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.7rem 0.9rem', color: 'white', outline: 'none', fontSize: '0.85rem' }}
                    />
                    <div style={{ position: 'relative', width: '42px', height: '42px' }}>
                      <button
                        type="button"
                        onClick={() => setShowProfileDatePicker(true)}
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#9ca3af', cursor: 'pointer' }}
                      >
                        <Calendar size={18} />
                      </button>
                    </div>
                  </div>
                  {showProfileDatePicker && (
                    <CustomDatePicker
                      value={myBirth}
                      onChange={(val) => setMyBirth(val)}
                      onClose={() => setShowProfileDatePicker(false)}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>16タイプ診断 (性格タイプ)</label>
                  <select
                    value={myMbti}
                    onChange={(e) => setMyMbti(e.target.value)}
                    style={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.7rem 0.9rem', color: 'white', outline: 'none' }}
                  >
                    {mbtiOptions.map((opt: { value: string; label: string }) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>性別 <span style={{ color: '#ef4444' }}>(必須)</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setMyGender('female')}
                      style={{
                        background: myGender === 'female' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: myGender === 'female' ? '1px solid var(--color-tsuki)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '0.65rem',
                        color: myGender === 'female' ? '#d8b4fe' : '#9ca3af',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      女性
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyGender('male')}
                      style={{
                        background: myGender === 'male' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: myGender === 'male' ? '1px solid var(--color-ren)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '0.65rem',
                        color: myGender === 'male' ? '#93c5fd' : '#9ca3af',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      男性
                    </button>
                  </div>
                </div>

                {/* Save Changes Button */}
                <button
                  type="button"
                  className="consult-btn"
                  onClick={() => {
                    try {
                      localStorage.setItem('hasu_user_profile', JSON.stringify({
                        name: myName || 'あなた',
                        birth: myBirth,
                        mbti: myMbti,
                        gender: myGender
                      }));
                    } catch (e) {}
                    alert('プロフィール変更を保存しました！');
                    setSettingsSubView('main');
                  }}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  変更内容を保存する
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>会員ステータス (開発用テスト)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setIsRegistered(!isRegistered)}
                      style={{
                        background: isRegistered ? 'rgba(226, 192, 116, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: isRegistered ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        color: isRegistered ? 'var(--color-gold)' : '#9ca3af',
                        cursor: 'pointer'
                      }}
                    >
                      無料会員: {isRegistered ? '登録済' : 'ゲスト'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSubscribed(!isSubscribed)}
                      style={{
                        background: isSubscribed ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: isSubscribed ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        color: isSubscribed ? '#34d399' : '#9ca3af',
                        cursor: 'pointer'
                      }}
                    >
                      有料会員: {isSubscribed ? '購読中' : '未購読'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-View: SAVED PARTNERS MANAGEMENT */}
            {settingsSubView === 'partners' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 'bold' }}>
                    保存件数: {savedPartners.length} / {isSubscribed ? 10 : (isRegistered ? 2 : 1)}人
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                    {isSubscribed ? '有料会員 (最大10人)' : (isRegistered ? '無料会員 (最大2人)' : '非会員 (最大1人)')}
                  </span>
                </div>

                {savedPartners.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9ca3af', fontSize: '0.8rem', lineHeight: '1.6' }}>
                    保存したお相手のデータはありません。<br />
                    相性鑑定の結果画面からお相手を保存できます。
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {savedPartners.map((partner) => {
                      if (editingPartnerId === partner.id) {
                        return (
                          <div
                            key={partner.id}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(226, 192, 116, 0.35)',
                              borderRadius: '14px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.85rem'
                            }}
                          >
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>
                              お相手情報の編集
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.72rem', color: '#9ca3af' }}>ニックネーム</label>
                              <input
                                type="text"
                                value={editPartnerName}
                                onChange={(e) => setEditPartnerName(e.target.value)}
                                placeholder="お相手のニックネーム"
                                style={{
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px',
                                  padding: '0.5rem 0.75rem',
                                  color: 'white',
                                  fontSize: '0.82rem',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }}>
                              <label style={{ fontSize: '0.72rem', color: '#9ca3af' }}>生年月日 (数字8桁)</label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                  type="text"
                                  value={editPartnerBirth}
                                  onChange={(e) => setEditPartnerBirth(formatBirthDate(e.target.value))}
                                  placeholder="例: 19950125"
                                  style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '0.5rem 0.75rem',
                                    color: 'white',
                                    fontSize: '0.82rem',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowEditDatePicker(!showEditDatePicker)}
                                  style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '0 0.6rem',
                                    color: '#d1d5db',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Calendar size={16} />
                                </button>
                              </div>
                              {showEditDatePicker && (
                                <CustomDatePicker
                                  value={editPartnerBirth}
                                  onChange={(val) => {
                                    setEditPartnerBirth(val);
                                    setShowEditDatePicker(false);
                                  }}
                                  onClose={() => setShowEditDatePicker(false)}
                                />
                              )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.72rem', color: '#9ca3af' }}>16タイプ診断 (MBTI)</label>
                              <select
                                value={editPartnerMbti}
                                onChange={(e) => setEditPartnerMbti(e.target.value)}
                                style={{
                                  background: 'rgba(20, 15, 30, 0.95)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px',
                                  padding: '0.5rem 0.75rem',
                                  color: 'white',
                                  fontSize: '0.78rem',
                                  outline: 'none'
                                }}
                              >
                                {mbtiOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.72rem', color: '#9ca3af' }}>性別</label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditPartnerGender('female')}
                                  style={{
                                    background: editPartnerGender === 'female' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                                    border: editPartnerGender === 'female' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                                    color: editPartnerGender === 'female' ? '#d8b4fe' : '#9ca3af',
                                    borderRadius: '8px',
                                    padding: '0.45rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  女性
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditPartnerGender('male')}
                                  style={{
                                    background: editPartnerGender === 'male' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                                    border: editPartnerGender === 'male' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                    color: editPartnerGender === 'male' ? '#93c5fd' : '#9ca3af',
                                    borderRadius: '8px',
                                    padding: '0.45rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  男性
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={saveEditPartner}
                                style={{
                                  flex: 1,
                                  background: 'linear-gradient(135deg, #fef08a 0%, #e2c074 50%, #d97706 100%)',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#000',
                                  padding: '0.55rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                変更を保存
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPartnerId(null)}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px',
                                  color: '#9ca3af',
                                  padding: '0.55rem 0.85rem',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer'
                                }}
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={partner.id}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>
                                {partner.name}
                              </span>
                              <span style={{
                                fontSize: '0.6rem',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: partner.gender === 'female' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: partner.gender === 'female' ? '#d8b4fe' : '#93c5fd',
                                border: partner.gender === 'female' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                fontWeight: '600'
                              }}>
                                {partner.gender === 'female' ? '女性' : '男性'}
                              </span>
                              {partner.mbti && partner.mbti !== 'UNKNOWN' && (
                                <span style={{
                                  fontSize: '0.6rem',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  background: 'rgba(226, 192, 116, 0.1)',
                                  color: 'var(--color-gold)',
                                  border: '1px solid rgba(226, 192, 116, 0.25)',
                                  fontWeight: '600'
                                }}>
                                  {partner.mbti}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                              生年月日: {partner.birth.replace(/-/g, '/')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => startEditPartner(partner)}
                              style={{
                                background: 'rgba(226, 192, 116, 0.12)',
                                border: '1px solid rgba(226, 192, 116, 0.3)',
                                borderRadius: '8px',
                                color: 'var(--color-gold)',
                                padding: '0.4rem 0.65rem',
                                fontSize: '0.72rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Pencil size={12} />
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`${partner.name}様の保存データを削除しますか？`)) {
                                  handleDeletePartner(partner.id);
                                }
                              }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '8px',
                                color: '#ef4444',
                                padding: '0.4rem 0.5rem',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-View: ABOUT (Astrology Logic Explanation) */}
            {settingsSubView === 'about' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', width: '100%', boxSizing: 'border-box' }}>
                {/* Intro Card */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.6) 0%, rgba(15, 10, 30, 0.7) 100%)', borderRadius: '20px', border: '1px solid rgba(226, 192, 116, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
                    <h3 className="font-serif gold-text" style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>
                      ハイブリッド鑑定エンジンの概要
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                    『月と蓮』は、東洋最古にして最高峰の伝承占術「四柱推命」「九星気学」と、西洋の多角性格分類学「16タイプ心理診断」を独自アルゴリズムで統合した超精密相性鑑定エンジンです。感情の引き寄せから行動パターンの一致度、日々の運勢の波まで、多層的かつ論理的に解析します。
                  </p>
                </div>

                {/* Rare Character / Stars Highlight Card */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.06) 0%, rgba(168, 85, 247, 0.08) 100%)', borderRadius: '20px', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
                  <h4 style={{ color: '#f472b6', fontSize: '0.92rem', fontWeight: 'bold', margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} style={{ color: '#f472b6' }} />
                    特殊星・レアキャラクター例
                  </h4>
                  
                  {/* Real App Rare Card Previews Showcase */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.8rem',
                    marginBottom: '1rem'
                  }}>
                    {/* 1. 魁罡 (Kaigo) Actual Render Sample */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: '16px',
                      padding: '0.75rem',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div className="kaigo-border" style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                        marginBottom: '0.5rem',
                        boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
                      }}>
                        <img
                          src="/assets/astrology_dragon_sample.jpg"
                          alt="魁罡サンプル"
                          className="kaigo-img-glow"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="avatar-shimmer-overlay" />
                        <div className="avatar-halo-spotlight" />
                      </div>
                      <span className="kaigo-badge" style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', marginBottom: '0.25rem' }}>
                        👑 魁罡
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: 'bold' }}>
                        出現率：3.3%
                      </span>
                    </div>

                    {/* 2. 極星 (Gokusei/Rare) Actual Render Sample */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: '16px',
                      padding: '0.75rem',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div className="rare-rainbow-border" style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                        marginBottom: '0.5rem',
                        boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
                      }}>
                        <img
                          src="/assets/astrology_tiger_sample.jpg"
                          alt="極星サンプル"
                          className="rare-holographic-img"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="avatar-shimmer-overlay" />
                        <div className="avatar-halo-spotlight" />
                      </div>
                      <span className="rare-badge" style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', marginBottom: '0.25rem' }}>
                        👑 選ばれし極星
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#fef08a', fontWeight: 'bold' }}>
                        出現率：7.0%
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#d1d5db', lineHeight: '1.55', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div>
                      <strong style={{ color: '#fbcfe8' }}>・魁罡（かいごう：3.3%）</strong>：全12干支キャラクターすべてにおいて3.3%の確率で宿る強力な神殺の化身。強烈なカリスマと勝負運を持つオーラが発動します。
                    </div>
                    <div>
                      <strong style={{ color: '#fbcfe8' }}>・選ばれし極星（7.0%）</strong>：全キャラクターに7.0%の確率で宿る幸運のソウルメイト属性。黄金ホログラムの虹色光彩エフェクトが発動します。
                    </div>
                  </div>
                </div>

                {/* 4 Core Logic Section */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(18, 14, 32, 0.65)', border: '1.5px solid rgba(226, 192, 116, 0.2)', borderRadius: '20px' }}>
                  <h3 className="font-serif gold-text" style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                    4つの多角的アプローチ
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* 1. 四柱推命 */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#e2c074', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        四柱推命<br/><span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'normal' }}>（日柱・五行）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#ffffff', marginBottom: '0.25rem' }}>魂・本質レベルの相性判定</div>
                        <p style={{ color: '#9ca3af', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
                          生年月日の「日」から導かれる十干十二支に基づき、生まれ持った本質・価値観・エネルギーの強弱を精密判定。互いを補い高め合える「相生」や、すれ違いやすいポイントを解明します。
                        </p>
                      </div>
                    </div>

                    {/* 2. レア星・特殊干支解析 */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#f43f5e', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        特殊干支・レア星<br/><span style={{ fontSize: '0.62rem', color: '#fca5a5', fontWeight: 'normal' }}>（魁罡・貴人等）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#fecdd3', marginBottom: '0.25rem' }}>秘められた才能と宿命星の検出</div>
                        <p style={{ color: '#9ca3af', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
                          確率数％の強烈なカリスマと勝負運を秘めた「魁罡（かいごう）」や、生涯のピンチをチャンスに変える最高吉星「天乙貴人（てんおつきじん）」、奇跡的な強運の絆を結ぶ「天地徳合」などを自動検出・鑑定結果に反映します。
                        </p>
                      </div>
                    </div>

                    {/* 3. 九星気学 */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#c084fc', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        九星気学<br/><span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'normal' }}>（本命五行）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#ffffff', marginBottom: '0.25rem' }}>生活テンポと運気の調和</div>
                        <p style={{ color: '#9ca3af', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
                          生まれた「年」の九星エネルギーから、日常の行動ペースや決断のタイミングを分析。二人の相乗効果が高まる時期や、協力時のベストな関係性を提示します。
                        </p>
                      </div>
                    </div>

                    {/* 4. 16タイプ */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#60a5fa', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        16タイプ<br/><span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 'normal' }}>（心理傾向）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#ffffff', marginBottom: '0.25rem' }}>会話癖とLINEコミュニケーション</div>
                        <p style={{ color: '#9ca3af', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
                          心理分析理論を用いて、相手の会話の癖・思考プロセス・感情表現の傾向を解析。心の距離を縮める最適な接し方やLINE送信用実効テクニックを導き出します。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Biorhythm Card */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    日盤連動バイオリズムと吉時間
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.55', margin: 0 }}>
                    『月と蓮』のデイリー運気は、当日の日盤運気の巡りとご自身の本質を掛け合わせてリアルタイム算出。引き寄せが高まる「幸運日」や、連絡に最適な「LINE推奨時間」をグラフ表示します。
                  </p>
                </div>
              </div>
            )}

            {/* Sub-View: TOKUSHOHO */}
            {settingsSubView === 'tokushoho' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.75rem', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>販売事業者</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Ill株式会社</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>運営責任者</span>
                  <span style={{ color: 'white' }}>山下 高志</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#9ca3af' }}>所在地</span>
                  <span style={{ color: 'white' }}>東京都渋谷区代々木２丁目２４−８</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>お問合せ</span>
                  <span style={{ color: 'white' }}>support@tsuki-to-ren.com</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>販売価格</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>プレミアムプラン: 月額500円 (税込)</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#9ca3af' }}>商品代金以外の料金</span>
                  <span style={{ color: 'white' }}>パケット通信料等（お使いの回線に応じます）</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>商品の引き渡し</span>
                  <span style={{ color: 'white' }}>購入手続き完了後、ただちにご利用可能</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#9ca3af' }}>返品・退会について</span>
                  <span style={{ color: 'white' }}>デジタルコンテンツの特性上、決済完了後の返金はできません。プラン解約は設定よりいつでも即時可能です。</span>
                </div>
              </div>
            )}

            {/* Sub-View: PRIVACY POLICY */}
            {settingsSubView === 'privacy' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.75rem', lineHeight: '1.6', color: '#cbd5e1', width: '100%', boxSizing: 'border-box' }}>
                <div>
                  <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.25rem' }}>1. 収集する個人情報</h4>
                  <p>本アプリは、正確な占星術鑑定及びAI相談の提供目的で、生年月日、ニックネーム、16タイプ性格データ、チャットテキストを収集・保持します。</p>
                </div>
                <div>
                  <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.25rem' }}>2. 利用目的</h4>
                  <p>・AIアドバイザーによる対話支援のため<br/>・日干・九星相性ロジック計算のため<br/>・サービスのセキュリティと品質改善のため</p>
                </div>
                <div>
                  <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.25rem' }}>3. 情報の保護と管理</h4>
                  <p>お預かりした生年月日等のデータは暗号化通信を行い、法令に基づく場合を除いて第三者への無断共有や提供は一切行いません。</p>
                </div>
              </div>
            )}

            {/* Sub-View: COMPANY */}
            {settingsSubView === 'company' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.75rem', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>社名</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Ill株式会社</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>代表取締役</span>
                  <span style={{ color: 'white' }}>山下 高志</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>設立</span>
                  <span style={{ color: 'white' }}>2022年6月1日</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#9ca3af' }}>事業内容</span>
                  <span style={{ color: 'white' }}>AI占いコンテンツ開発、次世代マッチングプラットフォーム『月と蓮』の企画運営・システム提供。</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO Keyword & Rich FAQ Footer Section (Only visible on Home / Top page) */}
        {activeTab === 'home' && flowStep === 'input' && <SeoFooterSection />}

        {/* Global Bottom Scroll Spacer for Mobile Safe Area & Navbar Coverage */}
        <div style={{ height: 'calc(7.5rem + var(--safe-bottom, 0px))', width: '100%', flexShrink: 0 }} />
      </main>

      {/* Interactive Chat Modal Simulator (Lobby active) */}
      {isChatOpen && (
        <ChatModal
          character={selectedCharacter}
          isRegistered={isRegistered}
          isSubscribed={isSubscribed}
          chatCount={chatCount}
          setChatCount={setChatCount}
          onRegister={handleRegister}
          onSubscribe={() => setIsSubscribed(true)}
          onClose={() => setIsChatOpen(false)}
          result={activeResult}
        />
      )}

      {/* Share Card Modal Overlay */}
      {showShareCard && activeResult && (
        <ShareCardModal
          selectedChar={selectedCharacter}
          result={activeResult}
          myName={myName}
          opponentName={mode === 'match' ? oppName : undefined}
          hasOpponent={mode === 'match'}
          shareUrl={generateShareUrl()}
          onClose={() => setShowShareCard(false)}
        />
      )}
      {/* Google / Apple Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
        />
      )}

      {/* Legal Page (利用規約・プライバシーポリシー) */}
      {showLegalPage && (
        <LegalPage onClose={() => setShowLegalPage(false)} />
      )}

      {/* Email Notification Setup Modal */}
      {showNotifyEmailModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 2, 5, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.25rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '420px',
            background: 'linear-gradient(180deg, rgba(20, 16, 38, 0.98) 0%, rgba(10, 8, 22, 0.99) 100%)',
            border: '1px solid rgba(226, 192, 116, 0.3)',
            borderRadius: '24px',
            padding: '1.75rem 1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell size={20} style={{ color: '#fbbf24' }} />
                <h3 className="font-serif gold-text" style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold' }}>
                  運勢通知の送信先設定
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifyEmailModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#9ca3af',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#d1d5db', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              毎朝8時に「本日の運勢・吉時間」をメールでお届けします。通知の受け取り用メールアドレスを選択または入力してください。
            </p>

            {/* Quick select buttons if logged in email or existing email is available */}
            {(currentUser?.email || (notifyEmail && notifyEmail !== currentUser?.email)) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>連携済みアドレスから選択:</span>
                {currentUser?.email && (
                  <button
                    type="button"
                    onClick={() => setNotifyEmailInput(currentUser.email || '')}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      background: notifyEmailInput === currentUser.email ? 'rgba(226, 192, 116, 0.15)' : 'rgba(255,255,255,0.04)',
                      border: notifyEmailInput === currentUser.email ? '1px solid rgba(226, 192, 116, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: notifyEmailInput === currentUser.email ? '#fef08a' : '#cbd5e1',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    📧 {currentUser.email} （ログイン中アカウント）
                  </button>
                )}
                {notifyEmail && notifyEmail !== currentUser?.email && (
                  <button
                    type="button"
                    onClick={() => setNotifyEmailInput(notifyEmail)}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      background: notifyEmailInput === notifyEmail ? 'rgba(226, 192, 116, 0.15)' : 'rgba(255,255,255,0.04)',
                      border: notifyEmailInput === notifyEmail ? '1px solid rgba(226, 192, 116, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: notifyEmailInput === notifyEmail ? '#fef08a' : '#cbd5e1',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✉️ {notifyEmail} （設定済みアドレス）
                  </button>
                )}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
                直接入力 / 変更:
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                value={notifyEmailInput}
                onChange={(e) => setNotifyEmailInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!notifyEmailInput || !notifyEmailInput.includes('@')) {
                  alert('有効なメールアドレスを入力してください。');
                  return;
                }
                setNotifyEmail(notifyEmailInput.trim());
                setNotifyDailyLuck(true);
                setShowNotifyEmailModal(false);
              }}
              className="gold-button"
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '14px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              通知を有効化する
            </button>
          </div>
        </div>
      )}

      {/* Premium LP Modal / Landing Page */}
      <PremiumLPModal
        isOpen={showPremiumLP}
        onClose={() => setShowPremiumLP(false)}
        onSubscribe={() => setIsSubscribed(true)}
        isSubscribed={isSubscribed}
        isRegistered={isRegistered}
        onRegisterFirst={() => setShowAuthModal(true)}
      />

      {/* Email Verification Prompt Modal (for cross-browser/device link clicks) */}
      {showEmailPromptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.75rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.1rem', border: '1px solid rgba(226, 192, 116, 0.4)', borderRadius: '20px' }}>
            <h3 className="font-serif gold-text" style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
              ✉️ メール認証の最終確認
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
              メールリンクからのアクセスを確認いたしました。<br />
              完了するため、ご入力されたメールアドレスを入力してください。
            </p>
            <input
              type="email"
              placeholder="例: user@example.com"
              value={promptEmailInput}
              onChange={(e) => setPromptEmailInput(e.target.value)}
              style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', textAlign: 'center', fontSize: '0.88rem', outline: 'none' }}
            />
            <button
              onClick={async () => {
                const clean = promptEmailInput.trim().toLowerCase();
                if (!clean || !clean.includes('@')) {
                  alert('有効なメールアドレスを入力してください。');
                  return;
                }
                const res = await completeEmailMagicLinkSignIn(clean);
                if (res.success && res.user) {
                  setCurrentUser(res.user);
                  setIsRegistered(true);
                  setShowEmailPromptModal(false);
                } else {
                  alert('認証に失敗しました。メールアドレスが正しいかご確認ください。');
                }
              }}
              className="consult-btn font-serif"
              style={{ padding: '0.85rem', width: '100%', fontSize: '0.9rem', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }}
            >
              認証を完了して解放する →
            </button>
          </div>
        </div>
      )}

      {/* Global Bottom Navbar (Always visible on top of all pages) */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}

export default App;
