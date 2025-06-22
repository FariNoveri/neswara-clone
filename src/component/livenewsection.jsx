import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebaseconfig";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";

const LiveNewsSection = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const dragRef = useRef(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  // Fetch news from Firebase
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(
          collection(db, "news"), 
          orderBy("createdAt", "desc"), 
          limit(4)
        );
        const snapshot = await getDocs(q);
        const newsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const formattedNews = newsData.map(item => ({
          title: item.judul || "Judul tidak tersedia",
          image: item.gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop",
          category: item.kategori || "Umum",
          author: item.author || "Admin",
          date: item.createdAt?.seconds 
            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : "Baru saja",
          comments: item.komentar || 0,
          views: item.views || 0,
          content: item.ringkasan || item.konten?.substring(0, 120) + "..." || "",
          link: `/news/${item.id}`
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
    let moveX = (e.clientX || e.touches[0].clientX) - startX.current;
    setOffsetX(moveX);
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (offsetX > 80) {
      handlePrev();
    } else if (offsetX < -80) {
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
    }, 8000);

    return () => clearInterval(interval);
  }, [newsList.length]);

  if (loading) {
    return (
      <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-20 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2 animate-reverse-spin"></div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Memuat Berita Terkini
            </h2>
            <p className="text-slate-400">Sedang mengambil update terbaru untuk Anda...</p>
          </div>
        </div>
      </section>
    );
  }

  if (newsList.length === 0) {
    return (
      <section className="relative min-h-[60vh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Segera Hadir</h2>
            <p className="text-slate-400 leading-relaxed">
              Tim editorial sedang menyiapkan berita terkini untuk Anda. 
              Silakan kembali dalam beberapa saat.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 lg:py-20">
        {/* Modern Header */}
        <div className="mb-12 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-red-400 font-semibold tracking-wider uppercase text-sm">
              Live Breaking News
            </span>
            <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
              {newsList.length} Stories
            </div>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Berita <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Terkini</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto lg:mx-0">
            Update real-time dari berbagai sumber terpercaya, dikurasi khusus untuk Anda
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Featured Story */}
          <div className="lg:col-span-2">
            <div
              className="relative h-[500px] lg:h-[600px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing group"
              ref={dragRef}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  {/* Background Image with Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
                    style={{
                      backgroundImage: `url(${newsList[activeIndex]?.image?.trim() || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop"})`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12">
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="space-y-4"
                    >
                      {/* Category & Meta */}
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold rounded-full">
                          {newsList[activeIndex]?.category}
                        </span>
                        <span className="text-slate-300 text-sm">
                          {newsList[activeIndex]?.date}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl lg:text-4xl font-bold text-white leading-tight max-w-4xl">
                        {newsList[activeIndex]?.title}
                      </h2>

                      {/* Content Preview */}
                      <p className="text-slate-300 text-lg leading-relaxed max-w-3xl line-clamp-3">
                        {newsList[activeIndex]?.content}
                      </p>

                      {/* Author & Stats */}
                      <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <div className="flex items-center space-x-6 text-slate-300">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {newsList[activeIndex]?.author?.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium">{newsList[activeIndex]?.author}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                              </svg>
                              <span>{newsList[activeIndex]?.views}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
                              </svg>
                              <span>{newsList[activeIndex]?.comments}</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress Indicators */}
                        <div className="flex space-x-2">
                          {newsList.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setActiveIndex(index)}
                              className={`w-12 h-1 rounded-full transition-all duration-300 ${
                                index === activeIndex 
                                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500' 
                                  : 'bg-white/30 hover:bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* News Sidebar */}
          <div className="space-y-6">
            {/* Navigation Controls */}
            <div className="flex space-x-3">
              <button
                onClick={handlePrev}
                className="flex-1 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Next</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* News List */}
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {newsList.map((news, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    activeIndex === index 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/25' 
                      : 'bg-slate-800/50 hover:bg-slate-700/70 border border-transparent'
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="flex space-x-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={news.image?.trim() || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=200&fit=crop"} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {activeIndex === index && (
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-purple-600/30" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          activeIndex === index 
                            ? 'bg-cyan-500 text-white' 
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {news.category}
                        </span>
                        <span className="text-slate-400 text-xs">{news.date}</span>
                      </div>
                      
                      <h3 className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                        {news.title}
                      </h3>
                      
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span>{news.views} views</span>
                        <span>•</span>
                        <span>{news.comments} comments</span>
                      </div>
                    </div>
                  </div>
                  
                  {activeIndex === index && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-600/10 pointer-events-none" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #8b5cf6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #7c3aed);
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-reverse-spin {
          animation: spin 1s linear infinite reverse;
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
    </section>
  );
};

export default LiveNewsSection;