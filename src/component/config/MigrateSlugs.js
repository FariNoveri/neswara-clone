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

// Only load dotenv in Node.js
if (typeof window === 'undefined') {
  import('dotenv').then((dotenv) => dotenv.config());
}

// Use import.meta.env for browser, process.env for Node.js
const firebaseConfig = {
  apiKey: typeof window === 'undefined' ? process.env.VITE_FIREBASE_API_KEY : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: typeof window === 'undefined' ? process.env.VITE_FIREBASE_AUTH_DOMAIN : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: typeof window === 'undefined' ? process.env.VITE_FIREBASE_PROJECT_ID : import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: typeof window === 'undefined' ? process.env.VITE_FIREBASE_STORAGE_BUCKET : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: typeof window === 'undefined' ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: typeof window === 'undefined' ? process.env.VITE_FIREBASE_APP_ID : import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: typeof window === 'undefined' ? process.env.VITE_FIREBASE_MEASUREMENT_ID : import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
