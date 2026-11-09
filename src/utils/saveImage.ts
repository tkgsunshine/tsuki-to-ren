// 画像の保存（守護獣カード・共有カード）。
// 1. 共有シート（iPhoneのSafariなど）→ 2. ダウンロード（PCや普通のブラウザ）。
// X・Instagram・LINE などアプリ内ブラウザと、共有シートが使えない iPhone では、ダウンロードすると
// 画像だけのページ（blob:）に飛んで戻れなくなる（2026-11-05 Xのアプリ内ブラウザで固まった）。
// その場合はページを移動せず、画面の上に画像を重ねて「長押しで保存」を案内する。

export type SaveImageResult = 'shared' | 'downloaded' | 'preview' | 'aborted';

const IN_APP_UA = /Twitter|\bX\/\d|Line\/|Instagram|FBAN|FBAV|FB_IAB|MicroMessenger|TikTok|musical_ly|BytedanceWebview|Threads/i;

function isIOS(): boolean {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
}

function isInAppBrowser(): boolean {
  return IN_APP_UA.test(navigator.userAgent || '');
}

function showPreviewOverlay(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', '画像を保存');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '200000', background: 'rgba(3, 5, 9, 0.94)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '0.9rem', padding: 'calc(1rem + env(safe-area-inset-top, 0px)) 1rem calc(1rem + env(safe-area-inset-bottom, 0px))',
    boxSizing: 'border-box',
  } as Partial<CSSStyleDeclaration>);

  const note = document.createElement('div');
  note.textContent = '画像を長押しして「写真に保存」を選んでください';
  Object.assign(overlay.appendChild(note).style, {
    color: '#f2e2b3', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.5',
  } as Partial<CSSStyleDeclaration>);

  const img = document.createElement('img');
  img.src = url;
  img.alt = filename;
  Object.assign(overlay.appendChild(img).style, {
    maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.6)', webkitTouchCallout: 'default', userSelect: 'auto',
  } as Partial<CSSStyleDeclaration>);

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '閉じる';
  Object.assign(overlay.appendChild(close).style, {
    padding: '0.6rem 2.2rem', borderRadius: '9999px', border: '1px solid rgba(226, 192, 116, 0.6)',
    background: 'rgba(11, 15, 21, 0.9)', color: '#f2e2b3', fontSize: '0.9rem', fontFamily: 'inherit', cursor: 'pointer',
  } as Partial<CSSStyleDeclaration>);

  const remove = () => {
    overlay.remove();
    URL.revokeObjectURL(url);
  };
  close.addEventListener('click', remove);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) remove(); });
  document.body.appendChild(overlay);
}

export async function saveImageBlob(blob: Blob, filename: string, title: string): Promise<SaveImageResult> {
  // 1. 共有シート（写真に保存できる）
  if (navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return 'shared';
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'aborted';
    }
  }

  // 2. アプリ内ブラウザ・iPhone はダウンロードでページが移動してしまうので、画面の上に出して長押しで保存
  if (isInAppBrowser() || isIOS()) {
    showPreviewOverlay(blob, filename);
    return 'preview';
  }

  // 3. ダウンロード
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  return 'downloaded';
}
