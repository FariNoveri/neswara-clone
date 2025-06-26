import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./component/common/navbar";
import Footer from "./component/common/footer";
import NewsSection from "./component/common/newssection";
import HeroSection from "./component/common/herosection";
import NewsPage from "./component/common/newspage";
import LiveNewsSection from "./component/common/livenewsection";
import LatestNewsSection from "./component/common/latestnewsection";
import Profile from "./component/common/profile";
import AdminDashboard from "./component/admin/AdminDashboard";
import NotFound from "./component/common/NotFound";
import NewsDetail from "./component/Pages/NewsDetail";
import SavedNews from "./component/Pages/SavedNews";
import SearchResult from "./component/Pages/SearchResult"; // Added import for SearchResult
import { AuthProvider } from "./component/auth/useAuth";
import DarkModeToggle from "./component/common/DarkModeToggle";
import { ToastContainer } from "react-toastify";
import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";
import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Maaf, ada masalah saat memuat halaman. Silakan coba lagi.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen transition-all">
          <Navbar />
          <DarkModeToggle />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick />
          <Routes>
            <Route
              path="/"
              element={
                <div className="container mx-auto px-4">
                  <NewsSection />
                  <HeroSection />
                  <NewsPage />
                  <LiveNewsSection />
                  <LatestNewsSection />
                </div>
              }
            />
            <Route
              path="/berita/:id"
              element={
                <ErrorBoundary>
                  <NewsDetail />
                </ErrorBoundary>
              }
            />
            <Route
              path="/profile"
              element={
                <ErrorBoundary>
                  <Profile />
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin"
              element={
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              }
            />
            <Route
              path="/saved"
              element={
                <ErrorBoundary>
                  <SavedNews />
                </ErrorBoundary>
              }
            />
            <Route
              path="/search"
              element={
                <ErrorBoundary>
                  <SearchResult />
                </ErrorBoundary>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;