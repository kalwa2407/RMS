import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, initializeAuth, indexedDBLocalPersistence, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: "AIzaSyBNWnChrD5s0Ky5rnKdtm9HQP2_179hmUQ",
  authDomain: "tasteofhindustanrms.firebaseapp.com",
  projectId: "tasteofhindustanrms",
  storageBucket: "tasteofhindustanrms.firebasestorage.app",
  messagingSenderId: "63332283509",
  appId: "1:63332283509:web:58f2f40f923507f5e8743c",
  measurementId: "G-LYPMR3D7QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
// In the native iOS/Android app (Capacitor WKWebView / WebView) getAuth() also loads the web
// popup/redirect resolver, which can stall auth initialization; signInWithCredential and
// getIdToken then never resolve and login gets stuck after the native sign-in succeeded.
// Native apps don't use popups, so initialize Auth with plain IndexedDB persistence there.
// The website keeps getAuth() (needed for the Google/Apple popup sign-in).
let auth;
if (Capacitor.isNativePlatform()) {
  try {
    auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
  } catch (e) {
    auth = getAuth(app); // already initialized (e.g. hot reload)
  }
} else {
  auth = getAuth(app);
}
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Apple OAuth Provider (App Store Guideline 4.8 Compliance)
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Safe analytics init
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app);
  }).catch(() => {});
}

export { app, auth, googleProvider, appleProvider, analytics };
