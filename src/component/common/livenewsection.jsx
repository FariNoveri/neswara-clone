import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebaseconfig";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../config/slug";

const LiveNewsSection = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const dragRef = useRef(null);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const navigate = useNavigate();

  // Fetch news from Firebase
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(
          collection(db, "news"),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(q);
        const newsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          slug: doc.data().slug,
        }));

        const formattedNews = newsData.map((item) => ({
          title: item.judul || "Judul tidak tersedia",
          image: item.gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop",
          category: item.kategori || "Umum",
          author: item.author || "Admin",
          date: item.createdAt?.seconds
            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Baru saja",
          comments: item.komentar || 0,
          views: item.views || 0,
          content: item.ringkasan || item.konten?.substring(0, 150) + "..." || "",
          link: `/berita/${item.slug || createSlug(item.judul || item.title || 'untitled')}`,
        }));

        setNewsList(formattedNews);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching news:", error);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleNewsClick = (link) => {
    navigate(link);
  };

  const handleNext = () => {
    if (newsList.length > 0) {
      setActiveIndex((prev) => (prev + 1) % newsList.length);
    }
  };

  const handlePrev = () => {
    if (newsList.length > 0) {
      setActiveIndex((prev) => (prev - 1 + newsList.length) % newsList.length);
    }
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX || e.touches[0].clientX;
  };

  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const moveX = (e.clientX || e.touches[0].clientX) - startX.current;
    setOffsetX(moveX);
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (offsetX > 100) {
      handlePrev();
    } else if (offsetX < -100) {
      handleNext();
    }
    setOffsetX(0);
  };

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (newsList.length > 0) {
        handleNext();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [newsList.length]);

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mt-2 animate-reverse-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Memuat Berita Terkini</h2>
            <p className="text-slate-400">Mengambil update terbaru...</p>
          </div>
        </div>
      </section>
    );
  }

  if (newsList.length === 0) {
    return (
      <section className="min-h-[70vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Segera Hadir</h2>
            <p className="text-slate-400">Berita terkini sedang disiapkan untuk Anda.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container px-4 py-8 lg:py-16">
  {/* Header */}
  <div className="text-left mb-12">
    <div className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-red-400 font-medium text-sm">LIVE</span>
      <span className="text-slate-300 text-sm">Breaking News</span>
    </div>
    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
      Berita <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Terkini</span>
    </h1>
    <p className="text-slate-400 text-lg">
      Update real-time dari berbagai sumber terpercaya
    </p>
  </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Featured News */}
          <div className="lg:col-span-8">
            <div className="relative">
              <div
                className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing group"
                ref={dragRef}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onClick={() => handleNewsClick(newsList[activeIndex].link)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: offsetX * 0.1 
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${newsList[activeIndex]?.image})`,
                      }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                      <div className="space-y-4">
                        {/* Category & Date */}
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-full">
                            {newsList[activeIndex]?.category}
                          </span>
                          <span className="text-slate-300 text-sm">{newsList[activeIndex]?.date}</span>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                          {newsList[activeIndex]?.title}
                        </h2>

                        {/* Content Preview */}
                        <p className="text-slate-300 leading-relaxed max-w-3xl">
                          {newsList[activeIndex]?.content}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/20">
                          <div className="flex items-center space-x-4 text-slate-300 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {newsList[activeIndex]?.author?.charAt(0)}
                                </span>
                              </div>
                              <span>{newsList[activeIndex]?.author}</span>
                            </div>
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              <span>{newsList[activeIndex]?.views}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center space-x-2 mt-6">
                {newsList.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 scale-125"
                        : "bg-slate-600 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Navigation Controls */}
            <div className="flex space-x-3">
              <button
                onClick={handlePrev}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Prev</span>
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* News List */}
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {newsList.map((news, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                    activeIndex === index
                      ? "bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-blue-500/30"
                      : "bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50"
                  }`}
                  onClick={() => {
                    setActiveIndex(index);
                    handleNewsClick(news.link);
                  }}
                >
                  <div className="flex space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={news.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                          {news.category}
                        </span>
                        <span className="text-slate-500 text-xs">{news.date}</span>
                      </div>
                      <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                        {news.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        .animate-reverse-spin {
          animation: reverse-spin 1s linear infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 2px;
        }
        
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background-color: #1e293b;
        }
      `}</style>
    </section>
  );
};

export default LiveNewsSection;