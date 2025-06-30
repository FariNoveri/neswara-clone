import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseconfig.js";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

// Function to create a slug from a string
const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
};

const Olahraga = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const CATEGORY = "Olahraga";

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        console.log("Initializing fetchNews for category:", CATEGORY);
        const collectionRef = collection(db, "news");
        const q = query(
          collectionRef,
          where("kategori", "==", CATEGORY),
          orderBy("createdAt", "desc")
        );
        console.log("Query constructed:", q);

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log("Snapshot received, docs count:", snapshot.docs.length);
          const newsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          console.log("Mapped data:", newsData);
          setNews(newsData);
          setIsLoading(false);
        }, (error) => {
          console.error("Firestore onSnapshot error (Olahraga):", {
            message: error.message,
            code: error.code,
            stack: error.stack,
          });
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error in fetchNews:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Format tanggal dengan penanganan error
  const formatDate = (timestamp) => {
    if (!timestamp) return "Tanggal tidak tersedia";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date instanceof Date && !isNaN(date)
        ? date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "Tanggal tidak valid";
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Tanggal tidak valid";
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Berita {CATEGORY.charAt(0) + CATEGORY.slice(1).toLowerCase()}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Dapatkan informasi terbaru dan terpercaya tentang {CATEGORY.toLowerCase()}
          </p>
        </div>
        {isLoading ? (
          <div className="text-center">
            <div className="inline-block animate-spin text-4xl text-blue-500">🌀</div>
            <p className="mt-2 text-gray-600">Memuat berita...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada berita</h3>
            <p className="text-gray-500">Belum ada berita untuk kategori {CATEGORY.toLowerCase()}. Silakan cek kembali nanti!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
            {news[0] && (
              <article className="lg:col-span-2 lg:row-span-2 group cursor-pointer">
                <Link to={`/berita/${news[0].slug || createSlug(news[0].judul || news[0].title || 'untitled')}`}>
                  <div className="relative overflow-hidden rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500">
                    <img
                      src={news[0].gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop"}
                      alt={news[0].judul || news[0].title}
                      className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                        {news[0].kategori || 'Berita'}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h2 className="text-2xl font-bold mb-3 line-clamp-3 group-hover:text-blue-200 transition-colors">
                        {news[0].judul || news[0].title}
                      </h2>
                      <p className="text-gray-300 mb-4 line-clamp-2">
                        {news[0].ringkasan || news[0].description || news[0].konten?.substring(0, 150) + '...'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>{formatDate(news[0].createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            )}
            {news.slice(1, 7).map((item, index) => (
              <article key={item.id || index} className="group cursor-pointer">
                <Link to={`/berita/${item.slug || createSlug(item.judul || item.title || 'untitled')}`}>
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop"}
                        alt={item.judul || item.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-full">
                          {item.kategori || 'Berita'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {item.judul || item.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.ringkasan || item.description || item.konten?.substring(0, 100) + '...'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Olahraga;