import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDDxqwv-8MvlaxGGBx6cSF5bvyo96uyb1U",
  authDomain: "tasteofhindustansystem.firebaseapp.com",
  projectId: "tasteofhindustansystem",
  storageBucket: "tasteofhindustansystem.firebasestorage.app",
  messagingSenderId: "493733365264",
  appId: "1:493733365264:web:66d894d38d18f2c83e2c95",
  measurementId: "G-P3YKWVPFW7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
