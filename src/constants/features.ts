// 画面機能の出し消し設定。
// 「鑑定結果をシェアする」ボタン: 非表示にするには、Vercelの環境変数
// VITE_SHOW_SHARE_BUTTON を "false" にして再デプロイする（未設定なら表示）。
export const SHOW_SHARE_BUTTON = import.meta.env.VITE_SHOW_SHARE_BUTTON !== 'false';
