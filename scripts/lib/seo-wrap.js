// Wraps the SEO text that the prerender scripts write into <div id="root">.
// The text stays in the HTML for crawlers, but people see a branded splash instead of a bare, unstyled page
// while the app boots. React replaces #root's children on mount, which removes the wrapper (and the splash).
// The matching CSS lives in index.html (.seo-splash / .seo-content).
export function wrapSeoContent(content) {
  return `<div data-seo-prerender><div class="seo-splash" aria-hidden="true"><span class="seo-splash-logo">🌙 月と蓮 🪷</span><span class="seo-splash-text">読み込み中</span></div><div class="seo-content">${content}</div></div>`;
}
