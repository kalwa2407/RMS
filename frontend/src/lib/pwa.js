/**
 * PWA & Native Detection Utility
 * Detects whether the user opened the app via:
 * 1. Capacitor native app (Android / iOS native shell)
 * 2. iOS Safari "Add to Home Screen" (window.navigator.standalone === true)
 * 3. Modern browser standalone PWA (display-mode: standalone / fullscreen / minimal-ui)
 * 4. PWA query parameters (?source=pwa, ?mode=pwa, ?pwa=true)
 * 5. Android WebAPK / TWA (referrer: android-app://)
 */
export const isStandaloneApp = () => {
  if (typeof window === "undefined") return false;

  try {
    // 0. Injected app mode for Native Customer / Staff bundles (instant synchronous check)
    if (window.__RMS_APP_MODE__ === "customer" || window.__RMS_APP_MODE__ === "staff") {
      return true;
    }

    // 1. Capacitor Native Android / iOS wrapper
    if (
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform()
    ) {
      return true;
    }

    // 2. iOS Safari Standalone Mode ("Add to Home Screen")
    if (typeof window.navigator !== "undefined" && window.navigator.standalone === true) {
      return true;
    }

    // 3. W3C Standard display-mode media queries (Chrome, Safari 13+, Edge)
    if (typeof window.matchMedia === "function") {
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
      if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
    }

    // 4. URL query params (?source=pwa, ?mode=pwa, ?pwa=1)
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("source") === "pwa" ||
      params.get("mode") === "pwa" ||
      params.get("pwa") === "1" ||
      params.get("pwa") === "true"
    ) {
      return true;
    }

    // 5. Android WebAPK / referrer
    if (typeof document !== "undefined" && document.referrer && document.referrer.includes("android-app://")) {
      return true;
    }
  } catch (e) {
    console.warn("PWA detection error:", e);
    return false;
  }

  return false;
};

/**
 * Detects if the device is running iOS (iPhone, iPad, iPod)
 */
export const isIOSDevice = () => {
  if (typeof window === "undefined" || typeof window.navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};
