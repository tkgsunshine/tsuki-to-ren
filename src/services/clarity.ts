import { isTrackingOptedOut } from './analytics.ts';

// Microsoft Clarity（ヒートマップ・行動の録画）。
// - プロジェクトIDは Vercel の環境変数 VITE_CLARITY_PROJECT_ID から読む（未設定なら何もしない）。
// - 本番のドメインだけで動かす（Preview・ローカルでは読み込まない）。
// - 管理画面、集計から外したブラウザ（運営の端末）、自動操作のブラウザは送らない。
// - 入力欄・チャット・マイページ・お問い合わせ・ログイン画面は data-clarity-mask で中身を隠す。
const PROD_HOSTS = ['www.tsuki-to-ren.com', 'tsuki-to-ren.com'];

export const shouldLoadClarity = (opts: {
  projectId: string | undefined;
  hostname: string;
  isAdminPage: boolean;
  optedOut: boolean;
  automated: boolean;
}) => Boolean(opts.projectId && /^[a-z0-9]{6,20}$/i.test(opts.projectId))
  && PROD_HOSTS.includes(opts.hostname)
  && !opts.isAdminPage && !opts.optedOut && !opts.automated;

export const initClarity = (isAdminPage: boolean) => {
  if (typeof window === 'undefined') return;
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
  const ok = shouldLoadClarity({
    projectId,
    hostname: window.location.hostname,
    isAdminPage,
    optedOut: isTrackingOptedOut(),
    automated: (navigator as Navigator & { webdriver?: boolean }).webdriver === true,
  });
  if (!ok) return;
  // Microsoft 公式の読み込みコード（@microsoft/clarity 1.0.2 と同じ内容）
  try {
    const w = window as Window & { clarity?: ((...args: unknown[]) => void) & { q?: unknown[] } };
    if (document.getElementById('clarity-script')) return;
    // eslint-disable-next-line prefer-rest-params
    w.clarity = w.clarity || function () { (w.clarity!.q = w.clarity!.q || []).push(arguments); };
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.clarity.ms/tag/${projectId}`;
    s.id = 'clarity-script';
    const first = document.getElementsByTagName('script')[0];
    if (first?.parentNode) first.parentNode.insertBefore(s, first);
    else document.head.appendChild(s);
  } catch {}
};
