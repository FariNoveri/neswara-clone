import { auth } from "../../firebaseconfig";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseconfig"; // Pastikan db diexport

// Fungsi register dengan email & password
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Sinkronisasi ke Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: userCredential.user.email.split('@')[0], // Default dari email
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      isAdmin: false, // Default, ubah sesuai kebutuhan
    }, { merge: true });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Fungsi login dengan email & password
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Fungsi logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Fungsi login dengan Google
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    // Sinkronisasi ke Firestore untuk Google login
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      isAdmin: false,
    }, { merge: true });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Fungsi login dengan Facebook
export const loginWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    // Sinkronisasi ke Firestore untuk Facebook login
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      isAdmin: false,
    }, { merge: true });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export default {
  registerUser,
  loginUser,
  loginWithGoogle,
  loginWithFacebook,
  logoutUser,
};