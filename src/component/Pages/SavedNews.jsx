import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { FaBookmark, FaNewspaper, FaSearch } from "react-icons/fa";

const SavedNews = () => {
  const { currentUser, loading } = useAuth();
  const [savedArticles, setSavedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); // Default: newest first

  useEffect(() => {
    const fetchSavedArticles = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const q = query(
          collection(db, "savedArticles"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedArticles(articles);
      } catch (error) {
        console.error("Error fetching saved articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedArticles();
  }, [currentUser]);

  // Filter and sort articles
  const filteredArticles = savedArticles
    .filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      } else if (sortBy === "date-asc") {
        return a.savedAt.toDate().getTime() - b.savedAt.toDate().getTime();
      } else {
        // Default: date-desc
        return b.savedAt.toDate().getTime() - a.savedAt.toDate().getTime();
      }
    });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
          <FaBookmark className="text-4xl text-blue-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Berita Tersimpan</h1>
          <p className="text-gray-600 mb-4">Silakan masuk untuk melihat berita yang Anda simpan.</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Jelajahi Berita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 mb-6">
          <FaBookmark className="text-blue-500 text-2xl" />
          <h2 className="text-3xl font-extrabold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Berita Tersimpan
          </h2>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="search-bar flex items-center border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Cari berita berdasarkan judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select border border-gray-200 rounded-xl p-3 text-sm bg-white shadow-sm cursor-pointer"
          >
            <option value="date-desc">Terbaru</option>
            <option value="date-asc">Terlama</option>
            <option value="title-asc">Judul A-Z</option>
            <option value="title-desc">Judul Z-A</option>
          </select>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
            <FaNewspaper className="mx-auto text-gray-400 text-4xl mb-4 opacity-50" />
            <p className="text-gray-600 text-lg">
              {searchQuery ? "Tidak ada berita yang cocok dengan pencarian." : "Belum ada berita yang disimpan."}
            </p>
            <Link
              to="/"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Jelajahi Berita
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                to={`/berita/${article.articleId}`}
                className="article-card block bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animation: 'fadeIn 0.5s ease-out' }}
              >
                <img
                  src={article.imageUrl || "https://via.placeholder.com/400x200"}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{article.summary}</p>
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <span>{new Date(article.savedAt.toDate()).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .article-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        .search-bar {
          transition: box-shadow 0.3s ease;
        }

        .search-bar:hover {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .filter-select {
          transition: box-shadow 0.3s ease;
        }

        .filter-select:hover {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
};

export default SavedNews;
