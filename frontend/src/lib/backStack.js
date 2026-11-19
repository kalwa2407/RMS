// Hardware back-button stack (Android).
//
// Screens register a handler while an overlay (sheet, modal, full-screen view)
// is open. The App-level Capacitor "backButton" listener asks this stack first;
// the most recently registered handler closes its overlay and the app does not
// exit. Only when the stack is empty does the app fall back to route handling.
import { useEffect, useRef } from 'react';

const handlers = [];

export function pushBackHandler(fn) {
  const entry = { fn };
  handlers.push(entry);
  return () => {
    const idx = handlers.indexOf(entry);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}

// Returns true when a registered overlay consumed the back press.
export function handleBackPress() {
  for (let i = handlers.length - 1; i >= 0; i -= 1) {
    const result = handlers[i].fn();
    if (result !== false) return true;
  }
  return false;
}

// Registers `onBack` while `active` is true. The latest callback is always
// used, so callers can pass inline functions without re-registering.
export function useBackHandler(active, onBack) {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    if (!active) return undefined;
    return pushBackHandler(() => ref.current?.());
  }, [active]);
}
