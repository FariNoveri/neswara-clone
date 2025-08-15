import React from "react";
import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./component/common/ErrorBoundary";
import Navbar from "./component/common/navbar";
import Footer from "./component/common/footer";
import NewsDetail from "./component/Pages/NewsDetail";
import NewsList from "./component/config/NewsList";
import Profile from "./component/common/profile";
import AdminDashboard from "./component/admin/AdminDashboard";
import SavedNews from "./component/Pages/SavedNews";
import SearchResult from "./component/Pages/SearchResult";
import NotFound from "./component/common/NotFound";
import NewsSection from "./component/common/newssection";
import HeroSection from "./component/common/herosection";
import NewsPage from "./component/common/newspage";
import LiveNewsSection from "./component/common/livenewsection";
import LatestNewsSection from "./component/common/latestnewsection";
import AllNews from "./component/AllNews/AllNews";
import SecurityMonitor from "./component/auth/SecurityMonitor";
import Nasional from "./component/Navigation/Nasional";
import Internasional from "./component/Navigation/Internasional";
import Olahraga from "./component/Navigation/Olahraga";
import Ekonomi from "./component/Navigation/Ekonomi";
import Teknologi from "./component/Navigation/Teknologi";
import Lifestyle from "./component/Navigation/Lifestyle";
import Daerah from "./component/Navigation/Daerah";
import Pendidikan from "./component/Navigation/Pendidikan";
import Kesehatan from "./component/Navigation/Kesehatan";
import Otomotif from "./component/Navigation/Otomotif";
import Wisata from "./component/Navigation/Wisata";
import Kuliner from "./component/Navigation/Kuliner";
import Entertainment from "./component/Navigation/Entertainment";
import Liked from "./component/Pages/Liked";
import CommentHistory from "./component/Pages/CommentHistory";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <SecurityMonitor />
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Homepage with multiple sections */}
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <div className="container mx-auto px-4">
                  <NewsSection />
                  <HeroSection />
                  <NewsPage />
                  <LiveNewsSection />
                  <LatestNewsSection />
                </div>
              </ErrorBoundary>
            }
          />
          {/* All news page */}
          <Route
            path="/allnews"
            element={
              <ErrorBoundary>
                <AllNews />
              </ErrorBoundary>
            }
          />
          {/* News detail page */}
          <Route
            path="/berita/:slug"
            element={
              <ErrorBoundary>
                <NewsDetail />
              </ErrorBoundary>
            }
          />
          {/* Profile page */}
          <Route
            path="/profile"
            element={
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            }
          />
          {/* Admin dashboard */}
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            }
          />
          {/* Saved news page */}
          <Route
            path="/saved"
            element={
              <ErrorBoundary>
                <SavedNews />
              </ErrorBoundary>
            }
          />
          {/* Search results page */}
          <Route
            path="/search"
            element={
              <ErrorBoundary>
                <SearchResult />
              </ErrorBoundary>
            }
          />
          {/* Category pages */}
          <Route
            path="/nasional"
            element={
              <ErrorBoundary>
                <Nasional />
              </ErrorBoundary>
            }
          />
          <Route
            path="/internasional"
            element={
              <ErrorBoundary>
                <Internasional />
              </ErrorBoundary>
            }
          />
          <Route
            path="/olahraga"
            element={
              <ErrorBoundary>
                <Olahraga />
              </ErrorBoundary>
            }
          />
          <Route
            path="/ekonomi"
            element={
              <ErrorBoundary>
                <Ekonomi />
              </ErrorBoundary>
            }
          />
          <Route
            path="/teknologi"
            element={
              <ErrorBoundary>
                <Teknologi />
              </ErrorBoundary>
            }
          />
          <Route
            path="/lifestyle"
            element={
              <ErrorBoundary>
                <Lifestyle />
              </ErrorBoundary>
            }
          />
          <Route
            path="/daerah"
            element={
              <ErrorBoundary>
                <Daerah />
              </ErrorBoundary>
            }
          />
          <Route
            path="/pendidikan"
            element={
              <ErrorBoundary>
                <Pendidikan />
              </ErrorBoundary>
            }
          />
          <Route
            path="/kesehatan"
            element={
              <ErrorBoundary>
                <Kesehatan />
              </ErrorBoundary>
            }
          />
          <Route
            path="/otomotif"
            element={
              <ErrorBoundary>
                <Otomotif />
              </ErrorBoundary>
            }
          />
          <Route
            path="/wisata"
            element={
              <ErrorBoundary>
                <Wisata />
              </ErrorBoundary>
            }
          />
          <Route
            path="/kuliner"
            element={
              <ErrorBoundary>
                <Kuliner />
              </ErrorBoundary>
            }
          />
          <Route
            path="/entertainment"
            element={
              <ErrorBoundary>
                <Entertainment />
              </ErrorBoundary>
            }
          />
          {/* Liked news page */}
          <Route
            path="/liked"
            element={
              <ErrorBoundary>
                <Liked />
              </ErrorBoundary>
            }
          />
          {/* Comment history page */}
          <Route
            path="/comment-history"
            element={
              <ErrorBoundary>
                <CommentHistory />
              </ErrorBoundary>
            }
          />
          {/* 404 Not Found page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      
      {/* Floating Overlay Components */}
    </div>
  );
};

export default App;
