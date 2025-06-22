import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import LikeButton from "../LikeButton";
import CommentBox from "../CommentBox";
import { useAuth } from "../Hooks/useAuth";
import { ArrowLeft, Eye, User, Calendar, Share2, Bookmark } from "lucide-react";

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "news", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setNews({
            id: snapshot.id,
            ...snapshot.data(),
            title: snapshot.data().judul || "Tanpa Judul",
            content: snapshot.data().konten || "Konten belum ditulis.",
            image: snapshot.data().gambar || null,
            imageDescription: snapshot.data().gambarDeskripsi || "Gambar utama"
          });
          if (currentUser) {
            await updateDoc(docRef, {
              views: increment(1),
            });
          }
        } else {
          setError("Berita tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching news or updating views:", err.message);
        setError("Gagal memuat berita. Silakan coba lagi.");
      }
      setLoading(false);
    };
    fetchNews();
  }, [id, currentUser]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
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
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header Navigation */}
      <div className="sticky top-0 z-0 bg-white/80 backdrop-blur-lg border-b border-slate-200">
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
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      {news.image && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={news.image}
            alt={news.imageDescription}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}

      {/* Title Section */}
      <div className={`${news.image ? 'bg-white' : 'bg-gradient-to-r from-blue-600 to-purple-700'} py-8 md:py-12`}>
        <div className="max-w-4xl mx-auto px-4">
          <h1 className={`text-3xl md:text-5xl font-bold mb-6 leading-tight ${
            news.image ? 'text-slate-800' : 'text-white'
          }`}>
            {news.title}
          </h1>
          
          <div className={`flex flex-wrap items-center space-x-6 ${
            news.image ? 'text-slate-600' : 'text-white/90'
          }`}>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{news.author || "Admin"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{news.views || 0} views</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {new Date().toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Article Body */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-slate-900 prose-li:text-slate-800 text-slate-800"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            </div>

            {/* Interaction Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Berikan Reaksi</h3>
                <div className="flex items-center space-x-4">
                  <LikeButton newsId={id} />
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-6">
                <CommentBox newsId={id} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-slate-800 mb-4">Tentang Penulis</h4>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{news.author || "Admin"}</p>
                  <p className="text-sm text-slate-600">Content Writer</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Penulis berpengalaman dalam bidang jurnalistik dan media digital.
              </p>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h4 className="font-bold text-slate-800 mb-4">Statistik Artikel</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Views</span>
                  <span className="font-semibold text-slate-800">{news.views || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Kata</span>
                  <span className="font-semibold text-slate-800">
                    {news.content ? news.content.split(' ').length : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Waktu Baca</span>
                  <span className="font-semibold text-slate-800">
                    {Math.ceil((news.content ? news.content.split(' ').length : 0) / 200)} min
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