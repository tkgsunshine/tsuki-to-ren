import { externalBrowserUrl, IN_APP_BROWSER_ERROR } from '../services/firebase';
import { regErrorFrom, trackRegError } from '../services/analytics';
import { showAlert, showConfirm } from '../components/AppDialog';

// Google・X のログインが始められなかった・失敗したときの案内（結果画面の登録の箱とログイン画面で同じものを使う）。
// 以前は結果画面の箱では何も表示されず、押しても何も起きないように見えた（2026-11-13）

const IN_APP_TEXT = 'LINEやInstagramなどのアプリの中の画面では、Googleのログインが使えません。\nメールアドレスでの登録なら、この画面のまま続けられます。';

/** アプリの中の画面で Google を押したときの案内。LINE なら Safari・Chrome で開き直すボタンも出す */
export const showInAppBrowserGuide = async () => {
  const ext = externalBrowserUrl();
  if (ext) {
    const ok = await showConfirm(`${IN_APP_TEXT}\nGoogleで登録したいときは、Safari・Chromeで開き直してください（鑑定はもう一度入力が必要です）。`, {
      title: 'Googleのログインについて', okLabel: 'ブラウザで開く', cancelLabel: 'メールで登録する'
    });
    if (ok) window.location.href = ext;
    return;
  }
  await showAlert(`${IN_APP_TEXT}\nGoogleで登録したいときは、画面右上（または右下）のメニューから「ブラウザで開く」を選んでください。`, { title: 'Googleのログインについて' });
};

/** Google・X のログインの失敗を記録し、やめただけ（閉じた）のとき以外は案内を出す。案内の文を返す（ログイン画面は画面内に出す） */
export const handleSignInError = (method: 'google' | 'x', err: any): string | null => {
  const code = String(err?.code || '');
  if (code === IN_APP_BROWSER_ERROR) {
    void showInAppBrowserGuide(); // 記録は signInWithGoogle 側で済み
    return null;
  }
  const reason = regErrorFrom(method, code);
  trackRegError(reason);
  const name = method === 'google' ? 'Google' : 'X';
  if (reason.endsWith('_cancel')) return null;
  if (reason.endsWith('_network')) return '通信環境が不安定です。電波のよいところで、もう一度お試しください。';
  if (method === 'x' && (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found')) {
    return 'X（旧Twitter）連携は現在準備中です。Googleアカウントまたはメールアドレスでご登録ください。';
  }
  return `${name}でのログインに失敗しました。もう一度お試しいただくか、メールアドレスでの登録をお試しください。`;
};
