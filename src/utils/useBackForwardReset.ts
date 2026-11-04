import { useEffect, useRef } from 'react';

/**
 * ブラウザの「戻る」で、ページがそのまま復元されたとき（bfcache。iPhoneのSafariで多い）に reset を呼ぶ。
 * 決済画面（Stripe）へ移る前に「移動しています…」にしたボタンが、戻ってきてもそのまま押せなくなるのを防ぐ。
 */
export const useBackForwardReset = (reset: () => void) => {
  const ref = useRef(reset);
  ref.current = reset;
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) ref.current(); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);
};
