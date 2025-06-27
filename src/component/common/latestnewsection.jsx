import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Clock, User, MessageCircle } from "lucide-react";

const LatestNewsSection = () => {
  const [newsFromDB, setNewsFromDB] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(9));
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

  if (loading) {
    return (
      <div className="text-center py-12 bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Memuat berita...</p>
      </div>
    );
  }

  if (newsFromDB.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="text-5xl mb-4">📰</div>
        <p className="text-gray-600">Tidak ada berita tersedia</p>
      </div>
    );
  }

  return (
    <section className="w-full bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Berita Terbaru</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsFromDB.slice(0, 3).map((news, index) => (
            <div key={news.id}>
              {/* Main News Card */}
              <article className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => (e.target.src = "https://source.unsplash.com/600x400/?news")}
                  />
                  <span className="absolute top-2 left-2 border border-blue-600 text-blue-600 bg-white/80 text-xs px-2 py-1 rounded font-medium">
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
              </article>

              {/* Additional News */}
              <div className="mt-4 space-y-3">
                {newsFromDB.slice(3 + index * 2, 5 + index * 2).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 pb-2 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/berita/${item.id}`)}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      loading="lazy"
                      onError={(e) => (e.target.src = "https://source.unsplash.com/600x400/?news")}
                    />
                    <div className="flex-1">
                      <Link to={`/berita/${item.id}`}>
                        <p className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
                          {item.title}
                        </p>
                      </Link>
                      <span className="text-xs text-gray-500 block mt-1">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/allnews"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Lihat Semua Berita
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestNewsSection;