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
    return <div className="container mx-auto px-4 py-8">Memuat...</div>;
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Berita Tersimpan</h2>
        <p className="text-gray-600">Silakan masuk untuk melihat berita yang Anda simpan.</p>
        <Link
          to="/"
          className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            font-family: 'Inter', sans-serif;
          }

          .article-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .article-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          .search-bar {
            display: flex;
            align-items: center;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px;
            background: white;
            max-width: 500px;
          }

          .search-bar input {
            border: none;
            outline: none;
            flex: 1;
            font-size: 14px;
          }

          .filter-select {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px;
            font-size: 14px;
            background: white;
            cursor: pointer;
          }
        `}
      </style>

      <div className="flex items-center space-x-2 mb-6">
        <FaBookmark className="text-blue-500 text-2xl" />
        <h2 className="text-2xl font-bold text-gray-900">Berita Tersimpan</h2>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Cari berita berdasarkan judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          <option value="date-desc">Terbaru</option>
          <option value="date-asc">Terlama</option>
          <option value="title-asc">Judul A-Z</option>
          <option value="title-desc">Judul Z-A</option>
        </select>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <FaNewspaper className="mx-auto text-gray-400 text-4xl mb-4" />
          <p className="text-gray-600 text-lg">
            {searchQuery ? "Tidak ada berita yang cocok dengan pencarian." : "Belum ada berita yang disimpan."}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
          >
            Jelajahi Berita
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              to={`/berita/${article.articleId}`}
              className="article-card block bg-white rounded-lg shadow-md overflow-hidden"
            >
              <img
                src={article.imageUrl || "https://via.placeholder.com/400x200"}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{article.title}</h3>
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
  );
};

export default SavedNews;