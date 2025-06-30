import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Load dotenv only in Node.js
if (typeof window === 'undefined') {
  import('dotenv').then((dotenv) => dotenv.config());
}

// Use environment variables based on context
const getEnv = (key) => {
  if (typeof window === 'undefined') {
    return process.env[key];
  }
  return import.meta.env[key];
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyB8wGcp5AKISq9aS5jXxSjCZj-47dFEBgw",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "neswaraclone.firebaseapp.com",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "neswaraclone",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "neswaraclone.appspot.com",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "797701469068",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "1:797701469068:web:7a42713f4d16361011dca9",
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || "G-WQDH156QV5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const usersRef = collection(db, "users");

export const listenToPosts = (callback) =>
  onSnapshot(collection(db, "posts"), callback);

export {
  app,
  auth,
  googleProvider,
  facebookProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  db,
  storage,
  usersRef,
};
