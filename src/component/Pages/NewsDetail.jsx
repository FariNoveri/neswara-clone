import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, onSnapshot, setDoc } from "firebase/firestore";
import LikeButton from "./LikeButton";
import CommentBox from "./CommentBox";
import ReportModal from "./ReportModal";
import { useAuth } from "../auth/useAuth";
import { ArrowLeft, Eye, User, Calendar, Share2, Bookmark, MessageCircle, Flag } from "lucide-react";
import { toast } from "react-toastify";
import { ADMIN_EMAILS } from "../config/Constants";

const findNewsById = async (newsId, currentUser) => {
  try {
    const docRef = doc(db, "news", newsId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Found news by ID:", { id: docSnap.id, data: docSnap.data() });
      return { id: docSnap.id, ...docSnap.data() };
    }
    console.warn("No document found for ID:", newsId);
    if (currentUser) {
      await addDoc(collection(db, "logs"), {
        action: "NEWS_NOT_FOUND_BY_ID",
        userEmail: currentUser?.email || "anonymous",
        details: { newsId, error: "No news found with matching ID" },
        timestamp: serverTimestamp(),
      });
    }
    return null;
  } catch (error) {
    console.error("Error finding news by ID:", error);
    if (currentUser) {
      await addDoc(collection(db, "logs"), {
        action: "ERROR_NEWS_FETCH_BY_ID",
        userEmail: currentUser?.email || "anonymous",
        details: { newsId, error: error.message },
        timestamp: serverTimestamp(),
      });
    }
    return null;
  }
};

const NewsDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [newsId, setNewsId] = useState(null);
  const [commentCount, setCommentCount] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const initialFetchRef = useRef(false);

  useEffect(() => {
    const ensureUserDocument = async (user) => {
      if (!user) return false;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email || "anonymous",
            isAdmin: ADMIN_EMAILS.includes(user.email) || false,
            createdAt: serverTimestamp(),
          });
          console.log("Created user document for:", user.uid);
          await new Promise(resolve => setTimeout(resolve, 500));
          const verifySnap = await getDoc(userRef);
          if (!verifySnap.exists()) {
            throw new Error("Failed to verify user document creation");
          }
          return true;
        }
        return true;
      } catch (err) {
        console.error("Error creating/verifying user document:", err);
        await addDoc(collection(db, "logs"), {
          action: "USER_DOCUMENT_ERROR",
          userEmail: user.email || "anonymous",
          details: { uid: user.uid, error: err.message },
          timestamp: serverTimestamp(),
        });
        return false;
      }
    };

    const fetchNews = async () => {
      console.log("FetchNews called with slug:", slug, "currentUser:", currentUser?.uid);
      if (!slug || slug.trim() === "") {
        console.error("Invalid or empty slug:", slug);
        setError("Slug berita tidak valid.");
        setLoading(false);
        if (currentUser) {
          await addDoc(collection(db, "logs"), {
            action: "INVALID_SLUG",
            userEmail: currentUser?.email || "anonymous",
            details: { slug, error: "Slug is undefined or empty" },
            timestamp: serverTimestamp(),
          });
        }
        setNews({
          id: "default",
          title: "Berita Tidak Ditemukan",
          content: "<p>Maaf, slug berita tidak valid.</p>",
          image: "https://via.placeholder.com/640x360?text=Berita+Tidak+Ditemukan",
          imageDescription: "Gambar default",
          views: 0,
          author: "Sistem",
          createdAt: serverTimestamp(),
          category: "Umum",
          slug: "",
          likeCount: 0,
          hideProfilePicture: false
        });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let userDocCreated = true;
        if (currentUser) {
          userDocCreated = await ensureUserDocument(currentUser);
          if (!userDocCreated) {
            console.warn("Skipping views update due to user document creation failure");
          }
        }

        const q = query(collection(db, "news"), where("slug", "==", slug.trim()));
        const snapshot = await getDocs(q);
        let newsData = null;
        if (!snapshot.empty) {
          newsData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .reduce((latest, current) => {
              const latestTime = latest.updatedAt?.toDate() || latest.createdAt?.toDate() || new Date(0);
              const currentTime = current.updatedAt?.toDate() || current.createdAt?.toDate() || new Date(0);
              return currentTime > latestTime ? current : latest;
            });
          if (!newsData || !newsData.id) {
            console.warn("newsData or newsData.id is undefined, using first document id:", snapshot.docs[0].id);
            newsData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          }
          setNewsId(newsData.id);
          setNews({
            id: newsData.id,
            title: newsData.judul || newsData.title || "Tanpa Judul",
            content: newsData.konten || newsData.content || "Konten belum ditulis.",
            image: newsData.gambar || newsData.image || "https://via.placeholder.com/640x360?text=Berita",
            imageDescription: newsData.gambarDeskripsi || newsData.imageDescription || "Gambar utama",
            views: newsData.views || 0,
            author: newsData.author || "Penulis Tidak Diketahui",
            createdAt: newsData.createdAt || serverTimestamp(),
            category: newsData.kategori || newsData.category || "Umum",
            slug: newsData.slug || slug,
            likeCount: newsData.likeCount || 0,
            hideProfilePicture: newsData.hideProfilePicture || false
          });

          if (newsData.slug && newsData.slug !== slug) {
            console.log(`Initial fetch detected slug mismatch: redirecting from ${slug} to ${newsData.slug}`);
            navigate(`/berita/${newsData.slug}`, { replace: true });
            if (currentUser) {
              await addDoc(collection(db, "logs"), {
                action: "INITIAL_SLUG_REDIRECT",
                userEmail: currentUser?.email || "anonymous",
                details: { newsId: newsData.id, oldSlug: slug, newSlug: newsData.slug },
                timestamp: serverTimestamp(),
              });
            }
            return;
          }

          if (currentUser && newsData.id && userDocCreated) {
            try {
              const docRef = doc(db, "news", newsData.id);
              await updateDoc(docRef, { views: increment(1) });
              console.log("Views incremented for news:", newsData.id);
            } catch (updateErr) {
              console.warn("Error updating views (non-critical):", updateErr);
              toast.warn("Gagal memperbarui jumlah tampilan.", {
                position: 'top-center',
                autoClose: 3000,
                toastId: 'views-error'
              });
              await addDoc(collection(db, "logs"), {
                action: "VIEWS_UPDATE_ERROR",
                userEmail: currentUser?.email || "anonymous",
                details: { newsId: newsData.id, slug, error: updateErr.message },
                timestamp: serverTimestamp(),
              });
            }
          }
        } else {
          console.warn("No news found for slug:", slug);
          setError("Berita tidak ditemukan.");
          setNews({
            id: "default",
            title: "Berita Tidak Ditemukan",
            content: "<p>Maaf, berita yang Anda cari tidak tersedia.</p>",
            image: "https://via.placeholder.com/640x360?text=Berita+Tidak+Ditemukan",
            imageDescription: "Gambar default",
            views: 0,
            author: "Sistem",
            createdAt: serverTimestamp(),
            category: "Umum",
            slug: "",
            likeCount: 0,
            hideProfilePicture: false
          });
          if (currentUser) {
            await addDoc(collection(db, "logs"), {
              action: "NEWS_NOT_FOUND",
              userEmail: currentUser?.email || "anonymous",
              details: { slug, error: "No news found for slug" },
              timestamp: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Gagal memuat berita: " + err.message);
        toast.error("Gagal memuat berita.");
        if (currentUser) {
          await addDoc(collection(db, "logs"), {
            action: "FETCH_NEWS_ERROR",
            userEmail: currentUser?.email || "anonymous",
            details: { slug, error: err.message },
            timestamp: serverTimestamp(),
          });
        }
        setNews({
          id: "default",
          title: "Kesalahan Memuat Berita",
          content: "<p>Terjadi kesalahan saat memuat berita. Silakan coba lagi.</p>",
          image: "https://via.placeholder.com/640x360?text=Berita+Tidak+Ditemukan",
          imageDescription: "Gambar default",
          views: 0,
          author: "Sistem",
          createdAt: serverTimestamp(),
          category: "Umum",
          slug: "",
          likeCount: 0,
          hideProfilePicture: false
        });
      }
      setLoading(false);
      initialFetchRef.current = true;
    };

    fetchNews();
  }, [slug, currentUser]);

  useEffect(() => {
    if (!newsId || !initialFetchRef.current) return;

    const unsubscribeNews = onSnapshot(doc(db, "news", newsId), (doc) => {
      if (doc.exists()) {
        const updatedData = doc.data();
        console.log("onSnapshot triggered with updated data:", updatedData);
        setNews((prev) => ({
          ...prev,
          title: updatedData.judul || updatedData.title || prev.title,
          content: updatedData.konten || updatedData.content || prev.content,
          image: updatedData.gambar || updatedData.image || prev.image,
          imageDescription: updatedData.gambarDeskripsi || updatedData.imageDescription || prev.imageDescription,
          author: updatedData.author || prev.author,
          category: updatedData.kategori || updatedData.category || prev.category,
          slug: updatedData.slug || prev.slug,
          views: updatedData.views || prev.views,
          likeCount: updatedData.likeCount || prev.likeCount,
          hideProfilePicture: updatedData.hideProfilePicture || false
        }));
        if (updatedData.slug && updatedData.slug !== slug) {
          console.log(`Slug changed from ${slug} to ${updatedData.slug}, redirecting...`);
          navigate(`/berita/${updatedData.slug}`, { replace: true });
          if (currentUser) {
            addDoc(collection(db, "logs"), {
              action: "SLUG_REDIRECT",
              userEmail: currentUser?.email || "anonymous",
              details: { newsId, oldSlug: slug, newSlug: updatedData.slug },
              timestamp: serverTimestamp(),
            });
          }
        }
      } else {
        console.warn(`News document ${newsId} no longer exists`);
        setError("Berita telah dihapus.");
        navigate('/news', { replace: true });
        if (currentUser) {
          addDoc(collection(db, "logs"), {
            action: "NEWS_DELETED",
            userEmail: currentUser?.email || "anonymous",
            details: { newsId, slug },
            timestamp: serverTimestamp(),
          });
        }
      }
    }, (err) => {
      console.error("Error in news onSnapshot:", err);
      toast.error("Gagal memuat pembaruan berita.");
      if (currentUser) {
        addDoc(collection(db, "logs"), {
          action: "ONSNAPSHOT_ERROR",
          userEmail: currentUser?.email || "anonymous",
          details: { newsId, slug, error: err.message },
          timestamp: serverTimestamp(),
        });
      }
    });

    const checkBookmark = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, "savedArticles"), where("userId", "==", currentUser.uid), where("articleId", "==", newsId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsBookmarked(true);
          setBookmarkId(snapshot.docs[0].id);
        } else {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      } catch (err) {
        console.error("Error checking bookmark:", err);
        toast.error("Gagal memeriksa status bookmark.");
        if (currentUser) {
          addDoc(collection(db, "logs"), {
            action: "CHECK_BOOKMARK_ERROR",
            userEmail: currentUser?.email || "anonymous",
            details: { newsId, slug, error: err.message },
            timestamp: serverTimestamp(),
          });
        }
      }
    };

    checkBookmark();

    const unsubscribeLikes = onSnapshot(query(collection(db, "news", newsId, "likes")), (snapshot) => {
      setLikeCount(snapshot.size);
      if (currentUser) {
        const userLike = snapshot.docs.find((doc) => doc.data().userId === currentUser.uid);
        setUserLiked(!!userLike);
      }
    }, (err) => {
      console.error("Error fetching likes:", err);
      toast.error("Gagal memuat jumlah suka.");
      if (currentUser) {
        addDoc(collection(db, "logs"), {
          action: "FETCH_LIKES_ERROR",
          userEmail: currentUser?.email || "anonymous",
          details: { newsId, slug, error: err.message },
          timestamp: serverTimestamp(),
        });
      }
    });

    const unsubscribeComments = onSnapshot(query(collection(db, "news", newsId, "comments")), (snapshot) => {
      setCommentCount(snapshot.size);
      console.log("Comments snapshot received, count:", snapshot.size);
    }, (err) => {
      console.error("Error fetching comments count:", err);
      toast.error("Gagal memuat jumlah komentar.");
      if (currentUser) {
        addDoc(collection(db, "logs"), {
          action: "FETCH_COMMENTS_COUNT_ERROR",
          userEmail: currentUser?.email || "anonymous",
          details: { newsId, slug, error: err.message },
          timestamp: serverTimestamp(),
        });
      }
    });

    return () => {
      unsubscribeNews();
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [newsId, currentUser, slug, navigate]);

  useEffect(() => {
    const handleNewsEdited = (event) => {
      const { newsId: editedNewsId, newSlug, oldSlug } = event.detail;
      console.log(`NewsDetail: newsEdited event received: newsId=${editedNewsId}, newSlug=${newSlug}, oldSlug=${oldSlug}, currentSlug=${slug}`);
      if (editedNewsId && editedNewsId === newsId && oldSlug === slug && newSlug !== slug) {
        console.log(`Redirecting from /berita/${slug} to /berita/${newSlug}`);
        navigate(`/berita/${newSlug}`, { replace: true });
        if (currentUser) {
          addDoc(collection(db, "logs"), {
            action: "SLUG_REDIRECT_EVENT",
            userEmail: currentUser?.email || "anonymous",
            details: { newsId: editedNewsId, oldSlug, newSlug },
            timestamp: serverTimestamp(),
          });
        }
      }
    };

    window.addEventListener('newsEdited', handleNewsEdited);
    return () => window.removeEventListener('newsEdited', handleNewsEdited);
  }, [newsId, slug, navigate, currentUser]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          url: `${window.location.origin}/berita/${news.slug || slug}`,
          text: news.content ? news.content.replace(/<[^>]+>/g, "").substring(0, 200) : "Baca berita ini!"
        });
        toast.success("Berita dibagikan!");
        if (currentUser) {
          await addDoc(collection(db, "logs"), {
            action: "SHARE_NEWS",
            userEmail: currentUser?.email || "anonymous",
            details: { newsId, title: news.title, slug: news.slug || slug, isAdmin: ADMIN_EMAILS.includes(currentUser.email) },
            timestamp: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Error sharing:", err);
        toast.error("Gagal membagikan berita.");
        if (currentUser) {
          await addDoc(collection(db, "logs"), {
            action: "SHARE_NEWS_ERROR",
            userEmail: currentUser?.email || "anonymous",
            details: { newsId, slug, error: err.message },
            timestamp: serverTimestamp(),
          });
        }
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/berita/${news.slug || slug}`);
      toast.success("Link berita disalin ke clipboard!");
      if (currentUser) {
        await addDoc(collection(db, "logs"), {
          action: "COPY_LINK",
          userEmail: currentUser?.email || "anonymous",
          details: { newsId, title: news.title, slug: news.slug || slug, isAdmin: ADMIN_EMAILS.includes(currentUser.email) },
          timestamp: serverTimestamp(),
        });
      }
    }
  };

  const toggleBookmark = async () => {
    if (!currentUser) {
      toast.warn("Silakan masuk untuk menyimpan artikel.");
      return;
    }
    if (!newsId) {
      toast.error("ID berita tidak valid.");
      return;
    }
    try {
      if (isBookmarked) {
        await deleteDoc(doc(db, "savedArticles", bookmarkId));
        await addDoc(collection(db, "logs"), {
          action: "UNSAVE_NEWS",
          userEmail: currentUser?.email || "anonymous",
          details: { articleId: newsId, title: news.title, slug: news.slug || slug, isAdmin: ADMIN_EMAILS.includes(currentUser.email) },
          timestamp: serverTimestamp(),
        });
        setIsBookmarked(false);
        setBookmarkId(null);
        toast.success("Bookmark dihapus!");
      } else {
        const bookmarkRef = await addDoc(collection(db, "savedArticles"), {
          userId: currentUser.uid,
          articleId: newsId,
          title: news.title,
          slug: news.slug || slug,
          summary: news.content ? news.content.replace(/<[^>]+>/g, "").substring(0, 200) : "No summary available",
          imageUrl: news.image || "https://via.placeholder.com/640x360",
          savedAt: serverTimestamp(),
        });
        await addDoc(collection(db, "logs"), {
          action: "SAVE_NEWS",
          userEmail: currentUser?.email || "anonymous",
          details: { articleId: newsId, title: news.title, slug: news.slug || slug, isAdmin: ADMIN_EMAILS.includes(currentUser.email) },
          timestamp: serverTimestamp(),
        });
        setIsBookmarked(true);
        setBookmarkId(bookmarkRef.id);
        toast.success("Artikel disimpan!");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Gagal mengelola bookmark.");
      if (currentUser) {
        addDoc(collection(db, "logs"), {
          action: "BOOKMARK_ERROR",
          userEmail: currentUser?.email || "anonymous",
          details: { newsId, slug, error: err.message },
          timestamp: serverTimestamp(),
        });
      }
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.warn("Silakan masuk untuk menyukai berita.");
      return false;
    }
    if (!newsId) {
      toast.error("ID berita tidak valid.");
      return false;
    }
    try {
      const likeRef = doc(db, "news", newsId, "likes", currentUser.uid);
      const newsDocRef = doc(db, "news", newsId);
      const actionType = userLiked ? "unlike" : "like";
      const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
      if (userLiked) {
        await deleteDoc(likeRef);
        await updateDoc(newsDocRef, { likeCount: increment(-1) });
      } else {
        await setDoc(likeRef, { userId: currentUser.uid, timestamp: serverTimestamp() });
        await updateDoc(newsDocRef, { likeCount: increment(1) });
      }
      await addDoc(collection(db, "logs"), {
        action: "LIKE_NEWS",
        userEmail: currentUser?.email || "anonymous",
        details: { newsId, title: news.title, slug: news.slug || slug, actionType, isAdmin },
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Gagal mengubah status suka.");
      if (currentUser) {
        addDoc(collection(db, "logs"), {
          action: "LIKE_ERROR",
          userEmail: currentUser?.email || "anonymous",
          details: { newsId, slug, error: err.message },
          timestamp: serverTimestamp(),
        });
      }
      return false;
    }
  };

  const handleReportClick = () => {
    if (!currentUser) {
      toast.warn("Silakan masuk untuk melaporkan berita.");
      return;
    }
    if (!newsId) {
      toast.error("ID berita tidak valid.");
      return;
    }
    setIsReportModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
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
          <button onClick={() => navigate('/news')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Kembali ke Berita
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
          <button onClick={() => navigate('/news')} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors">
            Kembali ke Berita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100" data-no-cache>
      <div className="sticky top-0 z-20 bg-white shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Kembali</span>
            </button>
            <div className="flex items-center space-x-3">
              <button onClick={handleShare} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={handleReportClick} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all">
                <Flag className="w-5 h-5" />
              </button>
              <button onClick={toggleBookmark} className={`p-2 rounded-full transition-all ${isBookmarked ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"}`}>
                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        newsId={newsId}
        currentUser={currentUser}
        newsTitle={news?.title}
      />

      {news.image && (
  <div className="w-full py-8 mt-16">
    <div className="max-w-7xl mx-auto px-4">
      <div className="relative w-full max-w-[995px] mx-auto bg-slate-200 rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: "16/9" }}>
        <img src={news.image} alt={news.imageDescription} className="absolute inset-0 w-full h-full object-cover object-center" onError={(e) => (e.target.src = "https://via.placeholder.com/640x360?text=Berita")} style={{ objectFit: "cover", objectPosition: "center" }} />
        <div className="absolute top-4 left-4 bg-cyan-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
          {news.category}
        </div>
      </div>
    </div>
  </div>
)}

      <div className={`${news.image ? "bg-white" : "bg-gradient-to-r from-cyan-600 to-purple-600"} py-8 md:py-12`}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className={`text-3xl md:text-5xl font-bold mb-6 leading-tight break-words hyphens-auto ${news.image ? "text-slate-800" : "text-white"}`} style={{ wordWrap: "break-word", overflowWrap: "break-word", wordBreak: "break-word" }}>
            {news.title}
          </h1>
          <div className={`flex flex-wrap items-center gap-4 md:gap-6 ${news.image ? "text-slate-600" : "text-white/90"}`}>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium break-words">{news.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{news.views} views</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {news.createdAt?.toDate ? new Date(news.createdAt.toDate()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{commentCount} komentar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-p:leading-relaxed prose-a:text-cyan-600 prose-strong:text-slate-900 prose-li:text-slate-800 text-slate-800" style={{ wordWrap: "break-word", overflowWrap: "break-word", wordBreak: "break-word" }} dangerouslySetInnerHTML={{ __html: news.content }} />
            </div>

            {/* Author and Stats for Mobile (before Comments) */}
            <div className="md:hidden space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h4 className="font-bold text-slate-800 mb-4">Tentang Penulis</h4>
                <div className="flex items-center mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {currentUser && currentUser.photoURL && (
                      <>
                        {!news.hideProfilePicture ? (
                          <img 
                            src={currentUser.photoURL} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        {news.author}
                      </span>
                      {news.hideProfilePicture && currentUser && currentUser.photoURL && (
                        <span className="text-xs text-gray-500 italic">
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 break-words">Penulis berpengalaman dalam bidang jurnalistik dan media digital.</p>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-purple-50 rounded-2xl p-6 border border-cyan-100">
                <h4 className="font-bold text-slate-800 mb-4">Statistik Artikel</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Views</span>
                    <span className="font-semibold text-slate-800 break-words">{news.views}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Suka</span>
                    <span className="font-semibold text-slate-800">{likeCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Komentar</span>
                    <span className="font-semibold text-slate-800">{commentCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Kata</span>
                    <span className="font-semibold text-slate-800">{news.content ? news.content.replace(/<[^>]+>/g, "").split(/\s+/).filter(word => word.length > 0).length : 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Waktu Baca</span>
                    <span className="font-semibold text-slate-800">{Math.ceil((news.content ? news.content.replace(/<[^>]+>/g, "").split(/\s+/).filter(word => word.length > 0).length : 0) / 200)} min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="text-xl font-bold text-slate-800">Berikan Reaksi</h3>
                <div className="flex items-center space-x-4">
                  {newsId && <LikeButton newsId={newsId} currentUserId={currentUser?.uid} onLike={handleLike} liked={userLiked} likeCount={likeCount} />}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-6">
                <CommentBox newsId={newsId} currentUser={currentUser} onCommentCountChange={setCommentCount} />
              </div>
            </div>
          </div>

          {/* Author and Stats for Desktop (Sidebar) */}
          <div className="hidden md:block lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-slate-800 mb-4">Tentang Penulis</h4>
              <div className="flex items-center mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {currentUser && currentUser.photoURL && (
                    <>
                      {!news.hideProfilePicture ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">
                      {news.author}
                    </span>
                    {news.hideProfilePicture && currentUser && currentUser.photoURL && (
                      <span className="text-xs text-gray-500 italic">
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 break-words">Penulis berpengalaman dalam bidang jurnalistik dan media digital.</p>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-purple-50 rounded-2xl p-6 border border-cyan-100">
              <h4 className="font-bold text-slate-800 mb-4">Statistik Artikel</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Views</span>
                  <span className="font-semibold text-slate-800 break-words">{news.views}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Suka</span>
                  <span className="font-semibold text-slate-800">{likeCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Komentar</span>
                  <span className="font-semibold text-slate-800">{commentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Kata</span>
                  <span className="font-semibold text-slate-800">{news.content ? news.content.replace(/<[^>]+>/g, "").split(/\s+/).filter(word => word.length > 0).length : 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Waktu Baca</span>
                  <span className="font-semibold text-slate-800">{Math.ceil((news.content ? news.content.replace(/<[^>]+>/g, "").split(/\s+/).filter(word => word.length > 0).length : 0) / 200)} min</span>
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