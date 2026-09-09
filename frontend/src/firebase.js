import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

const firebaseConfig = {
  apiKey: "AIzaSyBNWnChrD5s0Ky5rnKdtm9HQP2_179hmUQ",
  authDomain: isLocal ? "tasteofhindustanrms.firebaseapp.com" : "persiandarbar.in",
  projectId: "tasteofhindustanrms",
  storageBucket: "tasteofhindustanrms.firebasestorage.app",
  messagingSenderId: "63332283509",
  appId: "1:63332283509:web:58f2f40f923507f5e8743c",
  measurementId: "G-LYPMR3D7QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe analytics init
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app);
  }).catch(() => {});
}

export { app, auth, googleProvider, analytics };
