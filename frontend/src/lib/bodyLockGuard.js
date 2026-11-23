// Safety net for modal libraries (vaul drawers, Radix dialogs) that set
// `pointer-events: none` / `overflow: hidden` on <body> while open. If a
// sheet unmounts mid-animation (route change, fast close) the style can be
// left behind, which kills wheel/trackpad scrolling everywhere except on
// fixed elements that opt back in with pointer-events: auto. When no modal
// is actually open, clear the stale lock.
const OPEN_MODAL_SELECTOR = [
  '[data-vaul-drawer][data-state="open"]',
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
].join(',');

const isLocked = () =>
  document.body.style.pointerEvents === 'none' || document.body.style.overflow === 'hidden';

export function installBodyLockGuard() {
  if (typeof window === 'undefined' || !window.MutationObserver) return;
  let timer = null;

  const check = () => {
    timer = null;
    if (!isLocked() || document.querySelector(OPEN_MODAL_SELECTOR)) return;
    document.body.style.pointerEvents = '';
    if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    // Give close animations time to finish and clean up on their own first.
    timer = setTimeout(check, 600);
  };

  new MutationObserver(schedule).observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
    childList: true,
  });
  window.addEventListener('popstate', schedule);
}
