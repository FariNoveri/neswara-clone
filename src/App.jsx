import React from "react";
import Navbar from "./component/navbar";
import NewsSection from "./component/newssection";
import HeroSection from "./component/herosection";
import LiveNewsSection from "./component/livenewsection";
import LatestNewsSection from "./component/latestnewsection";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./component/footer";
import Article from "./component/newsarticle";
import { auth } from "./firebaseconfig"; // Pastikan auth di-import
import { registerUser, loginUser, loginWithGoogle, loginWithFacebook, logoutUser } from "./component/auth";
import { NavbarAtomicDesign } from "./component/atomicdesign/navbar/organisms";
import * as Atoms from "./component/atomicdesign/navbar/atoms";
import * as Molecules from "./component/atomicdesign/navbar/molecules";
import * as Organisms from "./component/atomicdesign/navbar/organisms"; // Perbaiki menjadi *

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman utama */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <NewsSection />
              <HeroSection />
              <LiveNewsSection />
              <LatestNewsSection />
              <Footer />
            </>
          }
        />

        {/* Halaman Atomic Design */}
        <Route path="/atomicdesign" element={<NavbarAtomicDesign />} />
        <Route path="/atomicdesign/atoms" element={<Atoms.Button />} /> {/* Pastikan Button memiliki default export */}
        <Route path="/atomicdesign/molecules" element={<Molecules.SearchBar />} />
        <Route path="/atomicdesign/organisms" element={<Organisms.NavbarAtomicDesign />} />
      </Routes>
    </Router>
  );
}

export default App;
