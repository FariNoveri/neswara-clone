import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup, // <-- Import signInWithPopup here
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB8wGcp5AKISq9aS5jXxSjCZj-47dFEBgw",
  authDomain: "neswaraclone.firebaseapp.com",
  projectId: "neswaraclone",
  storageBucket: "neswaraclone.appspot.com",
  messagingSenderId: "797701469068",
  appId: "1:797701469068:web:7a42713f4d16361011dca9",
  measurementId: "G-WQDH156QV5",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Inisialisasi Provider
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Ekspor variabel yang dibutuhkan
export { app, auth, googleProvider, facebookProvider, signInWithPopup, db, analytics };
