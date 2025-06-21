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
        
        // Format data untuk komponen
        const formattedNews = newsData.map(item => ({
          title: item.judul || "Judul tidak tersedia",
          image: item.gambar || "https://source.unsplash.com/600x400/?news",
          category: item.kategori || "Umum",
          author: item.author || "Admin",
          date: item.createdAt?.seconds 
            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
            : "Baru",
          comments: item.komentar || 0,
          views: item.views || 0,
          content: item.ringkasan || item.konten?.substring(0, 100) + "..." || "",
          link: `/news/${item.id}` // untuk navigasi detail
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

  if (loading) {
    return (
      <section className="w-full bg-black text-white py-10 select-none">
        <div className="container mx-auto px-6 md:px-16">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-4 text-lg">Memuat berita terbaru...</span>
          </div>
        </div>
      </section>
    );
  }

  if (newsList.length === 0) {
    return (
      <section className="w-full bg-black text-white py-10 select-none">
        <div className="container mx-auto px-6 md:px-16">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-red-500 text-sm font-bold">🔴 LIVE NOW</span>
          </div>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Belum ada berita terbaru</h2>
            <p className="text-gray-400">Admin belum menambahkan berita. Silakan cek kembali nanti.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-black text-white py-10 select-none">
      <div className="container mx-auto px-6 md:px-16">
        {/* LIVE NOW Label */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-red-500 text-sm font-bold">🔴 LIVE NOW</span>
          <span className="text-sm text-gray-400">
            {newsList.length} berita terbaru
          </span>
        </div>

        {/* Live News Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main News Box - Bisa di Drag & Animasi Smooth */}
          <div
            className="relative w-full md:w-2/3 h-[400px] bg-gray-900 rounded-lg flex flex-col justify-end p-6 overflow-hidden cursor-grab active:cursor-grabbing"
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
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col justify-end p-6"
                style={{
                  backgroundImage: `linear-gradient(...), url(${newsList[activeIndex]?.image?.trim() || "https://source.unsplash.com/600x400/?news"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="bg-black bg-opacity-50 p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">
                      {newsList[activeIndex]?.category}
                    </span>
                    <span className="text-xs text-gray-300">
                      {newsList[activeIndex]?.date}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold leading-snug mb-2">
                    {newsList[activeIndex]?.title}
                  </h2>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {newsList[activeIndex]?.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span className="flex items-center">
                      <span className="text-green-400 mr-1">📝</span>
                      <strong>{newsList[activeIndex]?.author}</strong>
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">👁️</span>
                      {newsList[activeIndex]?.views}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">💬</span>
                      {newsList[activeIndex]?.comments}
                    </span>
                  </div>
                  
                  {/* Indicator dots */}
                  <div className="flex space-x-2">
                    {newsList.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === activeIndex ? 'bg-white' : 'bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* News List */}
          <div className="relative w-full md:w-1/3 space-y-4">
            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition-colors"
              onClick={handlePrev}
            >
              PREV
            </button>

            {/* News List dengan gradient effect */}
            <div className="relative max-h-80 overflow-y-auto">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/10 to-transparent z-10 pointer-events-none"></div>

              <div className="space-y-3">
                {newsList.map((news, index) => (
                  <div
                    key={index}
                    className={`flex items-center bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-200 relative z-20 ${
                      activeIndex === index ? "border-2 border-green-500 bg-gray-700" : "border border-transparent"
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div className="w-12 h-12 bg-gray-600 flex items-center justify-center rounded-md mr-4 flex-shrink-0">
                      {news.image?.trim() ? (
  <img 
    src={news.image.trim()} 
    alt="" 
    className="w-full h-full object-cover rounded-md"
  />
) : (
  <img 
    src="https://source.unsplash.com/600x400/?news" 
    alt="default" 
    className="w-full h-full object-cover rounded-md"
  />
)}

                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1 line-clamp-2">
                        {news.title}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className="px-1 py-0.5 bg-blue-600 text-white rounded text-xs">
                          {news.category}
                        </span>
                        <span>{news.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition-colors"
              onClick={handleNext}
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveNewsSection;