import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLh_Apm6Nz27Afe4WljZ91o1VIukcPBQw",
  authDomain: "openchat-x-h85uh.firebaseapp.com",
  projectId: "openchat-x-h85uh",
  storageBucket: "openchat-x-h85uh.firebasestorage.app",
  messagingSenderId: "698948381235",
  appId: "1:698948381235:web:6783386d458cf785a25146"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { app };