import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

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
const auth = getAuth(app);
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
