import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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
const analytics = getAnalytics(app);

export { app, analytics };
