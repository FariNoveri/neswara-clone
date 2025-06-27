import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Eye, Clock, User, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

// Update untuk LatestNewsSection.jsx - ganti /news menjadi /allnews
// Di baris 159, ubah:
// to="/news" 
// menjadi:
// to="/allnews"

const AllNews = () => {
  const [newsFromDB, setNewsFromDB] = useState([]);
  const [categorizedNews, setCategorizedNews] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const news = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().judul || doc.data().title || "Judul tidak tersedia",
          summary: doc.data().ringkasan || doc.data().summary || doc.data().konten?.substring(0, 100) + "..." || "Ringkasan tidak tersedia",
          image: doc.data().gambar || doc.data().image || "https://source.unsplash.com/600x400/?news",
          category: doc.data().kategori || doc.data().category || "Umum",
          author: doc.data().author || doc.data().authorName || "Admin",
          views: doc.data().views || 0,
          comments: doc.data().komentar || doc.data().comments || 0,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));
        
        setNewsFromDB(news);
        
        // Group news by category
        const grouped = news.reduce((acc, newsItem) => {
          const category = newsItem.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(newsItem);
          return acc;
        }, {});
        
        setCategorizedNews(grouped);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
      setLoading(false);
    };
    fetchNews();
  }, []);

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  // Scroll function for horizontal scrolling
  const scrollCategory = (categoryId, direction) => {
    const container = document.getElementById(`category-${categoryId}`);
    const scrollAmount = 300;
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat berita...</p>
        </div>
      </div>
    );
  }

  if (newsFromDB.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Tidak ada berita tersedia</h2>
          <p className="text-gray-600">Silakan coba lagi nanti</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Semua Berita</h1>
          <p className="text-gray-600 mt-2">Temukan berita terbaru dari berbagai kategori</p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.entries(categorizedNews).map(([category, categoryNews]) => (
          <div key={category} className="mb-12">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{category}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => scrollCategory(category.replace(/\s+/g, ''), 'left')}
                  className="p-2 rounded-full bg-white shadow hover:shadow-md transition-shadow"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => scrollCategory(category.replace(/\s+/g, ''), 'right')}
                  className="p-2 rounded-full bg-white shadow hover:shadow-md transition-shadow"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Scrollable News Cards */}
            <div
              id={`category-${category.replace(/\s+/g, '')}`}
              className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {categoryNews.map((news) => (
                <div
                  key={news.id}
                  className="flex-none w-80 bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative h-48">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => (e.target.src = "https://source.unsplash.com/600x400/?news")}
                    />
                    <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                      {news.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <Link to={`/berita/${news.id}`}>
                      <h3 className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                        {news.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{news.summary}</p>
                    <div className="flex items-center text-xs text-gray-500 gap-3">
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" aria-hidden="true" />
                        {news.author}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                        {formatTimeAgo(news.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 gap-3 mt-2">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" aria-hidden="true" />
                        {news.views}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                        {news.comments}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AllNews;