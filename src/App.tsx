import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface SavedPartner {
  id: string;
  name: string;
  birth: string;
  mbti: string;
  gender: 'male' | 'female';
  relationship: string;
  /** 買い切り（お相手1人の深層鑑定 ¥680）で解放したお相手。保存上限に数えない */
  unlocked?: boolean;
  /** 月額会員の「今日」画面の二人の道のり（片思い／付き合っている・段階・今の状況）。端末とアカウントで同期する */
  journey?: Journey;
}
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { ChatModal } from './components/ChatModal';
import { UnifiedInputView } from './components/UnifiedInputView';
import { mbtiOptions } from './constants/mbti';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultView } from './components/ResultView';
import { PartnerReplaceModal } from './components/PartnerReplaceModal';
import { ShareCardModal } from './components/ShareCardModal';
import { generateFortuneResult, san } from './utils/fortuneEngine';
import type { FortuneResult, DiagnosisInput } from './utils/fortuneEngine';
import type { Journey } from './utils/partnerToday';
import { HelpCircle, Lock, ChevronRight, User, Users, Trash2, Pencil, BookOpen, ShieldAlert, FileText, Building2, ArrowLeft, MessageCircle, Calendar, Bell, Crown, Smartphone, Megaphone } from 'lucide-react';
import { MoonMark } from './components/icons/BrandIcons';
import { CustomDatePicker } from './components/CustomDatePicker';
import { ContactForm } from './components/ContactForm';
import { NoticesView } from './components/NoticesView';
import { useNotices } from './services/notices';
import { AuthModal } from './components/AuthModal';
import { LegalPage } from './components/LegalPage';
import { PremiumLPModal } from './components/PremiumLPModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { SeoFooterSection } from './components/SeoFooterSection';
import { GuardianZukan } from './components/GuardianZukan';
import { ToolGuardiansView } from './components/ToolGuardiansView';
import { ColumnListView } from './components/ColumnListView';
import { ColumnDetailView } from './components/ColumnDetailView';
import { ToolNicchuView } from './components/ToolNicchuView';
import { ToolCompatView } from './components/ToolCompatView';
import { lpExitAnswered, trackCheckout, trackFortune, trackLpExit, trackPremiumView, trackRegStep } from './services/analytics';
import { LpExitSurvey } from './components/LpExitSurvey';
import { ReferralCodeEntry } from './components/ReferralInvite';
import { captureRefFromUrl, completeRef, fetchMyReferral, getPendingRef, hasSentRef, setPendingRef as savePendingRef, type ReferralStatus } from './services/referral';
import { signInWithCustomToken } from 'firebase/auth';
import { getFirebaseAuth, subscribeAuthChange, clearAccountDataOnDevice, sendEmailMagicLink, completeEmailMagicLinkSignIn, isAddEmailLink, completeAddEmailLink, accountNeedsEmail, isGuestAccount, checkRedirectAuthResult, saveEmailSubscriptionData, enableDailyMailForNewMember, getEmailSubscription, updateEmailSubscriptionProfile, unsubscribeEmailSubscription, type EmailSubscriptionData, type UserProfile as FirebaseUser } from './services/firebase';
import { showAlert, showConfirm, showFieldError } from './components/AppDialog';
import { PremiumWelcomeModal } from './components/PremiumWelcomeModal';
import { SharedResultView, readSharedResult } from './components/SharedResultView';
import { SHARE_MBTI_NAMES, shareLineCode, shareTitleCode } from '../api/_lib/share-card-text.js';
import { claimCheckout, fetchPremiumStatus, formatMonthDay, openBillingPortal, readCachedPremium, startPairCheckout, startPremiumCheckout } from './services/premium';
import { fetchPartnerAccess, readCachedPartnerAccess, writeCachedPartnerAccess } from './services/partnerDays';
import { readNav, replaceNav, pushNav, goBackOr, syncOverlays, pageKey, routeFromPath, type NavState, type OverlayName, type PageFields, type SettingsSubView } from './utils/navHistory';
import { fetchUserData, saveUserData, readSyncOwner, writeSyncOwner } from './services/userData';
import { decideSync, sameProfile, samePartners, type SyncProfile } from './utils/userDataSync';
import type { PairUnlock, PartnerLock } from './components/ResultView';

const formatBirthDate = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
};

const NEW_PARTNER_ID = '__new__';

// A complete, real calendar date (YYYY-MM-DD). The daily email cannot compute a fortune without one.
// 決済の直前に控える鑑定の入力（このタブだけ）と、読み込んだ時点のURL（?pair= などはすぐ消すため）
const CHECKOUT_READING_KEY = 'hasu_checkout_reading';
const INITIAL_SEARCH = typeof window === 'undefined' ? '' : window.location.search;
// 決済へ移ったとき購入LPを開いていたら、そのLPで先に見せていたプラン（このタブだけ）。Stripeから戻ったら同じLPを開き直す
const CHECKOUT_LP_KEY = 'hasu_checkout_lp';
// 読み込んだ時点の履歴（下の最初の effect で重ね表示を消す前）。ブラウザの「戻る」で読み込み直したとき、購入LPを開いていたかを見る
const INITIAL_HISTORY_STATE: unknown = typeof window === 'undefined' ? null : window.history.state;
const isNavStateWithOverlay = (v: unknown, name: string): boolean =>
  !!v && typeof v === 'object' && Array.isArray((v as { overlays?: unknown }).overlays) && ((v as { overlays: unknown[] }).overlays).includes(name);
const isValidBirthDate = (val: string): boolean => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val || '');
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return y >= 1900 && date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d && date <= new Date();
};

interface InitialRoute {
  tab: string;
  slug: string | null;
  legal: boolean;
  settingsSubView: 'main' | 'profile' | 'partners' | 'about' | 'tokushoho' | 'privacy' | 'company' | 'contact' | 'news';
  compatibilityPair: { myMbti: string; oppMbti: string } | null;
}

const IS_PRODUCTION_SITE = typeof window !== 'undefined' && window.location.hostname.endsWith('tsuki-to-ren.com');

const getInitialRoute = (): InitialRoute => {
  if (typeof window === 'undefined') {
    return { tab: 'home', slug: null, legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  const path = window.location.pathname;
  if (path.startsWith('/column/')) {
    const slug = path.replace('/column/', '').replace(/\/$/, '');
    return { tab: 'column', slug: slug || null, legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/column' || path === '/column/') {
    return { tab: 'column', slug: null, legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/tools/nicchu' || path === '/tools/nicchu/') {
    return { tab: 'tool', slug: 'nicchu', legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/guardians' || path === '/guardians/') {
    return { tab: 'tool', slug: 'guardians', legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/compatibility' || path === '/compatibility/') {
    return { tab: 'tool', slug: 'compat', legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/terms' || path === '/terms/' || path === '/privacy' || path === '/privacy/') {
    return { tab: 'home', slug: null, legal: true, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/tokushoho' || path === '/tokushoho/') {
    return { tab: 'profile', slug: null, legal: false, settingsSubView: 'tokushoho', compatibilityPair: null };
  }
  if (path === '/company' || path === '/company/') {
    return { tab: 'profile', slug: null, legal: false, settingsSubView: 'company', compatibilityPair: null };
  }
  if (path === '/contact' || path === '/contact/') {
    return { tab: 'profile', slug: null, legal: false, settingsSubView: 'contact', compatibilityPair: null };
  }
  if (path === '/news' || path === '/news/') {
    return { tab: 'profile', slug: null, legal: false, settingsSubView: 'news', compatibilityPair: null };
  }
  if (path === '/about' || path === '/about/') {
    return { tab: 'profile', slug: null, legal: false, settingsSubView: 'about', compatibilityPair: null };
  }
  if (path === '/result' || path === '/result/' || path === '/fortune' || path === '/fortune/') {
    return { tab: 'fortune', slug: null, legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/chat' || path === '/chat/') {
    return { tab: 'chat', slug: null, legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  if (path === '/mypage' || path === '/mypage/' || path === '/profile' || path === '/profile/') {
    return { tab: 'profile', slug: null, legal: false, settingsSubView: 'main', compatibilityPair: null };
  }
  const compMatch = path.match(/^\/compatibility\/([a-zA-Z]{4})-([a-zA-Z]{4})/i);
  if (compMatch) {
    return {
      tab: 'home',
      slug: null,
      legal: false,
      settingsSubView: 'main',
      compatibilityPair: {
        myMbti: compMatch[1].toUpperCase(),
        oppMbti: compMatch[2].toUpperCase()
      }
    };
  }
  return { tab: 'home', slug: null, legal: false, settingsSubView: 'main', compatibilityPair: null };
};

// 共有リンクのために保存した鑑定結果（api/_lib/shared-result.js）
interface SharedResultData {
  mode: 'single' | 'match';
  myName: string;
  oppName: string;
  character: 'ren' | 'tsuki';
  tsuki: FortuneResult;
  ren: FortuneResult;
  date: string;
}
type SharedView = { status: 'loading'; id: string } | { status: 'ready'; data: SharedResultData } | null;

function App() {
  // Navigation & Flow with URL Routing Sync
  const initialRoute = getInitialRoute();
  const [activeTab, setActiveTab] = useState(initialRoute.tab);
  const [selectedColumnSlug, setSelectedColumnSlug] = useState<string | null>(initialRoute.slug);

  // 戻る・進む（iPhoneの戻るスワイプを含む）で、履歴に残した画面をそのまま再現する。中身は下の applyNav（毎回最新の state を使うため ref 経由）
  const applyNavRef = useRef<(nav: NavState) => void>(() => {});
  const overlayBackPendingRef = useRef(false);
  useEffect(() => {
    // 最初に開いたページの履歴に、画面の情報を入れておく（重ね表示は閉じた状態で始まる）
    const cur = readNav();
    replaceNav({ ...routeFromPath(window.location.pathname), overlays: [], idx: cur.idx, scroll: undefined });

    const handlePopState = () => {
      overlayBackPendingRef.current = false;
      applyNavRef.current(readNav());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const scrollMainTo = (top: number) => {
    window.scrollTo(0, top);
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
    const mainEl = document.querySelector('.main-content');
    if (mainEl) mainEl.scrollTop = top;
  };

  // コラムの案内で入れてもらった生年月日。入力画面を開いたときに入れておく（ほかの方法で画面を移ったら消す）
  const [inputPrefill, setInputPrefill] = useState<{ myBirth?: string; oppBirth?: string } | null>(null);
  const handleTabChange = (tab: string) => {
    setInputPrefill(null);
    const cur = readNav();
    const next: PageFields = { tab, slug: null, subView: 'main', legal: false, flowStep: tab === 'home' ? 'input' : cur.flowStep };
    if (pageKey(next) !== pageKey(cur)) pushNav(next);

    setActiveTab(tab);
    setIsChatOpen(false);
    setShowPremiumLP(false);
    setShowAuthModal(false);
    setShowLegalPage(false);
    setShowShareCard(false);
    setSelectedColumnSlug(null);
    setSettingsSubView('main');

    if (tab === 'home') {
      setFlowStep('input');
      setLoadedPartner(null);
      // 共有リンクの結果を見ていたときも、「恋愛診断」で自分の鑑定の入力画面へ
      setSharedView(null);
      setSharedTeaser(null);
    }
    scrollMainTo(0);
  };
  const [flowStep, setFlowStep] = useState<'input' | 'loading' | 'result'>('input');
  // 共有リンクから来た人に見せる、共有した人の鑑定結果（URLは読んだあと消す）。
  // 保存した結果のID（?shared=…）があれば普段の結果画面で、なければリンクの値だけで作った要約（SharedResultView）で見せる
  const [sharedTeaser, setSharedTeaser] = useState(() => readSharedResult(window.location.search));
  const [sharedView, setSharedView] = useState<SharedView>(() => {
    const id = new URLSearchParams(window.location.search).get('shared');
    return id && /^[A-Za-z0-9_-]{12}$/.test(id) ? { status: 'loading', id } : null;
  });
  useEffect(() => {
    if (sharedView?.status !== 'loading') return;
    let active = true;
    fetch(`/api/share?id=${sharedView.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SharedResultData | null) => {
        if (!active) return;
        if (d && d.tsuki && d.ren) {
          setSelectedCharacter(d.character === 'ren' ? 'ren' : 'tsuki');
          setSharedView({ status: 'ready', data: d });
        } else {
          setSharedView(null);
          showAlert('共有された鑑定結果が見つかりませんでした。');
        }
      })
      .catch(() => {
        if (!active) return;
        setSharedView(null);
        showAlert('共有された鑑定結果を読み込めませんでした。通信環境を確認して、もう一度開いてください。');
      });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!sharedTeaser && !sharedView) return;
    try {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    } catch (e) {
      console.error(e);
    }
  }, []);
  
  // Characters
  const [selectedCharacter, setSelectedCharacter] = useState<'ren' | 'tsuki'>('tsuki');
  const [isChatOpen, setIsChatOpen] = useState(false); // Standalone chat simulator in Chat tab
  const [chatInitialQuestion, setChatInitialQuestion] = useState<string | undefined>(undefined); // 鑑定結果の質問ボタンから開いたときの最初の質問
  // 対話ロビーから開いたときは、相談の前に誰について相談するか選ぶ。'pick' = まだ選んでいない、null = 今の鑑定結果のまま（鑑定結果から開いたとき）
  const [chatTarget, setChatTarget] = useState<'pick' | 'self' | SavedPartner | null>(null);
  
  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  // アプリ内のお知らせ（運営から全員へ／その会員へ）。未読の数をホームの鈴・下メニュー・マイページに出す
  const notices = useNotices(currentUser?.uid ?? null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLegalPage, setShowLegalPage] = useState(initialRoute.legal);
  const [showEmailPromptModal, setShowEmailPromptModal] = useState(false);
  const [promptEmailInput, setPromptEmailInput] = useState('');
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);

  useEffect(() => {
    // Check cached user in localStorage for instant UI rendering without network delay
    try {
      const stored = localStorage.getItem('hasu_tsuki_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          setCurrentUser(parsed);
          setIsRegistered(true);
        }
      }
    } catch {}

    // Defer network-based Firebase Auth subscription to idle time after critical rendering completes
    let unsubscribe: (() => void) | undefined;
    const timer = setTimeout(() => {
      checkRedirectAuthResult().then((user) => {
        if (user) {
          setCurrentUser(user);
          setIsRegistered(true);
        }
      });

      // Link from "メールアドレスを追加": attach the address to the signed-in account
      if (isAddEmailLink()) {
        completeAddEmailLink().then((res) => {
          if (res.status === 'linked') {
            setCurrentUser(res.user);
            setIsRegistered(true);
            showAlert(`メールアドレス（${res.user.email}）を追加しました。毎朝の運勢メールが使えるようになり、Xにログインできないときもこのメールでログインできます。`);
          } else if (res.status === 'not-signed-in') {
            showAlert('このブラウザではログインしていないため、メールアドレスを追加できませんでした。「メールアドレスを追加」を押したのと同じブラウザ（アプリ）でログインしてから、もう一度お試しください。');
          } else if (res.status === 'no-pending') {
            showAlert('メールアドレスを追加できませんでした。「メールアドレスを追加」を押したのと同じブラウザ（アプリ）で、もう一度メールを送り直してください。');
          } else if (res.status === 'in-use') {
            showAlert('このメールアドレスは、別のアカウントで使われているため追加できませんでした。別のメールアドレスでお試しください。');
          } else if (res.status === 'expired') {
            showAlert('リンクの有効期限が切れているか、すでに使われています。マイページからもう一度メールを送ってください。');
          } else {
            showAlert('メールアドレスを追加できませんでした。時間をおいて、もう一度お試しください。');
          }
        });
      }

      completeEmailMagicLinkSignIn().then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
          setIsRegistered(true);
        } else if (res.needsEmailPrompt) {
          setShowEmailPromptModal(true);
        }
      });

      unsubscribe = subscribeAuthChange((user) => {
        if (user) {
          setCurrentUser(user);
          setIsRegistered(true);
        } else {
          setCurrentUser(null);
          setIsRegistered(false);
        }
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Registration & Subscription Wall
  const [isRegistered, setIsRegistered] = useState(false);
  // Premium comes from Stripe (api/stripe/*). Start from the last known state of the stored account,
  // so a member's screen does not briefly show the free version on each visit.
  const [isSubscribed, setIsSubscribed] = useState(() => {
    try { return readCachedPremium(JSON.parse(localStorage.getItem('hasu_tsuki_user') || 'null')?.uid); } catch { return false; }
  });
  // Set when the member has cancelled: the date Premium ends (Stripe stops renewal at the period end)
  const [premiumEndsOn, setPremiumEndsOn] = useState<string | null>(null);
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  // 買い切りで解放したお祝いのときのお相手の呼び方（null ならプレミアムのお祝い）
  const [welcomePairPartner, setWelcomePairPartner] = useState<string | null>(null);
  const premiumUidRef = useRef<string | null>(null);
  useEffect(() => {
    const uid = currentUser?.uid || null;
    if (!uid) {
      if (premiumUidRef.current) { setIsSubscribed(false); setPremiumEndsOn(null); } // signed out
      premiumUidRef.current = null;
      return;
    }
    premiumUidRef.current = uid;
    // Coming back from Stripe: ?premium=success|cancel|portal. The webhook can take a few seconds, so after a payment keep asking.
    const params = new URLSearchParams(window.location.search);
    const back = params.get('premium');
    if (back) {
      params.delete('premium');
      const qs = params.toString();
      window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
    let cancelled = false;
    (async () => {
      // After the payment page, wait for the webhook to make the account Premium; after the billing page
      // (cancel, undo cancel), the change also arrives by webhook a few seconds later, so read it again a few times.
      const tries = back === 'success' ? 8 : back === 'portal' ? 5 : 1;
      for (let i = 0; i < tries; i++) {
        const status = await fetchPremiumStatus();
        if (cancelled) return;
        if (status) {
          setIsSubscribed(status.active);
          setPremiumEndsOn(status.active && status.cancelAtPeriodEnd ? status.currentPeriodEnd : null);
        }
        if (status?.active && back !== 'portal') {
          if (back === 'success') { setWelcomePairPartner(null); setShowPremiumWelcome(true); void notices.reload(); } // お礼のお知らせを鈴に出す
          return;
        }
        if (i < tries - 1) await new Promise((r) => setTimeout(r, 2500));
      }
      if (back === 'success' && !cancelled) {
        showAlert('お支払いを受け付けました。プレミアムの反映に少し時間がかかっています。\n1〜2分たってから、ページを再読み込みしてください。');
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.uid]);

  // 画面に出している鑑定の入力（startDiagnosis が入れる）。決済へ移る直前に、このタブの sessionStorage にも控える。
  // Stripe から戻ったとき、端末の記録（hasu_last_diagnosis_input）がログイン状態の変化で消えていても、同じ鑑定を出し直せるように
  const lastReadingRef = useRef<Record<string, unknown> | null>(null);
  const rememberReadingForCheckout = () => {
    // 購入LPから決済へ移るときは、戻ったときに同じLPを開き直せるよう、先に見せていたプランも控える
    try {
      if (showPremiumLPRef.current) sessionStorage.setItem(CHECKOUT_LP_KEY, premiumLPFocusRef.current);
      else sessionStorage.removeItem(CHECKOUT_LP_KEY);
    } catch { /* blocked storage */ }
    if (!lastReadingRef.current) return;
    try { sessionStorage.setItem(CHECKOUT_READING_KEY, JSON.stringify(lastReadingRef.current)); } catch { /* blocked storage */ }
  };

  // 登録なしでも申し込める（Stripeで入力したメールでアカウントを自動で作る）
  const handleStartCheckout = async () => {
    trackCheckout('monthly');
    rememberReadingForCheckout();
    try {
      await startPremiumCheckout();
    } catch (e) {
      showAlert(e instanceof Error ? e.message : '決済画面を開けませんでした。');
    }
  };

  const handleOpenBillingPortal = async (reasons: string[] = [], note = '') => {
    try {
      await openBillingPortal(reasons, note);
    } catch (e) {
      showAlert(e instanceof Error ? e.message : '解約・お支払いの画面を開けませんでした。');
    }
  };
  const [showPremiumLP, setShowPremiumLP] = useState(false);
  // LPで先に見せるプラン。買い切りで解放できる項目のロックからは 'pair'、毎日の内容のロックからは 'monthly'
  const [premiumLPFocus, setPremiumLPFocus] = useState<'pair' | 'monthly'>('monthly');
  const showPremiumLPRef = useRef(false);
  showPremiumLPRef.current = showPremiumLP;
  const premiumLPFocusRef = useRef(premiumLPFocus);
  premiumLPFocusRef.current = premiumLPFocus;
  // Stripe から戻って購入LPを開き直すとき（開いた回数には数えない）
  const lpReopenRef = useRef(false);
  const openPremiumLP = (focus: 'pair' | 'monthly' = 'monthly') => {
    setPremiumLPFocus(focus);
    setShowPremiumLP(true);
  };
  // 毎朝メールのリンク（?lp=m 月額 / ?lp=p 買い切り）: 鑑定結果を出したあとに、そのプランを先に見せる案内を開く
  const pendingLPRef = useRef<'pair' | 'monthly' | null>(null);
  // 次に開く案内がメールのリンクからか（管理画面で「メールから」を分けて数える）
  const lpFromMailRef = useRef(false);
  const [chatCount, setChatCount] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'profile' | 'partners' | 'about' | 'tokushoho' | 'privacy' | 'company' | 'contact' | 'news'>(initialRoute.settingsSubView);
  // マイページの各ページ（お問い合わせ等）は、開いたら一番上から見せる（スクロールするのは .main-content）
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('.main-content');
    if (mainEl) mainEl.scrollTop = 0;
  }, [settingsSubView]);

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
  const [myMbti, setMyMbti] = useState(initialRoute.compatibilityPair ? initialRoute.compatibilityPair.myMbti : (userProfile?.mbti || 'UNKNOWN'));
  const [myGender, setMyGender] = useState<'female' | 'male'>(userProfile?.gender || 'female');
  const [showProfileDatePicker, setShowProfileDatePicker] = useState(false);
  const [mode, setMode] = useState<'single' | 'match'>('match');

  // Opponent Info (Step 2)
  const [oppName, setOppName] = useState('お相手');
  const [oppBirth, setOppBirth] = useState('');
  const [oppMbti, setOppMbti] = useState(initialRoute.compatibilityPair ? initialRoute.compatibilityPair.oppMbti : 'UNKNOWN');
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
    try {
      localStorage.setItem('hasu_saved_partners', JSON.stringify(savedPartners));
    } catch (e) {}
  }, [savedPartners]);

  // Members: the profile and saved partners follow the account (api/_lib/user-data.js), not only this device.
  // On iPhone the home-screen app and Safari keep separate storage, so device-only data looked like another account.
  const [inputViewKey, setInputViewKey] = useState(0); // remounts the input form when the account's profile arrives
  const savedPartnersRef = useRef(savedPartners);
  savedPartnersRef.current = savedPartners;
  const syncUidRef = useRef<string | null>(null); // the account the screen is synced with (null = not yet / signed out)
  const syncedProfileRef = useRef('');
  const syncedPartnersRef = useRef('');
  const lastPullRef = useRef(0);
  const partnerPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readLocalProfile = (): SyncProfile | null => {
    try {
      const stored = localStorage.getItem('hasu_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const applySyncedProfile = (profile: SyncProfile | null) => {
    try {
      if (profile) localStorage.setItem('hasu_user_profile', JSON.stringify(profile));
      else localStorage.removeItem('hasu_user_profile');
    } catch {}
    setMyName(profile?.name || 'あなた');
    setMyBirth(profile?.birth || '');
    setMyMbti(profile?.mbti || 'UNKNOWN');
    setMyGender(profile?.gender || 'female');
    setInputViewKey((k) => k + 1);
  };

  const pullUserData = async (uid: string) => {
    lastPullRef.current = Date.now();
    const remote = await fetchUserData(uid);
    if (!remote || currentUidRef.current !== uid) return;
    const localProfile = readLocalProfile();
    const decision = decideSync({ profile: localProfile, partners: savedPartnersRef.current }, remote, readSyncOwner(), uid);
    // Data from before syncing is only treated as merged once the account has it
    if (decision.push && !(await saveUserData(uid, decision.push))) return;
    if (currentUidRef.current !== uid) return;
    writeSyncOwner(uid);
    if (!sameProfile(localProfile, decision.profile)) applySyncedProfile(decision.profile);
    if (!samePartners(savedPartnersRef.current, decision.partners)) setSavedPartners(decision.partners as SavedPartner[]);
    syncedProfileRef.current = JSON.stringify(decision.profile);
    syncedPartnersRef.current = JSON.stringify(decision.partners);
    syncUidRef.current = uid;
  };

  // Sends the profile saved on this device (after the profile edit or a reading) to the account
  const pushProfile = () => {
    const uid = syncUidRef.current;
    const profile = readLocalProfile();
    if (!uid || !profile || JSON.stringify(profile) === syncedProfileRef.current) return;
    syncedProfileRef.current = JSON.stringify(profile);
    saveUserData(uid, { profile }).then((ok) => { if (!ok) syncedProfileRef.current = ''; });
  };

  const currentUidRef = useRef<string | null>(null);
  useEffect(() => {
    const uid = currentUser?.uid || null;
    const wasSignedIn = !!currentUidRef.current;
    currentUidRef.current = uid;
    syncUidRef.current = null;
    if (!uid) {
      // Signed out: the member's profile and partners stay in the account, so the screen starts empty
      // (logOutUser has already removed them from this device's storage)
      if (wasSignedIn) {
        if (partnerPushTimerRef.current) clearTimeout(partnerPushTimerRef.current);
        partnerPushTimerRef.current = null;
        syncedProfileRef.current = '';
        syncedPartnersRef.current = '';
        clearAccountDataOnDevice();
        applySyncedProfile(null);
        setSavedPartners([]);
        setLoadedPartner(null);
        setNotifyDailyLuck(false);
        setNotifyEmail('');
      }
      return;
    }
    void pullUserData(uid);
    // Coming back to the app (e.g. after editing on the other device): read the account again, at most once a minute
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || partnerPushTimerRef.current) return;
      if (Date.now() - lastPullRef.current < 60_000) return;
      void pullUserData(uid);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [currentUser?.uid]);

  // Saved partners changed on this device (added, edited, deleted): send them to the account
  useEffect(() => {
    const uid = syncUidRef.current;
    const json = JSON.stringify(savedPartners);
    if (!uid || json === syncedPartnersRef.current) return;
    if (partnerPushTimerRef.current) clearTimeout(partnerPushTimerRef.current);
    partnerPushTimerRef.current = setTimeout(() => {
      partnerPushTimerRef.current = null;
      const partners = savedPartnersRef.current;
      const sent = JSON.stringify(partners);
      syncedPartnersRef.current = sent;
      saveUserData(uid, { partners }).then((ok) => { if (!ok && syncedPartnersRef.current === sent) syncedPartnersRef.current = ''; });
    }, 800);
  }, [savedPartners]);

  // Handle browser back / forward navigation (popstate) & Parse share link query parameters
  useEffect(() => {
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

    // 購入LPから決済へ移っていたら、Stripe の「戻る」（?pair=cancel / ?premium=cancel）か、
    // ブラウザの「戻る」で読み込み直したとき（履歴に購入LPが開いた状態が残っている）に、同じLPを開き直す
    let checkoutLp: string | null = null;
    try {
      checkoutLp = sessionStorage.getItem(CHECKOUT_LP_KEY);
      sessionStorage.removeItem(CHECKOUT_LP_KEY);
    } catch { /* blocked storage */ }
    const cancelledCheckout = /[?&](pair|premium)=cancel(&|$)/.test(INITIAL_SEARCH);
    const backFromCheckout = !/[?&](pair|premium)=/.test(INITIAL_SEARCH)
      && isNavStateWithOverlay(INITIAL_HISTORY_STATE, 'premiumLP');
    if ((checkoutLp === 'pair' || checkoutLp === 'monthly') && (cancelledCheckout || backFromCheckout)) {
      pendingLPRef.current = checkoutLp;
      lpReopenRef.current = true;
    }
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
    // Character tab to open on (the daily mail's link sets it, so the app opens on the mail's character)
    const rawChar = params.get('c');
    const urlCharacter = rawChar === 'r' ? 'ren' : (rawChar === 't' ? 'tsuki' : undefined);

    // Dynamic SEO Metadata Injection for 256 MBTI combinations & search terms
    const effectiveMMbti = mMbti || initialRoute.compatibilityPair?.myMbti;
    const effectiveOMbti = oMbti || initialRoute.compatibilityPair?.oppMbti;
    if (effectiveMMbti && effectiveOMbti && effectiveMMbti !== 'UNKNOWN' && effectiveOMbti !== 'UNKNOWN') {
      const dynamicTitle = `【16タイプ相性診断】${effectiveMMbti} × ${effectiveOMbti} の恋愛相性・トリセツ | 月と蓮`;
      const dynamicDesc = `${effectiveMMbti}と${effectiveOMbti}の恋愛相性スコア、会話のコツ、刺さるLINEメッセージ例、返信率MAXの吉時間を四柱推命×16タイプ診断で完全鑑定。`;
      document.title = dynamicTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', dynamicDesc);
    } else if (params.get('type') === 'kaigou') {
      document.title = `【四柱推命 魁罡（かいごう）】約3.3%の強運特殊干支・恋愛運勢鑑定 | 月と蓮`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', '四柱推命において極めて珍しい強運・カリスマの特殊星「魁罡（かいごう）」の性格特徴、相性の良い相手、恋愛開運バイオリズムを本格解密。');
    }

    if (mName && mBirth && mMbti && mGender) {
      const lp = params.get('lp');
      if (lp === 'm' || lp === 'p') {
        pendingLPRef.current = lp === 'p' ? 'pair' : 'monthly';
        // 読み込み直しや「戻る」で何度も開かないよう、URLから外す
        params.delete('lp');
        const qs = params.toString();
        window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : ''));
      }
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
        startDiagnosis(mName, mBirth, mMbti, mGender, oName, oBirth, oMbti, oGender, rel, 'match', false, urlCharacter);
      } else {
        setMode('single');
        setRelationship(rel);
        startDiagnosis(mName, mBirth, mMbti, mGender, '', '', 'UNKNOWN', 'female', rel, 'single', false, urlCharacter);
      }
    } else if (!mBirth && (initialRoute.tab === 'home' || initialRoute.tab === 'fortune') && !initialRoute.legal && !initialRoute.compatibilityPair) {
      // 共有リンク（?shared= / ?from=share）を開いたときは、自分の結果を裏で用意するだけで画面は移さない
      // （移すと共有された結果が見えなくなる）。自分の結果は「鑑定結果」タブで見れる
      const restoreInBackground = !!(sharedTeaser || sharedView);
      // 前回の結果を戻すのは、トップ（/）と鑑定結果（/result）を開いたときだけ。コラム・日柱ページ・/about などを開いたときは、そのページを見せる。
      // 生年月日だけのリンク（日柱ページからの ?mb=）でも戻さず、入力画面のままにする（生年月日は UnifiedInputView が入れる）
      // Restore last diagnosis result when returning from 2-step email verification link
      try {
        // Stripe から戻ったとき（?pair= / ?premium=。URLからはすぐ消すので、読み込んだ時点のURLで見る）は、決済の直前に控えた鑑定も使う
        const fromCheckout = /[?&](pair|premium)=/.test(INITIAL_SEARCH) || lpReopenRef.current;
        let checkoutRaw: string | null = null;
        try {
          checkoutRaw = fromCheckout ? sessionStorage.getItem(CHECKOUT_READING_KEY) : null;
          sessionStorage.removeItem(CHECKOUT_READING_KEY);
        } catch { /* blocked storage */ }
        const lastInputRaw = localStorage.getItem('hasu_last_diagnosis_input') || checkoutRaw;
        if (lastInputRaw) {
          const lastInput = JSON.parse(lastInputRaw);
          if (lastInput && lastInput.mName && lastInput.mBirth) {
            setMyName(lastInput.mName);
            setMyBirth(lastInput.mBirth);
            if (lastInput.mMbti) setMyMbti(lastInput.mMbti);
            if (lastInput.mGender) setMyGender(lastInput.mGender);
            if (lastInput.runMode === 'match') {
              if (lastInput.oName) setOppName(lastInput.oName);
              if (lastInput.oBirth) setOppBirth(lastInput.oBirth);
              if (lastInput.oMbti) setOppMbti(lastInput.oMbti);
              if (lastInput.oGender) setOppGender(lastInput.oGender);
              if (lastInput.rel) setRelationship(lastInput.rel);
              setMode('match');
              startDiagnosis(
                lastInput.mName,
                lastInput.mBirth,
                lastInput.mMbti || 'UNKNOWN',
                lastInput.mGender || 'female',
                lastInput.oName || 'お相手',
                lastInput.oBirth || '',
                lastInput.oMbti || 'UNKNOWN',
                lastInput.oGender || 'male',
                lastInput.rel || '片思い中',
                'match',
                true,
                lastInput.selectedCharacter,
                restoreInBackground
              );
            } else {
              setMode('single');
              if (lastInput.rel) setRelationship(lastInput.rel);
              startDiagnosis(
                lastInput.mName,
                lastInput.mBirth,
                lastInput.mMbti || 'UNKNOWN',
                lastInput.mGender || 'female',
                '',
                '',
                'UNKNOWN',
                'female',
                lastInput.rel || '片思い中',
                'single',
                true,
                lastInput.selectedCharacter,
                restoreInBackground
              );
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore last diagnosis input:', e);
      }
    }
  }, []);

  const handleResetFlow = () => {
    try {
      localStorage.removeItem('hasu_last_diagnosis_input');
    } catch (e) {}
    const cur = readNav();
    if (cur.tab !== 'home' || cur.flowStep !== 'input') {
      pushNav({ tab: 'home', slug: null, subView: 'main', legal: false, flowStep: 'input' });
    }
    setFlowStep('input');
    setActiveTab('home');
    setLoadedPartner(null);
    // 入力ページを一番上から見せる（結果ページのスクロール位置が残らないよう、描画のあとにも戻す）
    scrollMainTo(0);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollMainTo(0)));
  };

  const generateShareUrl = () => {
    const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const baseUrl = isLocal ? window.location.origin + '/share/card' : 'https://www.tsuki-to-ren.com/share/card';
    const params = new URLSearchParams();
    
    if (!isLocal && window.location.hostname.includes('vercel.app')) {
      params.set('x-vercel-protection-bypass', 'fosYc2r3CdMOALx4Jk0mD0fAz0tzUMs2');
    }

    // 共有リンクは誰でも見れるので、名前（ニックネーム）と点数だけを入れ、生年月日などは入れない（開いた人には api/share.js が要約を見せる）
    // 保存した鑑定結果のID。開いた人は普段の結果画面で見れる
    if (savedShare && savedShare.result === tsukiResult) params.set('r', savedShare.id);
    if (myName && myName !== 'あなた') params.set('mn', myName.slice(0, 8));
    if (mode === 'match') {
      if (oppName && oppName !== 'お相手') params.set('on', oppName.slice(0, 8));
    } else {
      params.set('mode', 's');
    }

    if (activeResult) {
      params.set('bs', String(activeResult.baseScore));
      if (!dailyScoreHidden) params.set('ds', String(activeResult.dailyScore)); // 無料の日数を使い切った日は「??点」
      // ひとことや相性の名前は入れない。日本語はURLで1字9文字になり、Xに貼ると長すぎる（カード画像は名前と点数で作る）
      // カード画像の背景に出す守護獣（/assets/astrology_ox_sample_male.jpg → ox_sample_male）
      const avatarKey = (url?: string) => /\/astrology_([a-z_]+)\.jpg$/.exec(url || '')?.[1];
      const ma = avatarKey(activeResult.myAvatarUrl);
      if (ma) params.set('ma', ma);
      const oa = mode === 'match' ? avatarKey(activeResult.opponentAvatarUrl) : undefined;
      if (oa) params.set('oa', oa);
      // カードに出す16タイプ（4文字だけ。未選択は入れない）
      if (SHARE_MBTI_NAMES[myMbti]) params.set('mm', myMbti);
      if (mode === 'match' && SHARE_MBTI_NAMES[oppMbti]) params.set('om', oppMbti);
      // カードの説明の文は番号で渡す（api/_lib/share-card-text.js）
      const c = mode === 'match' ? shareTitleCode(activeResult.compatibilityTitle) : -1;
      if (c >= 0) params.set('c', String(c));
      const l = shareLineCode(activeResult.oneLiner);
      if (l >= 0) params.set('l', String(l));
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
  // 入力エラーのとき、OKのあと該当の入力欄へ誘導するための参照
  const profileBirthRef = useRef<HTMLInputElement>(null);
  const editPartnerBirthRef = useRef<HTMLInputElement>(null);
  const notifyEmailRef = useRef<HTMLInputElement>(null);
  const promptEmailRef = useRef<HTMLInputElement>(null);

  // Whose fortune the daily mail is about: 'self', a saved partner's id, or 'keep' (the partner already in the
  // subscription but not saved on this device). The subscription in Firestore is the truth the 8:00 mail uses.
  const [notifyTarget, setNotifyTarget] = useState<string>('self');
  const [notifySub, setNotifySub] = useState<EmailSubscriptionData | null>(null);
  const [notifyAfterPartnerAdd, setNotifyAfterPartnerAdd] = useState(false);
  // The subscription this device just turned on for a new member, so a slower read can't show it as OFF
  const defaultMailRef = useRef<{ uid: string; data: EmailSubscriptionData } | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setNotifySub(null);
      return;
    }
    let cancelled = false;
    getEmailSubscription().then((found) => {
      if (cancelled) return;
      const sub = found || (defaultMailRef.current?.uid === currentUser.uid ? defaultMailRef.current.data : null);
      setNotifySub(sub);
      // The subscription in Firestore decides delivery, so the ON/OFF shown here follows it (e.g. set on another device)
      if (sub) setNotifyDailyLuck(!!sub.enabled);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // A "match" subscription without a partner birth date is sent as the solo fortune (api/_lib/daily-mail.js)
  const subHasPartner = !!(notifySub && notifySub.mode !== 'single' && notifySub.oppBirth);
  const isSubPartner = (p: SavedPartner) => subHasPartner && p.name === notifySub?.oppName && p.birth.replace(/\//g, '-') === notifySub?.oppBirth;
  const showKeepTarget = subHasPartner && !savedPartners.some(isSubPartner);
  const notifyTargetLabel = !notifySub ? '' : (subHasPartner ? `${san(notifySub.oppName)}との相性` : 'あなたの運勢');
  const openNotifyModal = (target?: string) => {
    setNotifyEmailInput(notifyEmail || currentUser?.email || '');
    if (target) {
      setNotifyTarget(target);
    } else if (subHasPartner) {
      setNotifyTarget(savedPartners.find(isSubPartner)?.id || 'keep');
    } else {
      setNotifyTarget('self');
    }
    setShowNotifyEmailModal(true);
  };

  // Saves the subscription with "me" from the profile and the chosen partner (null = solo fortune)
  const buildNotifyData = (email: string, partner: SavedPartner | 'keep' | null): EmailSubscriptionData => {
    const opp = partner === 'keep' && notifySub
      ? { oppName: notifySub.oppName || '', oppBirth: notifySub.oppBirth || '', oppGender: notifySub.oppGender, oppMbti: notifySub.oppMbti || 'UNKNOWN', relationship: notifySub.relationship || '片思い中', mode: 'match' as const }
      : partner && partner !== 'keep'
        ? { oppName: partner.name, oppBirth: partner.birth.replace(/\//g, '-'), oppGender: partner.gender, oppMbti: partner.mbti, relationship: partner.relationship, mode: 'match' as const }
        : { oppName: '', oppBirth: '', oppGender: 'male' as const, oppMbti: 'UNKNOWN', relationship: relationship, mode: 'single' as const };
    return {
      email,
      enabled: true,
      myName: myName || 'あなた',
      myBirth: myBirth || '',
      myGender: myGender,
      myMbti: myMbti,
      ...opp,
      character: selectedCharacter
    };
  };

  const saveNotifySubscription = async (email: string, partner: SavedPartner | 'keep' | null): Promise<boolean> => {
    const data = buildNotifyData(email, partner);
    const saved = await saveEmailSubscriptionData(data);
    if (saved) setNotifySub(data);
    return saved;
  };

  // New members get the 8:00 mail ON by default (firebase.ts enableDailyMailForNewMember). It waits until the account
  // has a verified email and the profile has a birth date. Whose fortune: the partner on screen, else the last saved
  // partner, else the member's own fortune. Existing members and anyone who turned it OFF are left as they are.
  const defaultMailBusyRef = useRef(false);
  useEffect(() => {
    if (!currentUser || defaultMailBusyRef.current) return;
    if (!isValidBirthDate(myBirth)) return;
    defaultMailBusyRef.current = true;
    const uid = currentUser.uid;
    const onScreen = mode === 'match' && isValidBirthDate(oppBirth)
      ? (savedPartners.find(p => p.name === oppName && p.birth === oppBirth)
        || { id: 'current', name: oppName || 'お相手', birth: oppBirth, mbti: oppMbti, gender: oppGender, relationship })
      : null;
    const partner = onScreen || (savedPartners.length > 0 ? savedPartners[savedPartners.length - 1] : null);
    enableDailyMailForNewMember((email) => buildNotifyData(email, partner))
      .then((r) => {
        if (r.status !== 'enabled') return;
        defaultMailRef.current = { uid, data: r.data };
        setNotifySub(r.data);
        setNotifyEmail(r.data.email);
        setNotifyDailyLuck(true);
      })
      .finally(() => { defaultMailBusyRef.current = false; });
  }, [currentUser, myBirth]);

  // Accounts without a verified email (X sign-in) can't get the daily mail; offer to add an address to the same account
  const askToAddEmail = async () => {
    // A purchase-only account signs in with the purchase email instead of adding one (AuthModal shows that form)
    const ok = await isGuestAccount()
      ? await showConfirm('毎朝の運勢メールには、メールアドレスでのログインが必要です。購入したときのメールアドレスでログインしますか？（購入した鑑定はそのまま引き継がれます）', { okLabel: 'ログインへ', cancelLabel: 'やめる' })
      : await showConfirm('毎朝の運勢メールには、確認済みのメールアドレスが必要です。今のアカウントのまま、メールアドレスを追加しますか？', { okLabel: '追加する', cancelLabel: 'やめる' });
    if (!ok) return;
    setShowNotifyEmailModal(false);
    setShowAuthModal(true);
  };

  useEffect(() => {
    try {
      localStorage.setItem('hasu_notify_daily_luck', JSON.stringify(notifyDailyLuck));
    } catch (e) {}
  }, [notifyDailyLuck]);

  useEffect(() => {
    if (notifyEmail) {
      try {
        localStorage.setItem('hasu_notify_email', notifyEmail);
      } catch (e) {}
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

  // Adding a partner by hand reuses the edit form with a draft row (id NEW_PARTNER_ID)
  const startNewPartner = () => {
    if (!canAddPartner()) return false;
    setEditingPartnerId(NEW_PARTNER_ID);
    setEditPartnerName('');
    setEditPartnerBirth('');
    setEditPartnerMbti('UNKNOWN');
    setEditPartnerGender(myGender === 'female' ? 'male' : 'female');
    setEditPartnerRel('片思い中');
    return true;
  };

  const startEditPartner = (partner: SavedPartner) => {
    setEditingPartnerId(partner.id);
    setEditPartnerName(partner.name);
    setEditPartnerBirth(partner.birth);
    setEditPartnerMbti(partner.mbti);
    setEditPartnerGender(partner.gender);
    setEditPartnerRel(partner.relationship);
  };

  // 解放済みのお相手の生年月日を変える確認で「変更する」を押したあと、もう一度保存を通すため
  const confirmedUnlockEditRef = useRef(false);
  const saveEditPartner = () => {
    if (!editingPartnerId) return;
    if (!editPartnerBirth || editPartnerBirth.length < 10) {
      showFieldError('生年月日は「19950401」のように数字8桁で入力してください。', editPartnerBirthRef.current);
      return;
    }
    const fields = {
      name: editPartnerName.trim().slice(0, 8) || 'お相手',
      birth: editPartnerBirth,
      mbti: editPartnerMbti,
      gender: editPartnerGender,
      relationship: editPartnerRel
    };
    if (editingPartnerId === NEW_PARTNER_ID) {
      const newPartner: SavedPartner = { id: `${fields.name}_${fields.birth}_${Date.now()}`, ...fields };
      setSavedPartners([...savedPartners, newPartner]);
      setEditingPartnerId(null);
      if (notifyAfterPartnerAdd) {
        // Came from the daily mail settings: go back there with the new partner chosen
        setNotifyAfterPartnerAdd(false);
        openNotifyModal(newPartner.id);
      } else {
        showAlert(`${san(newPartner.name)}の情報を保存しました。`);
      }
      return;
    }
    const before = savedPartners.find(p => p.id === editingPartnerId);
    // 買い切りで解放したお相手は生年月日で決まる。生年月日を変えると、この行は解放の対象ではなくなる
    const leavesUnlock = Boolean(before?.unlocked && before.birth !== fields.birth);
    if (leavesUnlock && !confirmedUnlockEditRef.current) {
      const limit = isSubscribed ? 5 : (isRegistered ? 2 : 1);
      // 解放済みは保存の上限に数えていないので、外れると上限を超えることがある
      if (savedPartners.filter((x) => !x.unlocked).length + 1 > limit) {
        showAlert(`⚠️ ${san(before?.name || 'お相手')}は、シングルプランで鑑定を解放したお相手です。\n生年月日を変えると解放の対象から外れ、保存の上限（${limit}人）を超えてしまうため、変更できません。\n\n別の方を占うときは、新しいお相手として追加してください。`);
        return;
      }
      showConfirm(`⚠️ ${san(before?.name || 'お相手')}は、シングルプランで鑑定を解放したお相手です。\n\n解放は生年月日で決まるため、生年月日を変えると、変更後のお相手は解放されていない状態になります（もう一度購入が必要です）。\n元の生年月日（${before?.birth.replace(/-/g, '/')}）の購入はなくならず、元に戻せばまた見れます。\n\n名前・16タイプ・性別だけの変更なら、解放はそのままです。\n\n本当に生年月日を変えますか？`, { okLabel: 'それでも変更する', danger: true }).then(ok => {
        if (!ok) return;
        confirmedUnlockEditRef.current = true;
        try { saveEditPartner(); } finally { confirmedUnlockEditRef.current = false; }
      });
      return;
    }
    const updated = savedPartners.map(p => (p.id === editingPartnerId ? { ...p, ...fields, ...(leavesUnlock ? { unlocked: false } : {}) } : p));
    setSavedPartners(updated);
    setEditingPartnerId(null);
    // いま結果画面に出しているお相手を直したときは、結果もその場で新しい名前・生年月日で出し直す
    // （出し直さないと、「恋の暦」の切り替えに古い名前のお相手と直したお相手の2人が並ぶ。2026-11-12 TAKASHI報告）
    if (before && readingInput && readingInput.opponentName === before.name && readingInput.opponentBirth === before.birth) {
      handleTodaySwitch({ ...before, ...fields });
    }
    // If this partner is the one the daily mail is about, the mail follows the edit
    if (before && isSubPartner(before) && notifySub?.enabled && notifySub.email) {
      saveNotifySubscription(notifySub.email, { ...before, ...fields });
    }
    showAlert('お相手の情報を更新しました。');
  };

  // Checks the saved-partner limit for the member level; shows the upgrade prompt and returns false when full
  const canAddPartner = () => {
    const limit = isSubscribed ? 5 : (isRegistered ? 2 : 1);
    // 買い切りで解放したお相手は上限に数えない
    if (savedPartners.filter((x) => !x.unlocked).length >= limit) {
      if (!isRegistered) {
        showConfirm(`非会員の保存上限（1人）に達しています。\n無料会員登録を行うと最大2人まで保存できます。無料登録しますか？`, { okLabel: '無料登録する', cancelLabel: 'あとで' }).then(ok => {
          if (!ok) return;
          setShowAuthModal(true);
        });
      } else if (!isSubscribed) {
        showConfirm(`無料会員の保存上限（2人）に達しています。\n月額980円の有料会員（プレミアム）になると最大5人まで保存できます。登録しますか？`, { okLabel: '登録へ進む', cancelLabel: 'あとで' }).then(ok => {
          if (!ok) return;
          openPremiumLP('monthly');
        });
      } else {
        showAlert('有料会員の保存上限（5人）に達しています。新しいお相手を保存する場合は、不要なデータを削除してください。');
      }
      return false;
    }
    return true;
  };

  const partnerLimit = isSubscribed ? 5 : (isRegistered ? 2 : 1);
  // 保存済みかどうか。名前が空のお相手は「お相手」で保存されるのでそれとも比べる。
  // 買い切りで解放したお相手は生年月日で決まるので、生年月日が同じなら保存済み扱い
  const isSamePartner = (p: SavedPartner, name: string, birth: string) =>
    p.birth === birth && (p.name === name || p.name === (name || 'お相手') || Boolean(p.unlocked));
  const currentPartnerSaved = savedPartners.some(p => isSamePartner(p, oppName, oppBirth));

  // 上限に達しているときの「入れ替えて保存しますか？」。manual: 保存ボタンから開いたとき
  const [replaceCandidate, setReplaceCandidate] = useState<{ partner: SavedPartner; manual: boolean } | null>(null);
  // 「今回は保存しない」を選んだお相手には、自動では聞き直さない（保存ボタンからはいつでも保存できる）
  const declinedAutoSaveRef = useRef<Set<string>>(new Set());

  // 鑑定したお相手を自動で保存する。上限に達していたら入れ替えるかを聞く（聞くのは結果画面が出てから）
  const autoSavePartner = (fields: Omit<SavedPartner, 'id'>) => {
    const list = savedPartnersRef.current;
    if (list.some(p => isSamePartner(p, fields.name, fields.birth))) return;
    const newPartner: SavedPartner = { id: `${fields.name}_${fields.birth}_${Date.now()}`, ...fields };
    if (list.filter((x) => !x.unlocked).length < partnerLimit) {
      setSavedPartners([...list, newPartner]);
      return;
    }
    if (declinedAutoSaveRef.current.has(`${fields.name}_${fields.birth}`)) return;
    setReplaceCandidate({ partner: newPartner, manual: false });
  };

  // 会員登録などで保存の枠が増えたら、入れ替えを待っていたお相手をそのまま保存する
  useEffect(() => {
    if (!replaceCandidate) return;
    const { partner } = replaceCandidate;
    if (savedPartners.some(p => isSamePartner(p, partner.name, partner.birth))) { setReplaceCandidate(null); return; }
    if (savedPartners.filter((x) => !x.unlocked).length < partnerLimit) {
      setSavedPartners([...savedPartners, partner]);
      setReplaceCandidate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceCandidate, savedPartners, partnerLimit]);

  const replaceSavedPartner = (removeId: string) => {
    if (!replaceCandidate) return;
    const { partner } = replaceCandidate;
    setSavedPartners([...savedPartners.filter(p => p.id !== removeId), partner]);
    if (loadedPartner && loadedPartner.id === removeId) setLoadedPartner(null);
    setReplaceCandidate(null);
    if (replaceCandidate.manual && isChatOpen && chatTarget === 'pick') setChatTarget(partner);
  };

  const skipReplacePartner = () => {
    if (replaceCandidate) declinedAutoSaveRef.current.add(`${replaceCandidate.partner.name}_${replaceCandidate.partner.birth}`);
    setReplaceCandidate(null);
  };

  // Returns the saved partner, or undefined when nothing was saved (or the replace prompt was opened)
  const handleSavePartner = (): SavedPartner | undefined => {
    if (!oppBirth) {
      showAlert('保存するお相手の情報がありません。');
      return;
    }
    if (currentPartnerSaved) {
      showAlert('このお相手は既に保存されています。');
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
    // 上限なら、どのお相手と入れ替えるかを選んでもらう
    if (savedPartners.filter((x) => !x.unlocked).length >= partnerLimit) {
      setReplaceCandidate({ partner: newPartner, manual: true });
      return;
    }

    setSavedPartners([...savedPartners, newPartner]);
    showAlert(`${san(newPartner.name)}の情報を保存しました。`);
    return newPartner;
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

  // 月額会員の「今日」画面で、お相手（または自分だけ）を切り替える。読み込み画面は出さずに、その場で鑑定し直す
  const handleTodaySwitch = (partner: SavedPartner | null) => {
    const cur = readingInput;
    if (!cur) return;
    if (!partner) {
      setMode('single');
      startDiagnosis(cur.myName, cur.myBirth, cur.myMbti, cur.myGender, '', '', 'UNKNOWN', 'female', cur.relationship || '片思い中', 'single', true);
      return;
    }
    handleSelectPartner(partner);
    const g = partner.gender === cur.myGender ? (cur.myGender === 'female' ? 'male' : 'female') : partner.gender;
    startDiagnosis(cur.myName, cur.myBirth, cur.myMbti, cur.myGender, partner.name, partner.birth, partner.mbti, g, partner.relationship, 'match', true);
  };

  // 「今日」画面の二人の道のり・今の状況を、保存したお相手に書く（アカウントへは保存したお相手と一緒に送られる）
  const handleUpdateJourney = (partnerId: string, journey: Journey) => {
    setSavedPartners((prev) => prev.map((p) => (p.id === partnerId ? { ...p, journey } : p)));
  };

  // Diagnostic Results Cache
  const [renResult, setRenResult] = useState<FortuneResult | null>(null);
  const [tsukiResult, setTsukiResult] = useState<FortuneResult | null>(null);
  // お相手ありの鑑定のときの、自分だけの鑑定結果（共有カードの「自分の運勢」タブ用。一人で占ったときと同じ計算）
  const [soloRenResult, setSoloRenResult] = useState<FortuneResult | null>(null);
  const [soloTsukiResult, setSoloTsukiResult] = useState<FortuneResult | null>(null);
  // いま表示している鑑定の入力（月額会員の「今日」画面で、昨日の点数・お相手ごとの点数を出すのに使う）
  const [readingInput, setReadingInput] = useState<DiagnosisInput | null>(null);

  // 同じお相手との「今日の相性」は無料で7日分まで（ログインなしは1日分）。結果を出すたびにサーバーで「見た日」を数える。
  // null = 制限なし（プレミアム・自分だけの鑑定）。確認中は点数を伏せ、確認できなかったときは見せる。
  const [partnerLock, setPartnerLock] = useState<PartnerLock>(null);
  // 買い切り（お相手1人 ¥680）の状態。同じ /api/stripe/partner の答えに入っている
  const [pairUnlock, setPairUnlock] = useState<PairUnlock>(null);

  // 友達紹介（2026-11-08 TAKASHI、src/services/referral.ts）。招待URL（?ref=）で来た人は、鑑定し終えたらサーバーへ送る。
  // 送った会員は、友達が1人占うと、招待URLを作ったお相手との結果の一部が開く（お相手ごと）。
  // 招待で占った友達には、恋愛運MAX日の直近の1日を見せる（この端末に覚える。2026-11-08 TAKASHI）
  const [pendingRef, setPendingRef] = useState<string | null>(() => captureRefFromUrl() || getPendingRef());
  const [refSent, setRefSent] = useState(() => hasSentRef());
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const referralBirth = mode === 'match' && /^\d{4}-\d{2}-\d{2}$/.test(oppBirth) ? oppBirth : '';
  const referralBirthRef = useRef(referralBirth);
  referralBirthRef.current = referralBirth;
  const loadReferral = useCallback(async () => {
    if (!referralBirth) return;
    setReferralLoading(true);
    const r = await fetchMyReferral(referralBirth, /^\d{4}-\d{2}-\d{2}$/.test(myBirth) ? myBirth : undefined);
    setReferralLoading(false);
    // 読み込み中にお相手が変わっていたら捨てる
    if (r && referralBirthRef.current === referralBirth) setReferralStatus(r);
  }, [referralBirth, myBirth]);
  // 未登録でも読む（2026-11-09 TAKASHI「会員登録しなくても招待URL送れるように」）。登録・ログインしたら読み直す（端末の分が会員へ移る）
  useEffect(() => {
    setReferralStatus(null);
    if (!referralBirth) return;
    void loadReferral();
    // お友達が占ったあとに戻ってきたら、開いたことが分かるように読み直す
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 30_000) return;
      last = Date.now();
      void loadReferral();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [currentUser?.uid, referralBirth, loadReferral]);
  const sendRef = async (code: string, birth: string): Promise<string | null> => {
    const r = await completeRef(code, birth);
    setPendingRef(getPendingRef());
    if (r.ok) { setRefSent(true); return null; }
    return r.message || '招待コードを確認できませんでした';
  };
  // Stripe の決済から戻ったとき（?pair=success|cancel）。Webhook が数秒遅れることがあるので、解放されるまで何度か読み直す
  const [pairReturn, setPairReturn] = useState<string | null>(() => {
    const v = new URLSearchParams(window.location.search).get('pair');
    if (!v) return null;
    const params = new URLSearchParams(window.location.search);
    params.delete('pair');
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : ''));
    return v;
  });
  // 登録なしの購入から戻ったとき（?sid=...）。Webhookが作ったアカウントで、この端末をログイン状態にする
  const [checkoutSid] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('sid');
    if (!v) return null;
    params.delete('sid');
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : ''));
    return v;
  });
  useEffect(() => {
    if (!checkoutSid) return;
    let cancelled = false;
    (async () => {
      const auth = getFirebaseAuth();
      await auth.authStateReady();
      if (cancelled || auth.currentUser) return; // ログイン中に買ったときは sid が付かない。付いていても何もしない
      for (let i = 0; i < 8; i++) {
        try {
          const r = await claimCheckout(checkoutSid);
          if (cancelled) return;
          if (!r.pending) {
            if (r.token) {
              // この購入で新しく作られたアカウント。1回かぎりのトークンでそのままログイン。
              // トークンは使い切りなので、失敗してもclaimを呼び直さない（呼び直すと「登録済みのメール」と誤って案内してしまう）
              try {
                await signInWithCustomToken(auth, r.token);
              } catch (e) {
                console.error('Could not sign in with the checkout token:', e);
                showAlert('お支払いを受け付けました。\n自動でログインできなかったので、決済のときに入力したメールでログインしてください。購入はそのアカウントに引き継がれます。');
                setShowAuthModal(true);
              }
            } else if (r.email) {
              showAlert(`お支払いを受け付けました。\n「${r.email}」は登録済みのメールです。このメールでログインすると、購入が反映されます。`);
              setShowAuthModal(true);
            }
            return;
          }
        } catch { /* 一時的な通信エラー: 少し待ってもう一度 */ }
        if (i < 7) await new Promise((r2) => setTimeout(r2, 2500));
      }
      if (!cancelled) showAlert('お支払いの確認に時間がかかっています。\n決済のときに入力したメールでログインすると、購入が反映されます。');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutSid]);
  // 解放したお相手は保存一覧に残し（上限に数えない）、印を付ける
  const rememberUnlockedPartner = useCallback((birth: string, info?: { name: string; mbti: string; gender: 'male' | 'female'; relationship: string }) => {
    setSavedPartners((prev) => {
      const i = prev.findIndex((x) => x.birth === birth);
      if (i >= 0) return prev[i].unlocked ? prev : prev.map((x, j) => (j === i ? { ...x, unlocked: true } : x));
      if (!info) return prev;
      return [...prev, { id: `${info.name}_${birth}_${Date.now()}`, name: info.name, birth, mbti: info.mbti, gender: info.gender, relationship: info.relationship, unlocked: true }];
    });
  }, []);
  const signedInUid = currentUser?.uid;
  useEffect(() => {
    if (flowStep !== 'result' || !renResult || mode !== 'match' || !oppBirth || isSubscribed) {
      setPartnerLock(null);
      setPairUnlock(null);
      return;
    }
    let cancelled = false;
    // 今日すでに確認したお相手なら、その結果で先に表示する（再読み込みで点数が一瞬伏せられないように）
    const cached = readCachedPartnerAccess(signedInUid, oppBirth);
    if (cached) {
      const a = cached.access;
      if (!a || a.daysLeft === Number.POSITIVE_INFINITY) setPartnerLock(null);
      else setPartnerLock({ status: a.locked ? 'locked' : 'free', daysLeft: a.daysLeft, guest: a.guest });
      setPairUnlock(a?.pair ?? null);
    } else {
      setPartnerLock({ status: 'checking', daysLeft: 0, guest: !signedInUid });
    }
    (async () => {
      const waitForPair = pairReturn === 'success' && Boolean(signedInUid);
      const tries = waitForPair ? 8 : 1;
      for (let i = 0; i < tries; i++) {
        const access = await fetchPartnerAccess(oppBirth);
        if (cancelled) return;
        if (access) writeCachedPartnerAccess(signedInUid, oppBirth, access);
        if (!access || access.daysLeft === Number.POSITIVE_INFINITY) setPartnerLock(null);
        else setPartnerLock({ status: access.locked ? 'locked' : 'free', daysLeft: access.daysLeft, guest: access.guest });
        setPairUnlock(access?.pair ?? null);
        if (access?.pair?.unlocked) rememberUnlockedPartner(oppBirth, { name: oppName || 'お相手', mbti: oppMbti, gender: oppGender, relationship });
        if (!waitForPair) return;
        if (access?.pair?.unlocked) {
          setPairReturn(null);
          setWelcomePairPartner(san(oppName));
          setShowPremiumWelcome(true);
          void notices.reload(); // お礼のお知らせを鈴に出す
          return;
        }
        if (i < tries - 1) await new Promise((r) => setTimeout(r, 2500));
      }
      if (!cancelled) {
        setPairReturn(null);
        showAlert('お支払いを受け付けました。解放の反映に少し時間がかかっています。\n1〜2分たってから、ページを再読み込みしてください。');
      }
    })();
    return () => { cancelled = true; };
  }, [flowStep, renResult, mode, oppBirth, isSubscribed, signedInUid, pairReturn]);
  // 登録なしでも買える（Stripeで入力したメールでアカウントを自動で作る）
  const handleBuyPair = async () => {
    trackCheckout('pair');
    rememberReadingForCheckout();
    try {
      await startPairCheckout(oppBirth);
    } catch (e) {
      showAlert(e instanceof Error ? e.message : '決済画面を開けませんでした。');
    }
  };
  const dailyScoreHidden = partnerLock !== null && partnerLock.status !== 'free';

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
    pushProfile(); // the input form has just saved the profile on this device
    trackFortune({ birth: data.myBirth, gender: data.myGender, mbti: data.myMbti });
    if (data.mode === 'match' && data.oppBirth) {
      autoSavePartner({
        name: data.oppName || 'お相手',
        birth: data.oppBirth,
        mbti: data.oppMbti,
        gender: data.oppGender,
        relationship: data.relationship
      });
    }
    // 招待URL（またはコード）で来た人が占い終えた: 招待した会員に数える
    if (pendingRef) void sendRef(pendingRef, data.myBirth);

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
    runMode: 'single' | 'match',
    skipLoading = false,
    presetCharacter?: 'ren' | 'tsuki',
    // true: 結果を用意するだけで、画面（タブ・履歴・スクロール・キャラ）は変えない（共有リンクを開いたときの前回結果の復元）
    background = false
  ) => {
    const execute = () => {
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

      const targetChar = presetCharacter || selectedCharacter;
      if (presetCharacter && !background) {
        setSelectedCharacter(presetCharacter);
      }

      lastReadingRef.current = { mName, mBirth, mMbti, mGender, oName, oBirth, oMbti, oGender, rel, runMode, selectedCharacter: targetChar };
      // Save last diagnosis input payload to localStorage for email magic link 2-step verification restore
      try {
        localStorage.setItem('hasu_last_diagnosis_input', JSON.stringify({
          mName,
          mBirth,
          mMbti,
          mGender,
          oName,
          oBirth,
          oMbti,
          oGender,
          rel,
          runMode,
          selectedCharacter: targetChar
        }));
      } catch (e) {
        console.error(e);
      }

      setReadingInput(input);
      // Generate results for both characters to allow instant tab toggling
      const resRen = generateFortuneResult(input, 'ren');
      const resTsuki = generateFortuneResult(input, 'tsuki');
      
      setRenResult(resRen);
      setTsukiResult(resTsuki);
      if (runMode === 'match') {
        const soloInput = { ...input, opponentName: undefined, opponentBirth: undefined, opponentMbti: undefined, opponentGender: undefined };
        setSoloRenResult(generateFortuneResult(soloInput, 'ren'));
        setSoloTsukiResult(generateFortuneResult(soloInput, 'tsuki'));
      } else {
        setSoloRenResult(resRen);
        setSoloTsukiResult(resTsuki);
      }
      if (background) return;
      
      setFlowStep('result');
      // 結果はいつも「鑑定結果」タブ（/result）で見せ、下のメニューと表示中の画面をそろえる。
      // 診断の入力画面からは1件積むので、戻ると入力画面に戻る。/result を開き直したときは積まずに置き換える
      setActiveTab('fortune');
      const onResultPath = getInitialRoute().tab === 'fortune';
      if (skipLoading && onResultPath) {
        replaceNav({ tab: 'fortune', flowStep: 'result' });
      } else {
        pushNav({ tab: 'fortune', slug: null, subView: 'main', legal: false, flowStep: 'result' }, '/result' + window.location.search);
      }
      scrollMainTo(0);
      if (pendingLPRef.current) {
        if (!lpReopenRef.current) lpFromMailRef.current = true;
        openPremiumLP(pendingLPRef.current);
        pendingLPRef.current = null;
      }
    };

    if (skipLoading) {
      execute();
    } else {
      setFlowStep('loading');
      setTimeout(execute, 3000);
    }
  };

  // マイページの中のページ（プロフィール編集・運営会社など）を開く。1件積むので、戻るでマイページ一覧に戻る
  const openSubView = (view: SettingsSubView) => {
    pushNav({ tab: 'profile', subView: view, legal: false });
    setActiveTab('profile');
    setSettingsSubView(view);
    scrollMainTo(0);
  };
  // 画面内の戻るボタン。戻るスワイプと同じく一つ前（マイページ一覧）に戻す
  const closeSubView = () => {
    if (!goBackOr({ subView: 'main' })) {
      setSettingsSubView('main');
      scrollMainTo(0);
    }
  };

  const currentPageKey = pageKey({ tab: activeTab, slug: selectedColumnSlug, subView: settingsSubView, legal: showLegalPage, flowStep: flowStep === 'result' ? 'result' : 'input' });
  applyNavRef.current = (nav: NavState) => {
    const flow = nav.flowStep === 'result' && renResult && tsukiResult ? 'result' : 'input';
    const pageChanged = pageKey({ ...nav, flowStep: flow }) !== currentPageKey;
    setActiveTab(nav.tab);
    setSelectedColumnSlug(nav.slug);
    setSettingsSubView(nav.subView);
    setShowLegalPage(nav.legal);
    setFlowStep(flow);
    if (nav.tab === 'home' && flow === 'input' && pageChanged) setLoadedPartner(null);
    const has = (name: OverlayName) => nav.overlays.includes(name);
    setIsChatOpen(has('chat'));
    if (!has('chat')) { setChatInitialQuestion(undefined); setChatTarget(null); }
    setShowPremiumLP(has('premiumLP'));
    setShowAuthModal(has('auth'));
    setShowShareCard(has('shareCard'));
    setShowNotifyEmailModal(has('notify'));
    setShowInstallGuideModal(has('installGuide'));
    setShowPremiumWelcome(has('premiumWelcome'));
    // 別の画面に戻ったときは、その画面を離れたときのスクロール位置へ（描画のあとに）
    if (pageChanged) {
      const top = nav.scroll ?? 0;
      requestAnimationFrame(() => requestAnimationFrame(() => scrollMainTo(top)));
    }
  };

  // 有料プランの案内を開いた回数（管理画面の集計用）。買い切りで解放できるロックから開いたか（pair）、月額側か（monthly）も送る
  useEffect(() => {
    if (showPremiumLP) {
      if (lpReopenRef.current) lpReopenRef.current = false; // 決済から戻って開き直しただけ。同じ訪問なので数えない
      else trackPremiumView(premiumLPFocus, lpFromMailRef.current);
      lpFromMailRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPremiumLP]);

  // 購入LPを買わずに閉じたら（×・戻る・下メニュー、どの閉じ方でも）、見送った理由を1問だけ聞く（3択＋スキップ）。
  // 訪問ごとに1回だけ。有料会員と、LPの「お相手との鑑定へ」で移動したときは聞かない
  const [showLpExitSurvey, setShowLpExitSurvey] = useState(false);
  const lpWasOpenRef = useRef(false);
  const lpPlansSeenRef = useRef(false);
  const lpSkipSurveyRef = useRef(false);
  useEffect(() => {
    if (showPremiumLP) {
      lpWasOpenRef.current = true;
      lpPlansSeenRef.current = false;
      lpSkipSurveyRef.current = false;
      return;
    }
    if (!lpWasOpenRef.current) return;
    lpWasOpenRef.current = false;
    if (!isSubscribed && !lpSkipSurveyRef.current && !lpExitAnswered()) setShowLpExitSurvey(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPremiumLP]);

  // ログインしていない人がログイン画面を開いた回数（会員登録までのどこで離れたかを見るため）
  useEffect(() => {
    if (showAuthModal && !currentUser) trackRegStep('auth_open');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAuthModal]);

  // チャット・プレミアム案内などの重ね表示を開いたら履歴を1件積み、閉じたら外す（戻るスワイプで閉じられるように）
  useEffect(() => {
    if (overlayBackPendingRef.current) return;
    const open = new Set<OverlayName>();
    if (isChatOpen) open.add('chat');
    if (showPremiumLP) open.add('premiumLP');
    if (showAuthModal) open.add('auth');
    if (showShareCard) open.add('shareCard');
    if (showNotifyEmailModal) open.add('notify');
    if (showInstallGuideModal) open.add('installGuide');
    if (showPremiumWelcome) open.add('premiumWelcome');
    if (syncOverlays(open) === 'back') overlayBackPendingRef.current = true;
  }, [isChatOpen, showPremiumLP, showAuthModal, showShareCard, showNotifyEmailModal, showInstallGuideModal, showPremiumWelcome]);

  const handleRegister = async (email: string) => {
    console.log(`Sending registration email link to: ${email}`);
    const cleanEmail = email.trim().toLowerCase();
    await sendEmailMagicLink(cleanEmail);
  };

  // Helper to get active result based on chosen character tab
  const activeResult = selectedCharacter === 'ren' ? renResult : tsukiResult;

  // 共有リンクを開いた人に同じ鑑定結果を見せるため、シェアカードを開いたときに結果を保存する（api/share.js → sharedResults）。
  // 保存が終わるまでと、保存できなかったときのリンクは、保存なしの形（カードの値だけ）になる。
  // 今日の点数を隠している日（無料の日数を使い切ったお相手）は、隠した点数や助言が見えてしまうので保存しない
  const [savedShare, setSavedShare] = useState<{ id: string; result: FortuneResult } | null>(null);
  useEffect(() => {
    if (!showShareCard || !renResult || !tsukiResult || dailyScoreHidden || savedShare?.result === tsukiResult) return;
    let active = true;
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, myName, oppName: mode === 'match' ? oppName : '', character: selectedCharacter, tsuki: tsukiResult, ren: renResult }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d && typeof d.id === 'string') setSavedShare({ id: d.id, result: tsukiResult }); })
      .catch(() => {});
    return () => { active = false; };
  }, [showShareCard, renResult, tsukiResult]);
  // お相手ありの鑑定でも、共有カードの「自分の運勢」タブのリンクは、自分だけの鑑定結果を保存して普段の結果画面で開けるようにする。
  // 自分だけの結果にはお相手の情報が入らないので、今日の相性を隠している日でも保存してよい
  const [savedSoloShare, setSavedSoloShare] = useState<{ id: string; result: FortuneResult } | null>(null);
  useEffect(() => {
    if (!showShareCard || mode !== 'match' || !soloRenResult || !soloTsukiResult || savedSoloShare?.result === soloTsukiResult) return;
    let active = true;
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'single', myName, oppName: '', character: selectedCharacter, tsuki: soloTsukiResult, ren: soloRenResult }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d && typeof d.id === 'string') setSavedSoloShare({ id: d.id, result: soloTsukiResult }); })
      .catch(() => {});
    return () => { active = false; };
  }, [showShareCard, soloRenResult, soloTsukiResult]);

  // 対話ロビーで選んだお相手（または自分だけ）の鑑定を、チャット用にその場で出す。点数の出し方は鑑定と同じ generateFortuneResult
  const chatResult = useMemo(() => {
    if (chatTarget === null) return activeResult;
    if (chatTarget === 'pick' || !myBirth) return null;
    const partner = chatTarget === 'self' ? null : chatTarget;
    // 保存時と同じく、お相手の性別は自分と逆にそろえる（handleSelectPartner と同じ）
    const partnerGender = partner && partner.gender === myGender ? (myGender === 'female' ? 'male' : 'female') : partner?.gender;
    try {
      return generateFortuneResult({
        myName,
        myBirth,
        myMbti,
        myGender,
        opponentName: partner?.name,
        opponentBirth: partner?.birth,
        opponentMbti: partner?.mbti,
        opponentGender: partnerGender,
        relationship: partner?.relationship || '片思い中'
      }, selectedCharacter);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [chatTarget, activeResult, myName, myBirth, myMbti, myGender, selectedCharacter]);
  const chatOpponentName = chatTarget === null
    ? (mode === 'match' ? oppName : undefined)
    : (chatTarget !== 'pick' && chatTarget !== 'self' ? chatTarget.name : undefined);
  // 今日の相性は、無料だとお相手ごとに見れる日数が決まっている。今の鑑定結果と同じお相手ならその判定を使い、
  // 別のお相手はチャットのために「見た日」を数えないよう、プレミアム以外では点数をAIに渡さない
  const chatHideDailyScore = chatTarget === null
    ? dailyScoreHidden
    : (chatTarget !== 'pick' && chatTarget !== 'self' && !isSubscribed
      && !(chatTarget.birth === oppBirth && mode === 'match' && flowStep === 'result' && !dailyScoreHidden));
  // チャットの会話を端末に残すときの、お相手の見分け方。保存したお相手と、いま占った同じお相手は同じ会話になる
  const chatHistoryPartnerKey = chatTarget === 'pick' ? undefined
    : chatTarget === 'self' ? 'self'
    : chatTarget !== null ? `p:${chatTarget.birth}:${chatTarget.name}`
    : (mode === 'match' && oppBirth ? `p:${oppBirth}:${oppName}` : 'self');
  const currentUnsaved = mode === 'match' && flowStep === 'result' && !!oppBirth && !currentPartnerSaved;

  // 初めて鑑定する人（未登録で、まだ鑑定結果が無い人）の診断（入力）画面では、下メニューを雑音として出さない（TAKASHI判断 2026-11-08）。
  // 無料会員・プレミアム会員と、一度鑑定した人は従来どおり出す。共有リンクの結果表示・読み込み中・鑑定結果でも出す
  const referralProp = {
    status: referralStatus,
    loading: referralLoading,
    unlocked: referralStatus?.unlocked === true,
    showCodeEntry: !refSent,
    onOpen: () => { if (!referralStatus) void loadReferral(); },
    onRedeem: (code: string) => sendRef(code, myBirth)
  };
  const hideNavbar = !isRegistered && !isSubscribed && !renResult && activeTab === 'home' && !sharedView && !sharedTeaser && flowStep === 'input';

  return (
    <div className={`app-container${activeTab === 'home' && flowStep !== 'result' ? ' bg-cosmos' : ''}`} style={{
      '--color-theme': selectedCharacter === 'tsuki' ? '#cdbfe2' : '#9cc6d8',
      '--color-theme-accent': selectedCharacter === 'tsuki' ? '#9f86c0' : '#3a86ab',
      '--shadow-theme-glow': selectedCharacter === 'tsuki' ? '0 0 15px rgba(159, 134, 192, 0.45)' : '0 0 15px rgba(58, 134, 171, 0.45)',
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
          ? 'radial-gradient(circle, rgba(159, 134, 192, 0.22) 0%, rgba(201, 86, 106, 0.08) 50%, rgba(0,0,0,0) 100%)' 
          : 'radial-gradient(circle, rgba(58, 134, 171, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(0,0,0,0) 100%)',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none',
        transition: 'all 1.0s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }} />
      {/* Scrollable Main Area */}
      <main className={`main-content no-scrollbar${hideNavbar ? ' no-navbar' : ''}`}>
        
        {/* 共有リンクから開いた、ほかの人の鑑定結果（見るだけ）。「あなたも無料で鑑定する」で自分の入力画面へ */}
        {activeTab === 'home' && sharedView?.status === 'loading' && <LoadingScreen />}
        {activeTab === 'home' && sharedView?.status === 'ready' && (() => {
          const d = sharedView.data;
          const leave = () => handleTabChange('home');
          return (
            <ResultView
              result={selectedCharacter === 'ren' ? d.ren : d.tsuki}
              renResult={d.ren}
              tsukiResult={d.tsuki}
              selectedChar={selectedCharacter}
              setSelectedChar={setSelectedCharacter}
              isRegistered={isRegistered}
              onRegister={handleRegister}
              isSubscribed={isSubscribed}
              onSubscribe={handleStartCheckout}
              onOpenPremiumLP={openPremiumLP}
              onOpenShareCard={() => {}}
              myName={d.myName}
              opponentName={d.mode === 'match' ? d.oppName : undefined}
              hasOpponent={d.mode === 'match'}
              onReset={leave}
              onShowLegal={() => {
                setShowLegalPage(true);
                pushNav({ legal: true });
              }}
              sharedBy={{ name: d.myName }}
            />
          );
        })()}

        {/* Tab 1: HOME (Includes Diagnosis Flow) */}
        {activeTab === 'home' && !sharedView && (
          <>
            {flowStep === 'input' && (
              <div className="home-input-flow" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', flexShrink: 0 }}>
                {/* 共有リンクから来た人には、まず共有された鑑定結果を見せる（「あなたも無料で鑑定する」で入力画面へ） */}
                {sharedTeaser ? (
                  <SharedResultView shared={sharedTeaser} onStart={() => handleTabChange('home')} />
                ) : (
                <>
                <Header currentUser={currentUser} onOpenAuth={() => setShowAuthModal(true)} unreadNotices={notices.unread} onOpenNotices={() => openSubView('news')} />
                <UnifiedInputView
                  key={inputViewKey}
                  selectedCharacter={selectedCharacter}
                  setSelectedCharacter={setSelectedCharacter}
                  onSubmit={handleDiagnosisSubmit}
                  savedPartners={savedPartners}
                  loadedPartner={loadedPartner}
                  onSelectPartner={handleSelectPartner}
                  onDeletePartner={handleDeletePartner}
                  isRegistered={isRegistered}
                  isSubscribed={isSubscribed}
                  prefill={inputPrefill}
                  afterSubmit={pendingRef ? (
                    // 友達紹介: 招待URLで来た人には一言、そうでなければ目立たない「招待コードをお持ちの方」
                    <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#f5d77a', lineHeight: 1.7, margin: 0 }}>
                      🎁 お友達からの招待です。占い終わると、恋愛運MAX日の直近の1日が見れます
                    </p>
                  ) : !refSent ? (
                    <ReferralCodeEntry
                      onSubmit={async (code) => { savePendingRef(code); setPendingRef(code); return null; }}
                      doneText="招待コードを預かりました。このまま占うとお友達に届きます"
                    />
                  ) : null}
                />
                </>
                )}
                {!sharedTeaser && <GuardianZukan />}
                <SeoFooterSection />
              </div>
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
                partnerLock={partnerLock}
                pairUnlock={pairUnlock}
                onBuyPair={handleBuyPair}
                onSubscribe={handleStartCheckout}
                onOpenPremiumLP={openPremiumLP}
                onOpenShareCard={() => setShowShareCard(true)}
                myName={myName}
                opponentName={mode === 'match' ? oppName : undefined}
                hasOpponent={mode === 'match'}
                onReset={handleResetFlow}
                onSavePartner={handleSavePartner}
                isPartnerSaved={currentPartnerSaved}
                todayInput={readingInput}
                todayPartners={savedPartners}
                onTodaySwitch={handleTodaySwitch}
                onUpdateJourney={handleUpdateJourney}
                referral={mode === 'match' ? referralProp : undefined}
                referralGift={refSent}
                onOpenChat={(question) => {
                  setChatInitialQuestion(question);
                  setChatTarget(null);
                  setIsChatOpen(true);
                }}
                onShowLegal={() => {
                  setShowLegalPage(true);
                  pushNav({ legal: true });
                }}
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
                partnerLock={partnerLock}
                pairUnlock={pairUnlock}
                onBuyPair={handleBuyPair}
                onSubscribe={handleStartCheckout}
                onOpenPremiumLP={openPremiumLP}
                onOpenShareCard={() => setShowShareCard(true)}
                myName={myName}
                opponentName={mode === 'match' ? oppName : undefined}
                hasOpponent={mode === 'match'}
                onReset={handleResetFlow}
                onSavePartner={handleSavePartner}
                isPartnerSaved={currentPartnerSaved}
                todayInput={readingInput}
                todayPartners={savedPartners}
                onTodaySwitch={handleTodaySwitch}
                onUpdateJourney={handleUpdateJourney}
                referral={mode === 'match' ? referralProp : undefined}
                referralGift={refSent}
                onOpenChat={(question) => {
                  setChatInitialQuestion(question);
                  setChatTarget(null);
                  setIsChatOpen(true);
                }}
                onShowLegal={() => {
                  setShowLegalPage(true);
                  pushNav({ legal: true });
                }}
              />
            ) : (
              <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', marginTop: '2rem' }}>
                <div style={{ color: 'var(--color-gold)', display: 'flex', justifyContent: 'center' }}>
                  <MoonMark size={48} className="animate-float" />
                </div>
                <h3 className="font-serif gold-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                  まだ鑑定結果がありません
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#d5cfc3', lineHeight: '1.6', maxWidth: '340px', margin: 0 }}>
                  「恋愛診断」から生年月日を入力すると、二人の本音・相性スコア・LINE吉時間がここに表示されます。
                </p>
                <button 
                  className="consult-btn font-serif" 
                  onClick={() => handleTabChange('home')}
                  style={{ marginTop: '0.5rem', padding: '0.9rem 2rem', fontSize: '0.95rem', fontWeight: 'bold' }}
                >
                  今すぐ相性を占う
                </button>
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
            <p style={{ fontSize: '0.8rem', color: '#a9a49a', textAlign: 'center', marginBottom: '2rem' }}>
              相談したいガイドのチャットルームに入室してください。
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', zIndex: 1, position: 'relative' }}>
              {/* Tsuki Lobby Card */}
              <div className="glass-panel" style={{
                display: 'flex',
                padding: '1.25rem 1rem',
                alignItems: 'center',
                gap: '0.9rem',
                cursor: 'pointer',
                border: '1px solid rgba(159, 134, 192,0.15)',
                transition: 'all 0.3s ease',
                opacity: isRegistered ? 1 : 0.85
              }} onClick={() => {
                if (!isRegistered) {
                  setShowAuthModal(true);
                } else {
                  setSelectedCharacter('tsuki');
                  setChatTarget('pick');
                  setIsChatOpen(true);
                }
              }}>
                <div style={{ position: 'relative' }}>
                  <img src="/assets/tsuki.jpg" alt="月" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-tsuki)', boxShadow: 'var(--shadow-tsuki)' }} />
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-serif" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#cdbfe2', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    月の温室 (🌙)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a9a49a', marginTop: '0.2rem', lineHeight: 1.6, textIndent: '-0.5em' }}>「不安な気持ち、そのまま話してくださいね。ちゃんと受けとめますよ。」</div>
                  <div style={{ marginTop: '0.55rem', display: 'flex' }}>
                  {isRegistered ? (
                    <span style={{ fontSize: '0.7rem', color: '#6fb08f', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '6px', height: '6px', background: '#6fb08f', borderRadius: '50%', boxShadow: '0 0 8px #6fb08f' }} />
                      待機中
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(226,192,116,0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(226,192,116,0.2)', fontWeight: 'bold' }}>
                      無料登録して開放
                    </span>
                  )}
                  </div>
                </div>
              </div>

              {/* Ren Lobby Card */}
              <div className="glass-panel" style={{
                display: 'flex',
                padding: '1.25rem 1rem',
                alignItems: 'center',
                gap: '0.9rem',
                cursor: 'pointer',
                border: '1px solid rgba(58, 134, 171,0.15)',
                transition: 'all 0.3s ease',
                opacity: isRegistered ? 1 : 0.85
              }} onClick={() => {
                if (!isRegistered) {
                  setShowAuthModal(true);
                } else {
                  setSelectedCharacter('ren');
                  setChatTarget('pick');
                  setIsChatOpen(true);
                }
              }}>
                <div style={{ position: 'relative' }}>
                  <img src="/assets/ren.jpg" alt="蓮" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-ren)', boxShadow: 'var(--shadow-ren)' }} />
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-serif" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#9cc6d8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    蓮の書斎
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a9a49a', marginTop: '0.2rem', lineHeight: 1.6, textIndent: '-0.5em' }}>「あの人の心の動きを、筋道立てて一緒に整理しましょう。」</div>
                  <div style={{ marginTop: '0.55rem', display: 'flex' }}>
                  {isRegistered ? (
                    <span style={{ fontSize: '0.7rem', color: '#6fb08f', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '6px', height: '6px', background: '#6fb08f', borderRadius: '50%', boxShadow: '0 0 8px #6fb08f' }} />
                      待機中
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(226,192,116,0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(226,192,116,0.2)', fontWeight: 'bold' }}>
                      無料登録して開放
                    </span>
                  )}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', margin: '2.5rem 0 1rem', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <HelpCircle size={14} style={{ color: '#b07d2b' }} />
              <span style={{ fontSize: '0.7rem', color: '#a9a49a' }}>
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
                  // 一覧から開いた記事なら、戻ると同じ（一覧のスクロール位置も戻る）。直接開いた記事なら一覧に置き換える
                  if (!goBackOr({ slug: null })) {
                    setSelectedColumnSlug(null);
                    scrollMainTo(0);
                  }
                }}
                onNavigateHome={(prefill) => {
                  handleTabChange('home');
                  if (prefill) setInputPrefill(prefill);
                }}
                onSelectArticle={(slug) => {
                  pushNav({ tab: 'column', slug });
                  setSelectedColumnSlug(slug);
                  scrollMainTo(0);
                }}
              />
            ) : (
              <ColumnListView
                onSelectArticle={(slug) => {
                  pushNav({ tab: 'column', slug });
                  setSelectedColumnSlug(slug);
                  scrollMainTo(0);
                }}
                onNavigateHome={() => handleTabChange('home')}
              />
            )}
          </div>
        )}

        {/* ツールページ（/tools/nicchu 日柱の調べ方、/compatibility 16タイプ恋愛相性表、/guardians 守護獣図鑑） */}
        {activeTab === 'tool' && (
          <div style={{ animation: 'fadeIn 0.4s ease', width: '100%' }}>
            {initialRoute.slug === 'compat' ? <ToolCompatView /> : initialRoute.slug === 'guardians' ? <ToolGuardiansView /> : <ToolNicchuView />}
          </div>
        )}

        {/* Tab 4: SETTINGS (MYPAGE) */}
        {activeTab === 'profile' && (
          <div data-clarity-mask="True" style={{ animation: 'fadeIn 0.4s ease', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
            {/* Header / Back Navigation */}
            {settingsSubView !== 'main' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={closeSubView}
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
                  {settingsSubView === 'contact' && 'お問い合わせ・ご意見'}
                  {settingsSubView === 'news' && 'お知らせ'}
                </span>
              </div>
            ) : (
              <h2 className="font-serif gold-text" style={{ fontSize: '1.8rem', textAlign: 'center', margin: '0.5rem 0 1rem' }}>
                アプリ設定・情報
              </h2>
            )}

            {/* Sub-View: MAIN MENU */}
            {settingsSubView === 'main' && (
              <div style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                      ? 'linear-gradient(135deg, rgba(125, 187, 138, 0.1) 0%, rgba(17, 23, 33, 0.8) 100%)' 
                      : 'linear-gradient(135deg, rgba(226, 192, 116, 0.15) 0%, rgba(159, 134, 192, 0.15) 100%)',
                    border: currentUser 
                      ? '1px solid rgba(125, 187, 138, 0.4)' 
                      : '1.5px solid rgba(226, 192, 116, 0.5)',
                    borderRadius: '18px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    {(
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #9f86c0 0%, #5b6aa8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        border: '1.5px solid var(--color-gold)'
                      }}>
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: currentUser ? '#ffffff' : '#f2e2b3' }}>
                        {currentUser ? 'マイページ' : 'Google / X で無料登録・ログイン'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: currentUser ? '#7dbb8a' : '#d8d2c6', marginTop: '2px' }}>
                        {currentUser ? `${currentUser.providerId === 'twitter.com' ? 'X 連携中' : (currentUser.providerId === 'email' || (() => { try { return localStorage.getItem('hasu_to_tsuki_registered') === 'email_verified'; } catch { return false; } })()) ? 'メール認証完了' : 'Google 連携中'} (${currentUser.email || 'メール未登録'})` : '鑑定履歴・お相手データをクラウド保存'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: currentUser ? '#7dbb8a' : 'var(--color-gold)' }} />
                </div>

                {/* お知らせ（運営からのお知らせ・あなたへのメッセージ） */}
                <div
                  onClick={() => openSubView('news')}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.05rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: notices.unread ? '1px solid rgba(207, 90, 67, 0.55)' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                    <Megaphone size={20} style={{ color: '#e2c074', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>お知らせ</span>
                      <span style={{ fontSize: '0.72rem', color: '#d8d2c6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notices.unread && notices.items[0] ? notices.items[0].title : '新しい機能や運営からのメッセージ'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {notices.unread > 0 && (
                      <span style={{ minWidth: '1.3rem', height: '1.3rem', padding: '0 0.35rem', boxSizing: 'border-box', borderRadius: '999px', background: '#cf5a43', color: '#fff', fontSize: '0.72rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {notices.unread > 9 ? '9+' : notices.unread}
                      </span>
                    )}
                    <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                  </div>
                </div>

                {/* Premium Plan Upgrade Banner Card / Member Rank (2nd) */}
                <div 
                  onClick={() => openPremiumLP('monthly')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(230, 184, 92, 0.12) 0%, rgba(184, 105, 45, 0.15) 100%)',
                    border: '1px solid rgba(230, 184, 92, 0.4)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                    <Crown size={18} style={{ color: '#f2e2b3', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff' }}>
                          月と蓮 プレミアムプラン
                        </span>
                        <span style={{
                          fontSize: '0.6rem',
                          background: isSubscribed ? '#6aa97c' : '#cf5a43',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          fontWeight: 'bold'
                        }}>
                          {isSubscribed ? (premiumEndsOn ? `${formatMonthDay(premiumEndsOn)}まで` : '購読中') : '未登録'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#f2e2b3', flexShrink: 0 }} />
                </div>

                <div 
                  onClick={() => openSubView('profile')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <User size={20} style={{ color: '#e2c074' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>プロフィール編集</span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                </div>

                <div 
                  onClick={() => openSubView('partners')}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <Users size={20} style={{ color: '#6fb08f' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>保存したお相手 ({savedPartners.length}人)</span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                </div>

                {/* 毎朝8時 運勢・吉時間通知設定 (ON / OFF Toggle) */}
                <div 
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                    <Bell size={20} style={{ color: '#f2e2b3', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>毎朝8時の運勢・吉時間通知</span>
                      <span style={{ fontSize: '0.72rem', color: '#d8d2c6' }}>
                        {notifyDailyLuck && notifyEmail ? `送信先: ${notifyEmail}` : '本日の運気とLINE推奨時間を毎朝お届け'}
                      </span>
                      {notifyDailyLuck && notifySub?.enabled && notifyTargetLabel && (
                        <span style={{ fontSize: '0.72rem', color: '#d8d2c6' }}>
                          内容: {notifyTargetLabel}{' '}
                          <button
                            type="button"
                            onClick={() => openNotifyModal()}
                            style={{ background: 'none', border: 'none', padding: 0, color: '#e8a93a', fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            変更
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (notifyDailyLuck) {
                        // OFFはログイン状態に関係なく、この画面のまま止める
                        setNotifyDailyLuck(false);
                        const ok = await unsubscribeEmailSubscription();
                        if (ok) {
                          setNotifySub(prev => (prev ? { ...prev, enabled: false } : prev));
                          showAlert('🔕 毎朝8時の運勢通知をOFFにしました。');
                        } else {
                          setNotifyDailyLuck(true);
                          showAlert('通知をOFFにできませんでした。通信状態を確認するか、ログインし直してからもう一度お試しください。');
                        }
                      } else if (!isRegistered && !currentUser) {
                        setShowAuthModal(true);
                      } else {
                        openNotifyModal();
                      }
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '13px',
                      background: notifyDailyLuck ? 'linear-gradient(135deg, #e8a93a 0%, #b07d2b 100%)' : 'rgba(255,255,255,0.15)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                      boxShadow: notifyDailyLuck ? '0 0 10px rgba(232, 169, 58, 0.4)' : 'none'
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

                {/* ホーム画面に追加（PWAインストール・案内）: 未登録のゲストには出さない（会員登録・有料会員になってから） */}
                {(isRegistered || isSubscribed) && (
                <div 
                  onClick={() => setShowInstallGuideModal(true)}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.08) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(226, 192, 116, 0.3)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <Smartphone size={20} style={{ color: '#f2e2b3' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>ホーム画面に追加（アプリ化）</span>
                      <span style={{ fontSize: '0.72rem', color: '#d8d2c6' }}>毎日ワンタップで運気やLINE吉時間をチェック</span>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: '#e2c074' }} />
                </div>
                )}

                <div 
                  onClick={() => {
                    openSubView('about');
                  }}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <BookOpen size={20} style={{ color: '#9f86c0' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>月と蓮について (占い解説)</span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                </div>

                <div 
                  onClick={() => {
                    openSubView('contact');
                    window.scrollTo(0, 0);
                  }}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <MessageCircle size={20} style={{ color: '#e2c074' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>お問い合わせ・ご意見</span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                </div>

                <div 
                  onClick={() => {
                    openSubView('tokushoho');
                  }}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <ShieldAlert size={20} style={{ color: '#3a86ab' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>特定商取引法に基づく表記</span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                </div>

                <div 
                  onClick={() => {
                    setShowLegalPage(true);
                    pushNav({ legal: true });
                  }}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <FileText size={20} style={{ color: '#5c9c7c' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>利用規約・プライバシーポリシー</span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                </div>

                <div 
                  onClick={() => {
                    openSubView('company');
                  }}
                  className="glass-panel" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    color: '#f3efe6',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <Building2 size={20} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 'bold' }}>運営会社</span>
                  </div>
                  <ChevronRight size={18} style={{ color: '#a9a49a' }} />
                </div>
              </div>
            )}

            {settingsSubView === 'news' && (
              <NoticesView items={notices.items} readAt={notices.readAt} loaded={notices.loaded} onOpened={() => { void notices.markAllRead(); }} />
            )}

            {settingsSubView === 'contact' && (
              <ContactForm
                defaultEmail={currentUser?.email}
                onBack={closeSubView}
              />
            )}

            {/* Sub-View: PROFILE EDIT */}
            {settingsSubView === 'profile' && (
              <div className="glass-panel" style={{ padding: '1.5rem 1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', borderRadius: '20px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#e2c074', fontWeight: 'bold' }}>お名前</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={myName === 'あなた' ? '' : myName}
                    placeholder="あなた (最大8文字)"
                    onChange={(e) => setMyName(e.target.value.slice(0, 8) || 'あなた')}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'white', outline: 'none', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#e2c074', fontWeight: 'bold' }}>生年月日 <span style={{ color: '#cf5a43' }}>(必須)</span></label>
                  <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                    <input
                      ref={profileBirthRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="例：19950401 (数字8桁)"
                      value={myBirth.replace(/-/g, '/')}
                      onChange={(e) => setMyBirth(formatBirthDate(e.target.value).replace(/\//g, '-'))}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'white', outline: 'none', fontSize: '0.95rem' }}
                    />
                    <div style={{ position: 'relative', width: '46px', height: '46px' }}>
                      <button
                        type="button"
                        onClick={() => setShowProfileDatePicker(true)}
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'var(--color-gold)', cursor: 'pointer' }}
                      >
                        <Calendar size={20} />
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#e2c074', fontWeight: 'bold' }}>16タイプ診断 (性格タイプ)</label>
                  <select
                    value={myMbti}
                    onChange={(e) => setMyMbti(e.target.value)}
                    style={{ background: '#0c1017', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'white', outline: 'none', fontSize: '0.95rem' }}
                  >
                    {mbtiOptions.map((opt: { value: string; label: string }) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#e2c074', fontWeight: 'bold' }}>性別 <span style={{ color: '#cf5a43' }}>(必須)</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => setMyGender('female')}
                      style={{
                        background: myGender === 'female' ? 'rgba(159, 134, 192, 0.22)' : 'rgba(255,255,255,0.03)',
                        border: myGender === 'female' ? '1.5px solid var(--color-tsuki)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        color: myGender === 'female' ? '#cdbfe2' : '#a9a49a',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: myGender === 'female' ? '0 0 15px rgba(159, 134, 192, 0.3)' : 'none'
                      }}
                    >
                      女性
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyGender('male')}
                      style={{
                        background: myGender === 'male' ? 'rgba(58, 134, 171, 0.22)' : 'rgba(255,255,255,0.03)',
                        border: myGender === 'male' ? '1.5px solid var(--color-ren)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        color: myGender === 'male' ? '#9cc6d8' : '#a9a49a',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: myGender === 'male' ? '0 0 15px rgba(58, 134, 171, 0.3)' : 'none'
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
                  onClick={async () => {
                    if (!isValidBirthDate(myBirth)) {
                      showFieldError('生年月日を「19950401」のように8桁で正しく入力してください。', profileBirthRef.current);
                      return;
                    }
                    try {
                      localStorage.setItem('hasu_user_profile', JSON.stringify({
                        name: myName || 'あなた',
                        birth: myBirth,
                        mbti: myMbti,
                        gender: myGender
                      }));
                    } catch (e) {}
                    pushProfile();
                    // Keep the daily email in step with the edited profile
                    if (notifyDailyLuck && currentUser) {
                      const synced = await updateEmailSubscriptionProfile({ myName: myName || 'あなた', myBirth, myGender, myMbti });
                      if (!synced) {
                        showAlert('プロフィールは保存しましたが、毎朝のメールへの反映に失敗しました。ログインし直してから、もう一度保存してください。');
                        closeSubView();
                        return;
                      }
                    }
                    showAlert('プロフィール変更を保存しました！');
                    closeSubView();
                  }}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  変更内容を保存する
                </button>

                {/* 開発用の切り替え。本番サイトでは出さない（押すだけで有料機能が開いてしまうため）。プレビューと手元では使える */}
                {!IS_PRODUCTION_SITE && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#a9a49a' }}>会員ステータス (開発用テスト)</label>
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
                          color: isRegistered ? 'var(--color-gold)' : '#a9a49a',
                          cursor: 'pointer'
                        }}
                      >
                        無料会員: {isRegistered ? '登録済' : 'ゲスト'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSubscribed(!isSubscribed)}
                        style={{
                          background: isSubscribed ? 'rgba(111, 176, 143, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: isSubscribed ? '1px solid #6fb08f' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          color: isSubscribed ? '#6fb08f' : '#a9a49a',
                          cursor: 'pointer'
                        }}
                      >
                        有料会員: {isSubscribed ? '購読中' : '未購読'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-View: SAVED PARTNERS MANAGEMENT */}
            {settingsSubView === 'partners' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.65rem' }}>
                  {/* シングルプランのお相手は上限に数えない（canAddPartner と同じ数え方） */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6fb08f', fontWeight: 'bold' }}>
                      保存件数: {savedPartners.filter((x) => !x.unlocked).length} / {isSubscribed ? 5 : (isRegistered ? 2 : 1)}人
                    </span>
                    {savedPartners.some((x) => x.unlocked) && (
                      <span style={{ fontSize: '0.68rem', color: '#e2c074', lineHeight: 1.5 }}>
                        ＋ シングルプランのお相手 {savedPartners.filter((x) => x.unlocked).length}人（保存件数とは別）
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#a9a49a' }}>
                    {isSubscribed ? '有料会員 (最大5人)' : (isRegistered ? '無料会員 (最大2人)' : '非会員 (最大1人)')}
                  </span>
                </div>

                {editingPartnerId !== NEW_PARTNER_ID && (
                  <button
                    type="button"
                    onClick={() => {
                      setNotifyAfterPartnerAdd(false);
                      startNewPartner();
                    }}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px dashed rgba(255,255,255,0.2)',
                      color: '#d8d2c6',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    ＋ お相手を追加
                  </button>
                )}

                {savedPartners.length === 0 && editingPartnerId !== NEW_PARTNER_ID ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#a9a49a', fontSize: '0.8rem', lineHeight: '1.6' }}>
                    保存したお相手のデータはありません。<br />
                    相性鑑定の結果画面か、「＋ お相手を追加」から保存できます。
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(editingPartnerId === NEW_PARTNER_ID
                      ? [...savedPartners, { id: NEW_PARTNER_ID, name: '', birth: '', mbti: 'UNKNOWN', gender: 'male' as const, relationship: '片思い中' }]
                      : savedPartners
                    ).map((partner) => {
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
                              {partner.id === NEW_PARTNER_ID ? '新しいお相手' : 'お相手情報の編集'}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.72rem', color: '#a9a49a' }}>ニックネーム</label>
                              <input
                                type="text"
                                value={editPartnerName}
                                maxLength={8}
                                onChange={(e) => setEditPartnerName(e.target.value.slice(0, 8))}
                                placeholder="お相手のニックネーム (最大8文字)"
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
                              <label style={{ fontSize: '0.72rem', color: '#a9a49a' }}>生年月日 (数字8桁)</label>
                              {partner.unlocked && (
                                <div style={{ fontSize: '0.7rem', color: '#f2c27a', lineHeight: 1.6 }}>
                                  ⚠️ シングルプランを購入したお相手です。生年月日を変えると、解放の対象から外れます（名前・16タイプ・性別の変更は大丈夫です）。
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                  ref={editPartnerBirthRef}
                                  type="text"
                                  inputMode="numeric"
                                  value={editPartnerBirth}
                                  onChange={(e) => setEditPartnerBirth(formatBirthDate(e.target.value).replace(/\//g, '-'))}
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
                                    color: '#d5cfc3',
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
                              <label style={{ fontSize: '0.72rem', color: '#a9a49a' }}>16タイプ診断 (MBTI)</label>
                              <select
                                value={editPartnerMbti}
                                onChange={(e) => setEditPartnerMbti(e.target.value)}
                                style={{
                                  background: 'rgba(15, 21, 30, 0.95)',
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
                              <label style={{ fontSize: '0.72rem', color: '#a9a49a' }}>性別</label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditPartnerGender('female')}
                                  style={{
                                    background: editPartnerGender === 'female' ? 'rgba(159, 134, 192, 0.2)' : 'rgba(255,255,255,0.03)',
                                    border: editPartnerGender === 'female' ? '1px solid #9f86c0' : '1px solid rgba(255,255,255,0.1)',
                                    color: editPartnerGender === 'female' ? '#cdbfe2' : '#a9a49a',
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
                                    background: editPartnerGender === 'male' ? 'rgba(58, 134, 171, 0.2)' : 'rgba(255,255,255,0.03)',
                                    border: editPartnerGender === 'male' ? '1px solid #3a86ab' : '1px solid rgba(255,255,255,0.1)',
                                    color: editPartnerGender === 'male' ? '#9cc6d8' : '#a9a49a',
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
                                  background: 'linear-gradient(135deg, #f2e2b3 0%, #e2c074 50%, #b8692d 100%)',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#000',
                                  padding: '0.55rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {partner.id === NEW_PARTNER_ID ? '保存する' : '変更を保存'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPartnerId(null);
                                  if (notifyAfterPartnerAdd) {
                                    // Back to the daily mail settings it was opened from
                                    setNotifyAfterPartnerAdd(false);
                                    openNotifyModal();
                                  }
                                }}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px',
                                  color: '#a9a49a',
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
                                background: partner.gender === 'female' ? 'rgba(159, 134, 192, 0.15)' : 'rgba(58, 134, 171, 0.15)',
                                color: partner.gender === 'female' ? '#cdbfe2' : '#9cc6d8',
                                border: partner.gender === 'female' ? '1px solid rgba(159, 134, 192, 0.3)' : '1px solid rgba(58, 134, 171, 0.3)',
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
                              {partner.unlocked && (
                                <span style={{
                                  fontSize: '0.6rem',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  background: 'rgba(111, 176, 143, 0.12)',
                                  color: '#8ecaa5',
                                  border: '1px solid rgba(111, 176, 143, 0.35)',
                                  fontWeight: '600'
                                }}>
                                  ✦ シングルプラン購入済み
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#a9a49a' }}>
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
                                // 買い切りで解放したお相手は、消す前にはっきり知らせる（購入は消えない＝同じ生年月日で占えばまた見れる）
                                const confirmText = partner.unlocked
                                  ? `⚠️ ${san(partner.name)}は、シングルプランで鑑定を解放したお相手です。\n\n削除すると「保存したお相手」の一覧から消えます。\n購入はなくならないので、同じ生年月日で占い直せば、解放された鑑定をまた見れます。\n\n本当に削除しますか？`
                                  : `${san(partner.name)}の保存データを削除しますか？`;
                                showConfirm(confirmText, { okLabel: partner.unlocked ? 'それでも削除する' : '削除する', danger: true }).then(ok => {
                                  if (ok) handleDeletePartner(partner.id);
                                });
                              }}
                              style={{
                                background: 'rgba(207, 90, 67, 0.1)',
                                border: '1px solid rgba(207, 90, 67, 0.25)',
                                borderRadius: '8px',
                                color: '#cf5a43',
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
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.6) 0%, rgba(13, 18, 26, 0.7) 100%)', borderRadius: '20px', border: '1px solid rgba(226, 192, 116, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <MoonMark size={18} style={{ color: 'var(--color-gold)' }} />
                    <h3 className="font-serif gold-text" style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>
                      ハイブリッド鑑定エンジンの概要
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#d8d2c6', lineHeight: '1.6', margin: 0 }}>
                    『月と蓮』は、生年月日から見る「四柱推命」「九星気学」と、「16タイプ性格診断」を組み合わせた恋愛相性鑑定です。二人の生まれ持った星の関係と、16タイプから見たコミュニケーションの相性に、日々の運勢の波を重ねて鑑定します。
                  </p>
                </div>

                {/* 相性の点数の出し方 */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.08) 0%, rgba(159, 134, 192, 0.1) 100%)', borderRadius: '20px', border: '1px solid rgba(226, 192, 116, 0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <MoonMark size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                    <h4 className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0 }}>
                      相性の点数の出し方
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#d8d2c6', lineHeight: '1.6', margin: 0 }}>
                    二人の「基本の相性」は、四柱推命・九星気学・16タイプの3つの相性を組み合わせて、100点満点で出します。「今日の相性」は、その日の干支・九星と二人の星の関係を足して出すので、毎日変わります。
                  </p>
                </div>

                {/* Rare Character / Stars Highlight Card */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(201, 122, 149, 0.06) 0%, rgba(159, 134, 192, 0.08) 100%)', borderRadius: '20px', border: '1px solid rgba(201, 122, 149, 0.25)' }}>
                  <h4 style={{ color: '#d68ba4', fontSize: '0.92rem', fontWeight: 'bold', margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MoonMark size={16} style={{ color: '#d68ba4' }} />
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
                      border: '1px solid rgba(207, 90, 67, 0.3)',
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
                        boxShadow: '0 0 20px rgba(184, 74, 55, 0.5)'
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
                        魁罡
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#e6a99c', fontWeight: 'bold' }}>
                        出現率：3.3%
                      </span>
                    </div>

                    {/* 2. 極星 (Gokusei/Rare) Actual Render Sample */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: '16px',
                      padding: '0.75rem',
                      border: '1px solid rgba(230, 184, 92, 0.3)',
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
                        boxShadow: '0 0 20px rgba(232, 169, 58, 0.5)'
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
                        選ばれし極星
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#f2e2b3', fontWeight: 'bold' }}>
                        出現率：7.0%
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#d5cfc3', lineHeight: '1.55', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div>
                      <strong style={{ color: '#fbcfe8' }}>・魁罡（かいごう：3.3%）</strong>：全12干支キャラクターすべてにおいて3.3%の確率で宿る強力な神殺の化身。強烈なカリスマと勝負運を持つオーラが発動します。
                    </div>
                    <div>
                      <strong style={{ color: '#fbcfe8' }}>・選ばれし極星（7.0%）</strong>：全キャラクターに7.0%の確率で宿る幸運のソウルメイト属性。黄金ホログラムの虹色光彩エフェクトが発動します。
                    </div>
                  </div>
                </div>

                {/* 4 Core Logic Section */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 21, 30, 0.65)', border: '1.5px solid rgba(226, 192, 116, 0.2)', borderRadius: '20px' }}>
                  <h3 className="font-serif gold-text" style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                    4つの多角的アプローチ
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* 1. 四柱推命 */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#e2c074', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        四柱推命<br/><span style={{ fontSize: '0.62rem', color: '#a9a49a', fontWeight: 'normal' }}>（日柱・五行）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#ffffff', marginBottom: '0.25rem' }}>魂・本質レベルの相性判定</div>
                        <p style={{ color: '#a9a49a', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
                          生年月日の「日」から導かれる十干十二支に基づき、生まれ持った本質・価値観・エネルギーの強弱を精密判定。互いを補い高め合える「相生」や、すれ違いやすいポイントを解明します。
                        </p>
                      </div>
                    </div>

                    {/* 2. レア星・特殊干支解析 */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#c9566a', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        特殊干支・レア星<br/><span style={{ fontSize: '0.62rem', color: '#e6a99c', fontWeight: 'normal' }}>（魁罡・貴人等）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#fecdd3', marginBottom: '0.25rem' }}>秘められた才能と宿命星の検出</div>
                        <p style={{ color: '#a9a49a', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
                          確率数％の強烈なカリスマと勝負運を秘めた「魁罡（かいごう）」や、生涯のピンチをチャンスに変える最高吉星「天乙貴人（てんおつきじん）」、奇跡的な強運の絆を結ぶ「天地徳合」などを自動検出・鑑定結果に反映します。
                        </p>
                      </div>
                    </div>

                    {/* 3. 九星気学 */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#b9a3d6', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        九星気学<br/><span style={{ fontSize: '0.62rem', color: '#a9a49a', fontWeight: 'normal' }}>（本命五行）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#ffffff', marginBottom: '0.25rem' }}>生活テンポと運気の調和</div>
                        <p style={{ color: '#a9a49a', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
                          生まれた「年」の九星エネルギーから、日常の行動ペースや決断のタイミングを分析。二人の相乗効果が高まる時期や、協力時のベストな関係性を提示します。
                        </p>
                      </div>
                    </div>

                    {/* 4. 16タイプ */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#5d9fc0', fontSize: '0.82rem', width: '85px', flexShrink: 0, letterSpacing: '0.03em' }}>
                        16タイプ<br/><span style={{ fontSize: '0.62rem', color: '#a9a49a', fontWeight: 'normal' }}>（心理傾向）</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#ffffff', marginBottom: '0.25rem' }}>会話癖とLINEコミュニケーション</div>
                        <p style={{ color: '#a9a49a', fontSize: '0.72rem', lineHeight: '1.45', margin: 0 }}>
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
                  <p style={{ fontSize: '0.75rem', color: '#d8d2c6', lineHeight: '1.55', margin: 0 }}>
                    『月と蓮』のデイリー運気は、当日の日盤運気の巡りとご自身の本質を掛け合わせてリアルタイム算出。引き寄せが高まる「幸運日」や、連絡に最適な「LINE推奨時間」をグラフ表示します。
                  </p>
                </div>
              </div>
            )}

            {/* Sub-View: TOKUSHOHO */}
            {settingsSubView === 'tokushoho' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.75rem', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>販売事業者</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Ill株式会社</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>運営責任者</span>
                  <span style={{ color: 'white' }}>須藤 涼弥</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>所在地</span>
                  <span style={{ color: 'white' }}>〒162-0054 東京都新宿区河田町3-52-2</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>お問合せ</span>
                  <span style={{ color: 'white' }}>support@tsuki-to-ren.com</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>電話番号</span>
                  <span style={{ color: 'white' }}>請求があった場合は遅滞なく開示します</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <span style={{ color: '#a9a49a', flexShrink: 0 }}>販売価格</span>
                  <span style={{ color: 'white', fontWeight: 'bold', textAlign: 'right' }}>プレミアムプラン: 月額980円 (税込)<br />シングルプラン（お相手1人・買い切り）: 680円 (税込)</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>契約期間・自動更新</span>
                  <span style={{ color: 'white' }}>1か月ごとの自動更新のサブスクリプション（初回はお申し込み時、2回目以降は毎月の更新日に決済）。更新日までに解約手続き（自動更新の停止）を行わない限り、同一条件で1か月ごとに自動的に契約が更新され、継続課金が発生します。無料お試し期間はありません。<br />お相手1人の深層鑑定（買い切り）は1回払いで、自動更新・継続課金はありません。購入したお相手（生年月日で判定）のトリセツ・深層鑑定・6つの相性グラフを期間の定めなくご利用いただけます。今日の相性など毎日変わる内容は、購入日（日本時間）のみご覧いただけます。</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>支払方法</span>
                  <span style={{ color: 'white' }}>クレジットカード（Visa / Mastercard / JCB / AMEX）、Apple Pay、Google Pay</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>商品代金以外の料金</span>
                  <span style={{ color: 'white' }}>パケット通信料等（お使いの回線に応じます）</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>商品の引き渡し</span>
                  <span style={{ color: 'white' }}>購入手続き完了後、ただちにご利用可能</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>解約方法（自動更新の停止）</span>
                  <span style={{ color: 'white' }}>マイページ（設定画面）内の「プレミアム会員の解約手続き」より、いつでも即座に定期課金の自動更新停止・解約手続きが可能です。解約を行わない限り契約は自動更新されます。解約完了後も次回更新日（有効期限満了日）までは有料機能を引き続きご利用いただけます。</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>動作環境</span>
                  <span style={{ color: 'white' }}>
                    【スマートフォン・タブレット・PC】<br />
                    ・iOS: 最新バージョンのSafari<br />
                    ・Android: 最新バージョンのGoogle Chrome<br />
                    ・PC (Windows / Mac): 最新バージョンのGoogle Chrome, Safari, Microsoft Edge<br />
                    ※インターネット接続環境が必要です。
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>返品・返金について</span>
                  <span style={{ color: 'white' }}>デジタルコンテンツの特性上、決済完了後のお客様都合によるキャンセル・返金・日割り計算による払戻しには応じかねます。ただし、当社システムに明らかな瑕疵（サービスが利用できない重大な不具合等）が認められた場合、または当社に帰責性がある過剰課金が発生した場合は、事実確認のうえ速やかに返金または決済取消対応を行います。プラン解約は設定画面よりいつでも即時可能です。</span>
                </div>
              </div>
            )}

            {/* Sub-View: PRIVACY POLICY */}
            {settingsSubView === 'privacy' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.75rem', lineHeight: '1.6', color: '#d8d2c6', width: '100%', boxSizing: 'border-box' }}>
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
                  <p>お預かりした生年月日等のデータは暗号化通信を行い、法令に基づく場合を除いて第三者への無断共有や提供は一切行いません。なお、有料プランの決済は決済代行会社 Stripe を通じて行い、クレジットカード情報は当社のサーバーに保存されません。</p>
                </div>
                <div>
                  <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.25rem' }}>4. 個人データの保存期間と削除方法</h4>
                  <p>個人データはアカウント保有中およびサービス提供に必要な期間に限り保管します。ユーザーは設定画面またはサポート窓口（support@tsuki-to-ren.com）よりいつでもデータの開示・訂正・完全削除を請求可能です。端末内のローカルデータはブラウザのキャッシュ消去により即座に削除されます。</p>
                </div>
                <div>
                  <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.25rem' }}>5. 苦情・相談対応体制</h4>
                  <p>個人情報の取扱いに関するご質問、苦情、相談等は下記窓口までお申し出ください。<br/>
                  【苦情・相談窓口】Ill株式会社（担当：須藤 涼弥）<br/>
                  所在地：〒162-0054 東京都新宿区河田町3-52-2<br/>
                  連絡先：support@tsuki-to-ren.com</p>
                </div>
              </div>
            )}

            {/* Sub-View: COMPANY */}
            {settingsSubView === 'company' && (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.75rem', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>社名</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Ill株式会社</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>代表取締役</span>
                  <span style={{ color: 'white' }}>須藤 涼弥</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>設立</span>
                  <span style={{ color: 'white' }}>2022年6月1日</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>所在地</span>
                  <span style={{ color: 'white' }}>〒162-0054 東京都新宿区河田町3-52-2</span>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a9a49a' }}>お問合せ</span>
                  <span style={{ color: 'white' }}>support@tsuki-to-ren.com</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: '#a9a49a' }}>事業内容</span>
                  <span style={{ color: 'white' }}>AI占いコンテンツ開発、次世代マッチングプラットフォーム『月と蓮』の企画運営・システム提供。</span>
                </div>
              </div>
            )}
          </div>
        )}

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
          onSubscribe={handleStartCheckout}
          onClose={() => { setIsChatOpen(false); setChatInitialQuestion(undefined); setChatTarget(null); }}
          result={chatResult}
          opponentName={chatOpponentName}
          initialQuestion={chatInitialQuestion}
          hideDailyScore={chatHideDailyScore}
          historyKey={chatHistoryPartnerKey}
          partnerPicker={chatTarget === 'pick' ? {
            partners: savedPartners,
            unsavedCurrentName: currentUnsaved ? (oppName || 'お相手') : undefined,
            onPick: (partner) => setChatTarget(partner),
            onPickSelf: () => setChatTarget('self'),
            onSaveCurrent: () => {
              const saved = handleSavePartner();
              if (saved) setChatTarget(saved);
            },
            onAddNew: () => {
              // 恋愛診断の入力画面へ。結果画面の「お相手を保存」から保存できる
              setIsChatOpen(false);
              setChatTarget(null);
              handleTabChange('home');
            }
          } : undefined}
        />
      )}

      {/* 鑑定したお相手の自動保存で上限に達したとき: 入れ替えて保存するか（自動のときは、結果画面で解放の確認が済んでから） */}
      {replaceCandidate && !showAuthModal && !savedPartners.some(p => isSamePartner(p, replaceCandidate.partner.name, replaceCandidate.partner.birth))
        && (replaceCandidate.manual || (flowStep === 'result' && partnerLock?.status !== 'checking' && !pairUnlock?.unlocked)) && (
        <PartnerReplaceModal
          candidate={replaceCandidate.partner}
          partners={savedPartners.filter((x) => !x.unlocked)}
          limit={partnerLimit}
          isRegistered={isRegistered}
          isSubscribed={isSubscribed}
          onReplace={replaceSavedPartner}
          onSkip={skipReplacePartner}
          onUpgrade={() => {
            // 未登録: 会員登録の画面を出す。お相手は持ったままにして、登録で枠が増えたら保存する（下の useEffect）
            if (!isRegistered) { setShowAuthModal(true); return; }
            setReplaceCandidate(null);
            openPremiumLP('monthly');
          }}
        />
      )}

      {/* Share Card Modal Overlay */}
      {showShareCard && activeResult && (
        <ShareCardModal
          selectedChar={selectedCharacter}
          result={activeResult}
          soloResult={selectedCharacter === 'ren' ? soloRenResult : soloTsukiResult}
          soloShareId={mode === 'match' && savedSoloShare && savedSoloShare.result === soloTsukiResult ? savedSoloShare.id : undefined}
          myName={myName}
          opponentName={mode === 'match' ? oppName : undefined}
          hasOpponent={mode === 'match'}
          hideDailyScore={dailyScoreHidden}
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
            // ログアウトのときは user が null。true のままだと、ログアウト後も無料会員向けの部分が見えたままになる
            setIsRegistered(Boolean(user));
            setShowAuthModal(false);
          }}
        />
      )}

      {/* Legal Page (利用規約・プライバシーポリシー) */}
      {showLegalPage && (
        <LegalPage onClose={() => {
          if (!goBackOr({ legal: false })) setShowLegalPage(false);
        }} />
      )}

      {/* Email Notification Setup Modal */}
      {showNotifyEmailModal && (
        // お相手が増えると中身が画面より高くなる。中央寄せのままだと上（✕）と下（保存ボタン）が画面外に出て
        // 操作できなくなるため、外枠の中でスクロールさせ、下メニュー（z-index 99999）より上に出す。
        <div className="notify-modal-overlay" style={{
          background: 'rgba(2, 3, 4, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding: 'calc(1.25rem + env(safe-area-inset-top, 0px)) 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '420px',
            margin: 'auto 0',
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgba(17, 24, 35, 0.98) 0%, rgba(9, 13, 19, 0.99) 100%)',
            border: '1px solid rgba(226, 192, 116, 0.3)',
            borderRadius: '24px',
            padding: '1.75rem 1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell size={20} style={{ color: '#e8a93a' }} />
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
                  color: '#a9a49a',
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

            <p style={{ fontSize: '0.82rem', color: '#d5cfc3', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              毎朝8時に「本日の運勢・吉時間」をメールでお届けします。通知の受け取り用メールアドレスを選択または入力してください。
            </p>

            {/* Quick select buttons if logged in email or existing email is available */}
            {(currentUser?.email || (notifyEmail && notifyEmail !== currentUser?.email)) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#a9a49a' }}>連携済みアドレスから選択:</span>
                {currentUser?.email && (
                  <button
                    type="button"
                    onClick={() => setNotifyEmailInput(currentUser.email || '')}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      background: notifyEmailInput === currentUser.email ? 'rgba(226, 192, 116, 0.15)' : 'rgba(255,255,255,0.04)',
                      border: notifyEmailInput === currentUser.email ? '1px solid rgba(226, 192, 116, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: notifyEmailInput === currentUser.email ? '#f2e2b3' : '#d8d2c6',
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
                      color: notifyEmailInput === notifyEmail ? '#f2e2b3' : '#d8d2c6',
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
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#a9a49a', marginBottom: '0.4rem' }}>
                直接入力 / 変更:
              </label>
              <input
                ref={notifyEmailRef}
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

            {/* Whose fortune the mail is about (the "詳細を見る" link in the mail opens the same reading) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a9a49a' }}>誰との運勢を届ける？</span>
              {[
                { id: 'self', label: '🌙 自分だけの運勢' },
                ...(showKeepTarget ? [{ id: 'keep', label: `💞 ${san(notifySub?.oppName)}との相性（今の設定）` }] : []),
                ...savedPartners.map(p => ({ id: p.id, label: `💞 ${san(p.name)}との相性` }))
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNotifyTarget(opt.id)}
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    background: notifyTarget === opt.id ? 'rgba(226, 192, 116, 0.15)' : 'rgba(255,255,255,0.04)',
                    border: notifyTarget === opt.id ? '1px solid rgba(226, 192, 116, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: notifyTarget === opt.id ? '#f2e2b3' : '#d8d2c6',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  // Opens the saved-partner form; saving it comes back here with the new partner chosen
                  setShowNotifyEmailModal(false);
                  openSubView('partners');
                  if (startNewPartner()) setNotifyAfterPartnerAdd(true);
                }}
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  color: '#d8d2c6',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                ＋ 新しいお相手を入力
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!notifyEmailInput || !notifyEmailInput.includes('@')) {
                  showFieldError('有効なメールアドレスを入力してください。', notifyEmailRef.current);
                  return;
                }
                if (!isValidBirthDate(myBirth)) {
                  showAlert('毎朝の運勢は生年月日から計算します。先にプロフィール編集で生年月日を登録してください。');
                  return;
                }
                const cleanEmail = notifyEmailInput.trim().toLowerCase();
                const accountEmail = currentUser?.email?.toLowerCase();
                if (!accountEmail || accountNeedsEmail()) {
                  await askToAddEmail();
                  return;
                }
                if (cleanEmail !== accountEmail) {
                  showFieldError('通知は、ログイン中のアカウントのメールアドレスにのみ送れます。', notifyEmailRef.current);
                  return;
                }

                const partner = savedPartners.find(p => p.id === notifyTarget);
                if (partner && !isValidBirthDate(partner.birth.replace(/\//g, '-'))) {
                  showAlert(`${san(partner.name)}の生年月日が正しくありません。「保存したお相手」で直してから選んでください。`);
                  return;
                }

                // Sync the subscription to Firestore; the 8:00 AM cron reads it for delivery
                const saved = await saveNotifySubscription(cleanEmail, partner || (notifyTarget === 'keep' && showKeepTarget ? 'keep' : null));
                if (!saved) {
                  showAlert('通知の登録に失敗しました。ログインし直してから、もう一度お試しください。');
                  return;
                }
                setNotifyEmail(cleanEmail);
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
              {notifyDailyLuck ? 'この内容で保存する' : '通知を有効化する'}
            </button>
          </div>
        </div>
      )}

      <LpExitSurvey
        isOpen={showLpExitSurvey}
        onAnswer={(reason) => {
          trackLpExit(reason, lpPlansSeenRef.current);
          setShowLpExitSurvey(false);
        }}
      />

      <PremiumWelcomeModal isOpen={showPremiumWelcome} pairPartner={welcomePairPartner} onClose={() => setShowPremiumWelcome(false)} />

      {/* Premium LP Modal / Landing Page */}
      <PremiumLPModal
        isOpen={showPremiumLP}
        onClose={() => setShowPremiumLP(false)}
        focus={premiumLPFocus}
        pair={mode === 'match' && oppBirth && renResult ? { name: san(oppName), unlocked: pairUnlock?.unlocked === true, onBuy: handleBuyPair } : null}
        onPlansSeen={() => { lpPlansSeenRef.current = true; }}
        onStartPairReading={() => {
          lpSkipSurveyRef.current = true;
          setMode('match');
          handleTabChange('home');
          window.scrollTo({ top: 0 });
        }}
        onSubscribe={handleStartCheckout}
        onCancelSubscription={handleOpenBillingPortal}
        isSubscribed={isSubscribed}
        premiumEndsOn={premiumEndsOn}
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
            <p style={{ fontSize: '0.78rem', color: '#d8d2c6', lineHeight: '1.6', margin: 0 }}>
              メールリンクからのアクセスを確認いたしました。<br />
              完了するため、ご入力されたメールアドレスを入力してください。
            </p>
            <input
              ref={promptEmailRef}
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
                  showFieldError('有効なメールアドレスを入力してください。', promptEmailRef.current);
                  return;
                }
                const res = await completeEmailMagicLinkSignIn(clean);
                if (res.success && res.user) {
                  setCurrentUser(res.user);
                  setIsRegistered(true);
                  setShowEmailPromptModal(false);
                } else {
                  showAlert('認証に失敗しました。メールアドレスが正しいかご確認ください。');
                }
              }}
              className="consult-btn font-serif"
              style={{ padding: '0.85rem', width: '100%', fontSize: '0.9rem', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }}
            >
              認証を完了して続きを見る →
            </button>
          </div>
        </div>
      )}

      {/* Global Add to Home Screen (A2HS) Guide Modal */}
      <InstallGuideModal
        isOpen={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
      />

      {/* Global Bottom Navbar（初めて鑑定する人の診断の入力画面だけは出さない） */}
      {!hideNavbar && <Navbar activeTab={activeTab} setActiveTab={handleTabChange} profileBadge={notices.unread} />}
    </div>
  );
}

export default App;
