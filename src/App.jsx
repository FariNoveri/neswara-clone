import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./component/navbar";
import Footer from "./component/footer";
import NewsSection from "./component/newssection";
import HeroSection from "./component/herosection";
import NewsPage from "./component/newspage";
import LiveNewsSection from "./component/livenewsection";
import LatestNewsSection from "./component/latestnewsection";
import Profile from "./component/profile";
import AdminDashboard from "./component/admin/AdminDashboard";
import ViewBerita from "./component/view/ViewBerita";
import NotFound from "./component/NotFound";
import NewsDetail from "./component/Pages/NewsDetail";
import { AuthProvider } from "./component/Hooks/useAuth";
import "react-quill/dist/quill.snow.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <NewsSection />
                <HeroSection />
                <NewsPage />
                <LiveNewsSection />
                <LatestNewsSection />
              </>
            }
          />
          <Route path="/berita/:id" element={<NewsDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
