import { StrictMode, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppDialogHost } from './components/AppDialog'
import { installPageScrollReset, installStandaloneBottomGapFix } from './utils/pwaHelper'
import { initAttribution, isTrackingOptedOut } from './services/analytics'
import { inject as injectVercelAnalytics } from '@vercel/analytics'

const AdminView = lazy(() => import('./components/AdminView'))
const isAdminPage = /^\/admin\/?$/.test(window.location.pathname)

installStandaloneBottomGapFix()
if (!isAdminPage) initAttribution()
// 自前の訪問カウンターと突き合わせるための、Vercel Web Analytics（ページビュー・訪問者・流入元）。
// 管理画面と、集計から外したブラウザ（運営の端末）は送らない。Vercel側で Web Analytics を有効にすると集計が始まる
if (!isAdminPage) injectVercelAnalytics({ framework: 'vite', beforeSend: (event) => (isTrackingOptedOut() ? null : event) })
if (!isAdminPage) installPageScrollReset()

// index.html の起動スプラッシュを、アプリが描画されたあとにフェードアウトして外す
function BootSplashRemover() {
  useEffect(() => {
    const splash = document.getElementById('boot-splash')
    if (!splash || splash.classList.contains('is-hidden')) return
    splash.classList.add('is-hidden')
    window.setTimeout(() => splash.remove(), 400)
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
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
