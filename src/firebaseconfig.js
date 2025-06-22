import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail, // Tambahkan ini
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Optional: Referensi koleksi
const usersRef = collection(db, "users");

// Opsional: Fungsi untuk mendengarkan koleksi 'posts'
export const listenToPosts = (callback) =>
  onSnapshot(collection(db, "posts"), callback);

// Ekspor variabel yang dibutuhkan
export {
  app,
  auth,
  googleProvider,
  facebookProvider,
  signInWithPopup,
  sendPasswordResetEmail, // Tambahkan ini juga
  db,
  storage,
  usersRef,
};