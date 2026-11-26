// iOS (Safari + the Capacitor WKWebView) zooms the whole page when an input with a font size
// below 16px gets focus, and doesn't zoom back. Adding maximum-scale=1 to the viewport stops that
// focus zoom. iOS ignores maximum-scale for pinch-to-zoom, so users can still zoom manually.
// Only applied on iOS: on Android maximum-scale would block pinch zoom, and Android doesn't
// auto-zoom inputs anyway.
const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports itself as a Mac; tell it apart by touch support
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
};

export function installIOSNoInputZoom() {
  if (typeof document === 'undefined' || !isIOS()) return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  const content = meta.getAttribute('content') || '';
  if (/maximum-scale/.test(content)) return;
  meta.setAttribute('content', `${content}, maximum-scale=1`);
}
