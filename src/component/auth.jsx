import { auth } from "../firebaseconfig";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// Fungsi register dengan email & password
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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

// Fungsi logout (hapus duplikasi!)
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
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

import React from "react";
import Navbar from "./navbar";
import NewsSection from "./newssection";
import HeroSection from "./herosection";
import LiveNewsSection from "./livenewsection";
import LatestNewsSection from "./latestnewsection";
import Footer from "./footer";
import Article from "./newsarticle";


function App() {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <Navbar />
      <NewsSection />
      <HeroSection />
      <Article />
      <LiveNewsSection />
      <LatestNewsSection />
      <Footer />
    </div>
  );
}

const authFunctions = {
  registerUser,
  loginUser,
  loginWithGoogle,
  loginWithFacebook,
  logoutUser,
};

export default App;

