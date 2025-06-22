import React, { useState, useEffect } from "react";
import { Clock, User, MessageCircle, Eye } from "lucide-react";
import { db } from "../firebaseconfig";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

const NewsPage = () => {
  const [newsData, setNewsData] = useState([]);
  const [popularNews, setPopularNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const postsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(10));
    const popularQuery = query(collection(db, "news"), orderBy("views", "desc"), limit(4));

    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || doc.data().judul || "Judul tidak tersedia",
          summary: doc.data().summary || doc.data().ringkasan || doc.data().konten?.substring(0, 150) + "..." || "Ringkasan tidak tersedia",
          image: doc.data().imageUrl || doc.data().image || doc.data().gambar || "https://source.unsplash.com/600x400/?news",
          category: doc.data().category || doc.data().kategori || "Umum",
          author: doc.data().author || doc.data().authorName || "Admin",
          views: doc.data().views || 0,
          comments: doc.data().comments || doc.data().komentar || 0,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          featured: doc.data().featured || false,
        }));
        setNewsData(posts);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching posts:", err);
        setError("Gagal memuat berita");
        setLoading(false);
      }
    );

    const unsubscribePopular = onSnapshot(
      popularQuery,
      (snapshot) => {
        const popular = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || doc.data().judul || "Judul tidak tersedia",
          views: doc.data().views || 0,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));
        setPopularNews(popular);
      },
      (err) => console.error("Error fetching popular news:", err)
    );

    return () => {
      unsubscribePosts();
      unsubscribePopular();
    };
  }, []);

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

  const getCategoryColor = (category) => {
    const colors = {
      PEMERINTAHAN: "border-blue-600 text-blue-600",
      BERITA: "border-green-600 text-green-600",
      KEAMANAN: "border-red-600 text-red-600",
      KESEHATAN: "border-purple-600 text-purple-600",
      TEKNOLOGI: "border-indigo-600 text-indigo-600",
      OLAHRAGA: "border-yellow-600 text-yellow-600",
      EKONOMI: "border-teal-600 text-teal-600",
      POLITIK: "border-pink-600 text-pink-600",
    };
    return colors[category?.toUpperCase()] || "border-gray-600 text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat berita...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Semua Berita</h2>
              <span className="text-sm text-gray-500">{newsData.length} berita</span>
            </div>
            {newsData.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-5xl mb-4">📰</div>
                <p className="text-gray-600">Belum ada berita tersedia</p>
              </div>
            ) : (
              <div className="space-y-6">
                {newsData.map((news, index) => (
                  <article
                    key={news.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row"
                  >
                    <div className="md:w-40 h-40 flex-shrink-0 relative overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-t-none">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => (e.target.src = "https://source.unsplash.com/600x400/?news")}
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-center mb-2 space-x-2">
                        <span className={`border ${getCategoryColor(news.category)} text-xs px-2 py-1 rounded font-medium`}>
                          {news.category}
                        </span>
                        {index === 0 && (
                          <span className="border border-red-600 text-red-600 text-xs px-2 py-1 rounded font-medium">
                            Terbaru
                          </span>
                        )}
                        {news.featured && (
                          <span className="border border-yellow-600 text-yellow-600 text-xs px-2 py-1 rounded font-medium">
                            Unggulan
                          </span>
                        )}
                      </div>
                      <Link to={`/berita/${news.id}`}>
                        <h2 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                          {news.title}
                        </h2>
                      </Link>
                      {news.summary && (
                        <p className="text-base text-gray-600 mb-4 line-clamp-2">{news.summary}</p>
                      )}
                      <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" aria-hidden="true" />
                          {news.author}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                          {formatTimeAgo(news.createdAt)}
                        </span>
                        {news.comments > 0 && (
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                            {news.comments}
                          </span>
                        )}
                        {news.views > 0 && (
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
                            {news.views}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                <button
                  className="w-full mt-6 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  onClick={() => navigate("/news/more")} // Placeholder untuk pagination
                >
                  Muat Lebih Banyak
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Popular News */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Berita Populer</h3>
              {popularNews.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm text-gray-600">Belum ada berita populer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {popularNews.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Eye className="w-3 h-3 mr-1" aria-hidden="true" />
                          {item.views}
                        </span>
                      </div>
                      <Link to={`/berita/${item.id}`}>
                        <h4 className="text-base font-bold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                      </Link>
                      <div className="text-xs text-gray-500 mt-2">{formatTimeAgo(item.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter (ganti sponsor) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Langganan Newsletter</h3>
              <p className="text-sm text-gray-600 mb-4">Dapatkan berita terbaru langsung di inbox Anda.</p>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  className="w-full border border-gray-200 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => e.target.value}
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all duration-200">
                Subscribe Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;