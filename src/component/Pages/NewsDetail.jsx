import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { doc, getDoc, updateDoc, increment, collection, onSnapshot, query, where, addDoc, serverTimestamp, orderBy, deleteDoc, getDocs, setDoc } from "firebase/firestore";
import LikeButton from "./LikeButton";
import CommentBox from "./CommentBox";
import { useAuth } from "../auth/useAuth";
import { ArrowLeft, Eye, User, Calendar, Share2, Bookmark } from "lucide-react";
import { toast } from "react-toastify";

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [userLiked, setUserLiked] = useState(false);

  console.log("NewsDetail - currentUser:", currentUser, "newsId:", id);

  useEffect(() => {
    const fetchNews = async () => {
      if (!id) {
        setError("ID berita tidak valid.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "news", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log("Fetched news data:", data);
          setNews({
            id: snapshot.id,
            ...data,
            title: data.judul || "Tanpa Judul",
            content: data.konten || "Konten belum ditulis.",
            image: data.gambar || null,
            imageDescription: data.gambarDeskripsi || "Gambar utama",
            views: data.views || 0,
          });
          if (currentUser) {
            try {
              await updateDoc(docRef, { views: increment(1) });
              console.log("Views incremented successfully");
            } catch (updateErr) {
              console.error("Error updating views:", updateErr.message, updateErr.code);
              toast.error("Gagal memperbarui jumlah tampilan.");
            }
          } else {
            console.log("Skipping views update: User not authenticated");
          }
        } else {
          setError("Berita tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching news:", err.message, err.code);
        setError("Gagal memuat berita. Silakan coba lagi.");
        toast.error("Gagal memuat berita.");
      }
      setLoading(false);
    };

    const checkBookmark = async () => {
      if (!currentUser || !id) return;
      try {
        const q = query(
          collection(db, "savedArticles"),
          where("userId", "==", currentUser.uid),
          where("articleId", "==", id)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsBookmarked(true);
          setBookmarkId(snapshot.docs[0].id);
        }
      } catch (err) {
        console.error("Error checking bookmark:", err.message, err.code);
        toast.error("Gagal memeriksa status bookmark.");
      }
    };

    const unsubscribeLikes = onSnapshot(
      query(collection(db, "news", id, "likes")),
      (snapshot) => {
        setLikeCount(snapshot.size);
        if (currentUser) {
          const userLike = snapshot.docs.find(doc => doc.data().userId === currentUser.uid);
          setUserLiked(!!userLike);
        }
      },
      (err) => {
        console.error("Error fetching likes:", err.message, err.code);
        toast.error("Gagal memuat jumlah suka.");
      }
    );

    const unsubscribeComments = onSnapshot(
      query(collection(db, "news", id, "comments"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Error fetching comments:", error.message, error.code);
        const fallbackQuery = onSnapshot(
          query(collection(db, "news", id, "comments"), orderBy("timestamp", "desc")),
          (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (fallbackErr) => {
            console.error("Error in fallback comments query:", fallbackErr.message, fallbackErr.code);
            toast.error("Gagal memuat komentar.");
          }
        );
        return fallbackQuery;
      }
    );

    fetchNews();
    checkBookmark();

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [id, currentUser]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          url: window.location.href,
        });
        toast.success("Berita dibagikan!");
      } catch (err) {
        console.log("Error sharing:", err);
        toast.error("Gagal membagikan berita.");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link berita disalin ke clipboard!");
    }
  };

  const toggleBookmark = async () => {
    if (!currentUser) {
      toast.warn("Silakan masuk untuk menyimpan artikel.");
      return;
    }

    if (isBookmarked) {
      try {
        await deleteDoc(doc(db, "savedArticles", bookmarkId));
        setIsBookmarked(false);
        setBookmarkId(null);
        toast.success("Bookmark dihapus!");
      } catch (err) {
        console.error("Error removing bookmark:", err.message, err.code);
        toast.error("Gagal menghapus bookmark.");
      }
    } else {
      try {
        const bookmarkRef = await addDoc(collection(db, "savedArticles"), {
          userId: currentUser.uid,
          articleId: id,
          title: news.title,
          summary: news.content ? news.content.replace(/<[^>]+>/g, '').substring(0, 200) : "No summary available",
          imageUrl: news.image || "https://via.placeholder.com/400x200",
          savedAt: serverTimestamp(),
        });
        setIsBookmarked(true);
        setBookmarkId(bookmarkRef.id);
        toast.success("Artikel disimpan!");
      } catch (err) {
        console.error("Error adding bookmark:", err.message, err.code);
        toast.error("Gagal menyimpan artikel.");
      }
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.warn("Silakan masuk untuk menyukai berita.");
      return false;
    }
    try {
      const likeRef = doc(db, "news", id, "likes", currentUser.uid);
      if (userLiked) {
        // Unlike: Delete the like document
        await deleteDoc(likeRef);
      } else {
        // Like: Create the like document
        await setDoc(likeRef, {
          userId: currentUser.uid,
          timestamp: serverTimestamp(),
        });
      }
      return true;
    } catch (err) {
      console.error("Error toggling like:", err.message, err.code);
      toast.error("Gagal mengubah status suka.");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Memuat berita...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Oops!</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Berita tidak ditemukan</h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">
      <div className="sticky top-0 z-20 bg-white shadow-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Kembali</span>
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-full transition-all ${
                  isBookmarked
                    ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {news.image && (
        <div className="w-full py-8 mt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="relative w-full bg-slate-200 rounded-2xl overflow-hidden shadow-lg" 
                 style={{ aspectRatio: '16/9' }}>
              <img
                src={news.image}
                alt={news.imageDescription}
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{ 
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className={`${news.image ? "bg-white" : "bg-gradient-to-r from-blue-600 to-purple-700"} py-8 md:py-12`}>
        <div className="max-w-4xl mx-auto px-4">
          <h1
            className={`text-3xl md:text-5xl font-bold mb-6 leading-tight break-words hyphens-auto ${
              news.image ? "text-slate-800" : "text-white"
            }`}
            style={{ 
              wordWrap: "break-word",
              overflowWrap: "break-word",
              wordBreak: "break-word"
            }}
          >
            {news.title}
          </h1>
          <div className={`flex flex-wrap items-center gap-4 md:gap-6 ${news.image ? "text-slate-600" : "text-white/90"}`}>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium break-words">{news.author || "Admin"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{news.views || 0} views</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{new Date().toLocaleDateString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div
                className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-slate-900 prose-li:text-slate-800 text-slate-800"
                style={{ 
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-word"
                }}
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="text-xl font-bold text-slate-800">Berikan Reaksi</h3>
                <div className="flex items-center space-x-4">
                  {id && (
                    <LikeButton 
                      newsId={id} 
                      currentUserId={currentUser?.uid} 
                      onLike={handleLike} 
                      liked={userLiked} 
                    />
                  )}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-6">
                <CommentBox 
                  newsId={id} 
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-slate-800 mb-4">Tentang Penulis</h4>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 break-words">{news.author || "Admin"}</p>
                  <p className="text-sm text-slate-600">Content Writer</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 break-words">
                Penulis berpengalaman dalam bidang jurnalistik dan media digital.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h4 className="font-bold text-slate-800 mb-4">Statistik Artikel</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Views</span>
                  <span className="font-semibold text-slate-800 break-words">{news.views || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Kata</span>
                  <span className="font-semibold text-slate-800">
                    {news.content ? news.content.split(" ").length : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Waktu Baca</span>
                  <span className="font-semibold text-slate-800">
                    {Math.ceil((news.content ? news.content.split(" ").length : 0) / 200)} min
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

export default NewsDetail;