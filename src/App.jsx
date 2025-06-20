import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Komponen publik
import Navbar from "./component/navbar";
import NewsSection from "./component/newssection";
import HeroSection from "./component/herosection";
import LiveNewsSection from "./component/livenewsection";
import LatestNewsSection from "./component/latestnewsection";
import Footer from "./component/footer";
import Article from "./component/newsarticle";
import Profile from "./component/profile";

// Komponen admin (cuma 1)
import AdminDashboard from "./component/admin/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Utama */}
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

        {/* Profil Pengguna */}
        <Route path="/profile" element={<Profile />} />

        {/* Halaman Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
