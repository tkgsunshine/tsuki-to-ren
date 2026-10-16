import { StrictMode, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppDialogHost } from './components/AppDialog'
import { installStandaloneBottomGapFix } from './utils/pwaHelper'
import { initAttribution } from './services/analytics'

const AdminView = lazy(() => import('./components/AdminView'))
const isAdminPage = /^\/admin\/?$/.test(window.location.pathname)

installStandaloneBottomGapFix()
if (!isAdminPage) initAttribution()

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
