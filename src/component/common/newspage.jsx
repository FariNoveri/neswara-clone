import React, { useState, useEffect } from "react";
import { Clock, User, MessageCircle, Eye, TrendingUp, Mail, ArrowRight } from "lucide-react";
import { db } from "../../firebaseconfig";
import { collection, onSnapshot, query, orderBy, limit, getDocs, collectionGroup, doc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../auth/useAuth";

const createSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
};

const countCommentsForNews = async (newsId, user) => {
  if (!newsId) {
    console.warn(`News ID is invalid at ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`);
    return 0;
  }

  try {
    const newsRef = doc(db, "news", newsId);
    const newsDoc = await getDoc(newsRef);
    if (!newsDoc.exists()) {
      console.warn(`News document ${newsId} does not exist at ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`);
      return 0;
    }

    const newsData = newsDoc.data();
    if (newsData.comments && typeof newsData.comments === 'number') {
      return newsData.comments; // Use stored comment count if available
    }

    if (!user || !user.uid) {
      return 0; // Return 0 for unauthenticated users to avoid permission issues
    }

    const commentsRef = collection(db, `news/${newsId}/comments`);
    const snapshot = await getDocs(commentsRef);
    let total = snapshot.size;

    const replyPromises = snapshot.docs.map(async (docSnapshot) => {
      try {
        const repliesRef = collection(db, `news/${newsId}/comments/${docSnapshot.id}/replies`);
        const repliesSnapshot = await getDocs(repliesRef);
        return repliesSnapshot.size;
      } catch (replyError) {
        console.warn(`Failed to count replies for comment ${docSnapshot.id}:`, replyError);
        return 0;
      }
    });

    const repliesCounts = await Promise.all(replyPromises);
    total += repliesCounts.reduce((sum, count) => sum + count, 0);
    return total;
  } catch (error) {
    console.error(`Error counting comments for news ${newsId}:`, error);
    if (error.code === "permission-denied") {
      if (!window.shownPermissionErrors?.has(newsId)) {
        window.shownPermissionErrors = window.shownPermissionErrors || new Set();
        toast.warn(`Tidak dapat mengakses komentar. Silakan login untuk melihat komentar.`, {
          position: "top-center",
          autoClose: 5000,
          toastId: `comment-permission-error-${newsId}`,
        });
        window.shownPermissionErrors.add(newsId);
      }
    } else {
      toast.error("Gagal memuat jumlah komentar.", {
        position: "top-center",
        autoClose: 3000,
        toastId: `comment-error-${newsId}`,
      });
    }
    return 0;
  }
};

const debugComments = async () => {
  try {
    const commentsQuery = query(collectionGroup(db, "comments"));
    const snapshot = await getDocs(commentsQuery);
    const commentsByNews = {};
    const replyPromises = [];

    snapshot.forEach((doc) => {
      const newsId = doc.ref.path.split("/")[1];
      commentsByNews[newsId] = (commentsByNews[newsId] || 0) + 1;
      const repliesRef = collection(db, `news/${newsId}/comments/${doc.id}/replies`);
      replyPromises.push(
        getDocs(repliesRef).then((repliesSnapshot) => {
          commentsByNews[newsId] += repliesSnapshot.size;
        })
      );
    });

    await Promise.all(replyPromises);
    console.log("Debug comments result:", commentsByNews);
    return commentsByNews;
  } catch (error) {
    console.error("Error debugging comments:", error);
    return {};
  }
};

const NewsPage = () => {
  const { currentUser } = useAuth();
  const [newsData, setNewsData] = useState([]);
  const [popularNews, setPopularNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);

    const postsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(4));
    const popularQuery = query(collection(db, "news"), orderBy("views", "desc"), limit(5));

    const unsubscribePosts = onSnapshot(
      postsQuery,
      async (snapshot) => {
        try {
          const postsPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const commentCount = await countCommentsForNews(doc.id, currentUser);
            return {
              id: doc.id,
              title: data.title || data.judul || "Judul tidak tersedia",
              summary:
                data.summary ||
                data.ringkasan ||
                data.konten?.substring(0, 150) + "..." ||
                "Ringkasan tidak tersedia",
              image:
                data.imageUrl ||
                data.image ||
                data.gambar ||
                "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&auto=format",
              category: data.category || data.kategori || "Umum",
              author: data.author || data.authorName || "Admin",
              views: data.views || 0,
              comments: commentCount,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              featured: data.featured || false,
              slug: data.slug || createSlug(data.judul || data.title || "untitled"),
            };
          });
          const posts = await Promise.all(postsPromises);
          setNewsData(posts);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching posts:", err);
          setError("Gagal memuat berita");
          setLoading(false);
          toast.error("Gagal memuat berita.", {
            position: "top-center",
            autoClose: 3000,
            toastId: "posts-error",
          });
        }
      },
      (err) => {
        console.error("Error in posts snapshot:", err);
        setError("Gagal memuat pembaruan berita");
        setLoading(false);
        toast.error("Gagal memuat pembaruan berita.", {
          position: "top-center",
          autoClose: 3000,
          toastId: "posts-snapshot-error",
        });
      }
    );

    const unsubscribePopular = onSnapshot(
      popularQuery,
      async (snapshot) => {
        try {
          const popularPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const commentCount = await countCommentsForNews(doc.id, currentUser);
            return {
              id: doc.id,
              title: data.title || data.judul || "Judul tidak tersedia",
              views: data.views || 0,
              comments: commentCount,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              slug: data.slug || createSlug(data.judul || data.title || "untitled"),
            };
          });
          const popular = await Promise.all(popularPromises);
          setPopularNews(popular);
        } catch (err) {
          console.error("Error fetching popular news:", err);
          toast.error("Gagal memuat berita populer.", {
            position: "top-center",
            autoClose: 3000,
            toastId: "popular-news-error",
          });
        }
      },
      (err) => {
        console.error("Error in popular news snapshot:", err);
        toast.error("Gagal memuat pembaruan berita populer.", {
          position: "top-center",
          autoClose: 3000,
          toastId: "popular-news-snapshot-error",
        });
      }
    );

    return () => {
      unsubscribePosts();
      unsubscribePopular();
    };
  }, []); // No dependencies to ensure immediate fetch

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
      PEMERINTAHAN: "bg-blue-100 text-blue-700 border-blue-200",
      BERITA: "bg-green-100 text-green-700 border-green-200",
      KEAMANAN: "bg-red-100 text-red-700 border-red-200",
      KESEHATAN: "bg-purple-100 text-purple-700 border-purple-200",
      TEKNOLOGI: "bg-indigo-100 text-indigo-700 border-indigo-200",
      OLAHRAGA: "bg-yellow-100 text-yellow-700 border-yellow-200",
      EKONOMI: "bg-teal-100 text-teal-700 border-teal-200",
      POLITIK: "bg-pink-100 text-pink-700 border-pink-200",
    };
    return colors[category?.toUpperCase()] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const handleImageError = (newsId) => {
    setImageErrors((prev) => ({ ...prev, [newsId]: true }));
  };

  const getImageSrc = (news) => {
    if (imageErrors[news.id]) {
      return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&auto=format`;
    }
    return news.image || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&auto=format`;
  };

  const handleSubscribe = () => {
    if (email) {
      toast.success(`Terima kasih! Anda telah berlangganan dengan email: ${email}`, {
        position: "top-center",
        autoClose: 3000,
      });
      setEmail("");
    } else {
      toast.warn("Silakan masukkan email Anda", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleDebugComments = () => {
    debugComments().catch((err) => console.error("Failed to debug comments:", err));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Memuat berita terbaru...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 mb-6 text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            <span className="text-blue-600">Berita Terkini</span>
          </h1>
          <p className="text-gray-600 text-lg">Jelajahi informasi terbaru hari ini</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
                Semua Berita
              </h2>
            </div>

            {newsData.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <div className="text-8xl mb-6">📰</div>
                <p className="text-gray-600 text-lg">Belum ada berita tersedia</p>
              </div>
            ) : (
              <div className="space-y-8">
                {newsData.map((news, index) => (
                  <article
                    key={news.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-80 h-64 md:h-56 flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                        <img
                          src={getImageSrc(news)}
                          alt={news.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                          onError={() => handleImageError(news.id)}
                        />
                        <div className="absolute top-4 left-4 z-20">
                          <span className={`${getCategoryColor(news.category)} text-xs px-3 py-1.5 rounded-full font-semibold border backdrop-blur-sm`}>
                            {news.category}
                          </span>
                        </div>
                        {news.featured && (
                          <div className="absolute top-4 right-4 z-20">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                              ✨ Unggulan
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-8">
                        <div className="flex items-center mb-4 space-x-3">
                          {index === 0 && (
                            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md">
                              🔥 Terbaru
                            </span>
                          )}
                        </div>

                        <Link to={`/berita/${news.slug}`} onClick={() => console.log(`Navigating to: /berita/${news.slug}`)}>
                          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-4 line-clamp-2 cursor-pointer">
                            {news.title}
                          </h2>
                        </Link>

                        {news.summary && (
                          <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                            {news.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-6">
                          <span className="flex items-center hover:text-blue-600 transition-colors">
                            <User className="w-4 h-4 mr-2" />
                            {news.author}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatTimeAgo(news.createdAt)}
                          </span>
                          {news.views > 0 && (
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" />
                              {news.views.toLocaleString()}
                            </span>
                          )}
                          {news.comments > 0 && (
                            <span className="flex items-center">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              {news.comments}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/berita/${news.slug}`}
                          className="mt-6 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors group"
                        >
                          Baca Selengkapnya
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}

                <div className="text-center">
                  <button
                    onClick={() => navigate("/allnews")}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center mx-auto"
                  >
                    Muat Lebih Banyak
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-red-500" />
                Berita Populer
              </h3>
              {popularNews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-600">Belum ada berita populer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {popularNews.map((item, index) => (
                    <div
                      key={item.id}
                      className="group p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center bg-gray-100 px-2 py-1 rounded-full">
                          <Eye className="w-3 h-3 mr-1" />
                          {item.views.toLocaleString()}
                        </span>
                      </div>
                      <Link to={`/berita/${item.slug}`} onClick={() => console.log(`Navigating to: /berita/${item.slug}`)}>
                        <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {item.title}
                        </h4>
                      </Link>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(item.createdAt)}
                      </div>
                      {item.comments > 0 && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {item.comments}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="text-center mb-6">
                <Mail className="w-12 h-12 mx-auto mb-4 text-blue-100" />
                <h3 className="text-2xl font-bold mb-2">Langganan Newsletter</h3>
                <p className="text-blue-100">Dapatkan berita terbaru langsung di inbox Anda</p>
              </div>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300"
                />
                <button
                  onClick={handleSubscribe}
                  className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Subscribe Sekarang
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Statistik Hari Ini</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Total Berita</span>
                  <span className="font-bold text-blue-600">{newsData.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-bold text-green-600">
                    {newsData.reduce((sum, news) => sum + (news.views || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-600">Total Komentar</span>
                  <span className="font-bold text-purple-600">
                    {newsData.reduce((sum, news) => sum + (news.comments || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;