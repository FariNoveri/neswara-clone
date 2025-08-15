import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Search, Trash2, ArrowLeft, Newspaper } from "lucide-react";
import { ADMIN_EMAILS } from "../config/Constants";
import { toast } from "react-toastify";

const SavedNews = () => {
  const { currentUser, loading } = useAuth();
  const [savedArticles, setSavedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedArticles = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const q = query(
          collection(db, "savedArticles"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const articles = await Promise.all(
          snapshot.docs.map(async (savedDoc) => {
            const savedData = { id: savedDoc.id, ...savedDoc.data() };
            // Fetch corresponding news article to get slug
            const newsDoc = await getDoc(doc(db, "news", savedData.articleId));
            if (newsDoc.exists()) {
              const newsData = newsDoc.data();
              return {
                ...savedData,
                slug: newsData.slug || newsData.judul || newsData.title || savedData.title,
                imageUrl: savedData.imageUrl || newsData.gambar || "https://via.placeholder.com/400x200",
                summary: savedData.summary || newsData.ringkasan || newsData.konten?.replace(/<[^>]+>/g, "").substring(0, 100) + "...",
                category: newsData.kategori || "Berita",
              };
            } else {
              console.warn(`News article not found for saved article ID: ${savedData.articleId}`);
              return null; // Handle deleted news articles
            }
          })
        );
        // Filter out null entries (deleted news articles)
        setSavedArticles(articles.filter((article) => article !== null));
      } catch (error) {
        console.error("Error fetching saved articles:", error);
        setError("Gagal memuat berita tersimpan: " + error.message);
        toast.error("Gagal memuat berita tersimpan.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedArticles();
  }, [currentUser]);

  const handleUnsave = async (articleId, title) => {
    if (!currentUser) {
      setError("Silakan login untuk menghapus berita tersimpan.");
      toast.error("Silakan login untuk menghapus berita tersimpan.");
      return;
    }

    if (!window.confirm("Yakin ingin menghapus berita ini dari daftar tersimpan?")) return;

    try {
      const articleDoc = doc(db, "savedArticles", articleId);
      await deleteDoc(articleDoc);

      // Log UNSAVE_NEWS action
      const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
      await addDoc(collection(db, "logs"), {
        action: "UNSAVE_NEWS",
        userEmail: currentUser.email || "unknown@example.com",
        details: {
          articleId,
          title,
          isAdmin,
        },
        timestamp: new Date(),
      });

      // Update local state
      setSavedArticles((prev) => prev.filter((article) => article.id !== articleId));
      toast.success("Berita berhasil dihapus dari daftar tersimpan.", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error unsaving article:", error);
      setError("Gagal menghapus berita tersimpan: " + error.message);
      toast.error("Gagal menghapus berita tersimpan: " + error.message);
    }
  };

  // Filter and sort articles
  const filteredArticles = savedArticles
    .filter((article) =>
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

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 w-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="h-12 w-48 bg-white/10 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white/10 rounded-2xl shadow-lg animate-pulse">
              <div className="h-48 bg-white/20 rounded-t-2xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-white/20 rounded"></div>
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading || isLoading) {
    return <LoadingSkeleton />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform animate-scaleIn">
          <Bookmark className="text-4xl text-purple-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Berita Tersimpan</h1>
          <p className="text-white/80 mb-4">Silakan masuk untuk melihat berita yang Anda simpan.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:scale-105 transform shadow-lg"
          >
            Jelajahi Berita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: "20s" }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/profile")}
            className="group flex items-center text-white/70 hover:text-white transition-all duration-300 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Kembali ke Profil
          </button>
          <div className="text-right">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Berita Tersimpan
            </h1>
            <p className="text-white/60 mt-1">Lihat dan kelola berita yang Anda simpan</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              {error}
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500 animate-slideUp mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Search className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Cari & Urutkan</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 transition-colors duration-200 group-focus-within:text-purple-400" />
              <input
                type="text"
                placeholder="Cari berita berdasarkan judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 w-full"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 cursor-pointer"
            >
              <option value="date-desc">Terbaru</option>
              <option value="date-asc">Terlama</option>
              <option value="title-asc">Judul A-Z</option>
              <option value="title-desc">Judul Z-A</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/60 mt-6">
            <Newspaper className="w-4 h-4" />
            <span>Menampilkan {filteredArticles.length} dari {savedArticles.length} berita</span>
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform animate-scaleIn">
            <Newspaper className="mx-auto text-white/40 text-4xl mb-4 opacity-50" />
            <p className="text-white/80 text-lg">
              {searchQuery ? "Tidak ada berita yang cocok dengan pencarian." : "Belum ada berita yang disimpan."}
            </p>
            <Link
              to="/"
              className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:scale-105 transform shadow-lg"
            >
              Jelajahi Berita
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <div
                key={article.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link to={`/berita/${article.slug}`}>
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x200";
                        console.warn(`Failed to load image for saved article ID: ${article.id}`);
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">{article.title}</h3>
                    <p className="text-white/80 text-sm mt-2 line-clamp-3">{article.summary}</p>
                    <div className="mt-3 flex items-center text-xs text-white/60">
                      <span>
                        {new Date(article.savedAt.toDate()).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleUnsave(article.id, article.title)}
                    className="flex items-center text-red-400 hover:text-red-500 text-sm font-medium transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-in {
          animation-fill-mode: forwards;
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
      `}</style>
    </div>
  );
};

export default SavedNews;
