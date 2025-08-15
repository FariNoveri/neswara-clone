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
  setLogLevel,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ========= COMPLETE LOG SUPPRESSION =========

// 1. Set Firebase log level to silent (paling efektif)
setLogLevel('silent');

// 2. Override console methods untuk filter Firebase logs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  const message = args.join(' ');
  if (!message.includes('@firebase/firestore')) {
    originalConsoleWarn.apply(console, args);
  }
};

console.error = (...args) => {
  const message = args.join(' ');
  if (!message.includes('@firebase/firestore')) {
    originalConsoleError.apply(console, args);
  }
};

// 3. Disable Firebase debug mode
if (typeof window !== 'undefined') {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = false;
  
  // Override Firebase internal logger
  window.addEventListener('load', () => {
    setLogLevel('silent');
    
    // Additional suppression
    if (window.firebase) {
      window.firebase.firestore.setLogLevel('silent');
    }
  });
}

// Load dotenv (for SSR or Node.js environments)
if (typeof window === 'undefined') {
  import('dotenv').then((dotenv) => dotenv.config());
}

// Get env variable securely
const getEnv = (key) => {
  if (typeof window === 'undefined') {
    return process.env[key];
  }
  return import.meta.env[key];
};

// Validate environment variables
const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];

requiredKeys.forEach((key) => {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${key}`);
  }
});

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set log level again after initialization
setLogLevel('silent');

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Exports
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