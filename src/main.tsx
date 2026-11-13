import { StrictMode, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppDialogHost } from './components/AppDialog'
import { installPageScrollReset, installStandaloneBottomGapFix } from './utils/pwaHelper'
import { initAttribution, isTrackingOptedOut } from './services/analytics'
import { inject as injectVercelAnalytics } from '@vercel/analytics'
import { initClarity } from './services/clarity'

const AdminView = lazy(() => import('./components/AdminView'))
const isAdminPage = /^\/admin\/?$/.test(window.location.pathname)

// Previewだけ: URLに ?fresh=1 を付けて開くと、このブラウザの保存データ（入力・鑑定結果・ゲストのかけら・ログイン）を
// すべて消して「初めて訪れた状態」で開き直す。本番ドメイン（tsuki-to-ren.com・hasu-to-tsuki-two.vercel.app）では何もしない
const isPreviewHost =
  /\.vercel\.app$/.test(window.location.hostname) && window.location.hostname !== 'hasu-to-tsuki-two.vercel.app'
const wantsFresh = (isPreviewHost || import.meta.env.DEV) && new URLSearchParams(window.location.search).has('fresh')

// 片付けのどれか（他のタブが開いているデータベースの削除など）が終わらなくても、必ず数秒でトップへ移る
const withTimeout = <T,>(p: Promise<T> | undefined, ms: number) => Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))])

async function resetToFirstVisit() {
  // 起動の見張り（index.html）が「うまく読み込めませんでした」を出さないように
  ;(window as unknown as { __tsrBooted?: boolean }).__tsrBooted = true
  const hardStop = setTimeout(() => window.location.replace('/'), 4000)
  await doReset()
  clearTimeout(hardStop)
  window.location.replace('/')
}

async function doReset() {
  try { localStorage.clear() } catch { /* 何もしない */ }
  try { sessionStorage.clear() } catch { /* 何もしない */ }
  try {
    const idb = indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> }
    const list = idb.databases ? await withTimeout(idb.databases(), 800) : undefined
    const names = list ? (list as { name?: string }[]).map((d) => d.name).filter(Boolean) as string[] : ['firebaseLocalStorageDb']
    await withTimeout(Promise.all(names.map((n) => new Promise<void>((done) => {
      const req = indexedDB.deleteDatabase(n)
      req.onsuccess = req.onerror = req.onblocked = () => done()
    }))), 1200)
  } catch { /* 何もしない */ }
  try {
    const regs = await withTimeout(navigator.serviceWorker?.getRegistrations?.(), 800)
    await withTimeout(Promise.all(((regs || []) as readonly ServiceWorkerRegistration[]).map((r) => r.unregister())), 800)
  } catch { /* 何もしない */ }
  try {
    const keys = await withTimeout(caches.keys(), 800)
    await withTimeout(Promise.all(((keys || []) as string[]).map((k) => caches.delete(k))), 800)
  } catch { /* 何もしない */ }
}

if (wantsFresh) void resetToFirstVisit()

if (!wantsFresh) installStandaloneBottomGapFix()
if (!wantsFresh && !isAdminPage) initAttribution()
// 自前の訪問カウンターと突き合わせるための、Vercel Web Analytics（ページビュー・訪問者・流入元）。
// 管理画面と、集計から外したブラウザ（運営の端末）は送らない。Vercel側で Web Analytics を有効にすると集計が始まる
if (!wantsFresh && !isAdminPage) injectVercelAnalytics({ framework: 'vite', beforeSend: (event) => (isTrackingOptedOut() ? null : event) })
if (!wantsFresh && !isAdminPage) installPageScrollReset()
// Microsoft Clarity（ヒートマップ・録画）。本番ドメインかつ VITE_CLARITY_PROJECT_ID があるときだけ。管理画面・運営の端末は送らない
if (!wantsFresh) initClarity(isAdminPage)

// 開きっぱなしのタブで、デプロイ後に古い分割JS（lazy import）を読もうとして失敗したら、1回だけ読み込み直して最新にする
// （Vercelは前のデプロイのJSを残さない）。連続で失敗したときは読み込み直さず、通常のエラーとして扱う
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'tsr-chunk-reload-at'
  try {
    const last = Number(sessionStorage.getItem(KEY)) || 0
    if (Date.now() - last < 60_000) return
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

// index.html の起動スプラッシュを、アプリが描画されたあとにフェードアウトして外す
function BootSplashRemover() {
  useEffect(() => {
    ;(window as Window & { __tsrBooted?: boolean }).__tsrBooted = true
    const splash = document.getElementById('boot-splash')
    if (!splash || splash.classList.contains('is-hidden')) return
    splash.classList.add('is-hidden')
    window.setTimeout(() => splash.remove(), 400)
  }, [])
  return null
}

if (!wantsFresh) createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPage ? (
      <Suspense fallback={null}>
        <AdminView />
      </Suspense>
    ) : (
      <App />
    )}
    <AppDialogHost />
    <BootSplashRemover />
  </StrictMode>,
)
