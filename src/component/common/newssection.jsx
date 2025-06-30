import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { db } from "../../firebaseconfig";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
  increment,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../config/slug";
import { toast } from "react-toastify";

const NewsSection = () => {
  const [newsData, setNewsData] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const navigate = useNavigate();

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      console.log("Firestore query returned", snapshot.size, "documents");
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        const slug = docData.slug || createSlug(docData.judul || docData.title || "untitled");
        console.log(`News ID: ${doc.id}, Slug: ${slug}, Title: ${docData.judul || docData.title || "untitled"}`);
        return {
          id: doc.id,
          ...docData,
          slug,
        };
      });
      if (data.length === 0) {
        console.warn("No news documents found in Firestore");
        setError("Tidak ada berita yang tersedia.");
      }
      setNewsData(data);
      setFilteredNews(data.slice(0, 5)); // Changed to 5
    } catch (error) {
      console.error("Error fetching news:", error);
      setError("Gagal memuat berita: " + error.message);
      toast.error("Gagal memuat berita.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (selectedCategory === "Semua") {
      setFilteredNews(newsData.slice(0, 5)); // Changed to 5
    } else {
      const filtered = newsData.filter(
        (item) => (item.kategori || "Umum") === selectedCategory
      );
      setFilteredNews(filtered.slice(0, 5)); // Changed to 5
    }
  }, [selectedCategory, newsData]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleNewsClick = async (newsItem) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const newsId = newsItem.id;
    const slug = newsItem.slug || createSlug(newsItem.judul || newsItem.title || "untitled");
    console.log("HandleNewsClick - News ID:", newsId, "Slug:", slug, "Title:", newsItem.judul || newsItem.title || "untitled");
    console.log("Auth state:", user ? user.uid : "Unauthenticated");

    if (!slug || slug.trim() === "") {
      console.error("Invalid slug for news item:", newsItem);
      toast.error("Slug berita tidak valid.");
      return;
    }

    if (!newsId) {
      console.error("Missing news ID for item:", newsItem);
      toast.error("ID berita tidak valid.");
      return;
    }

    console.log(`Navigating to: /berita/${slug}`);

    if (!user) {
      console.log("User not authenticated, skipping view update");
      navigate(`/berita/${slug}`);
      return;
    }

    try {
      const newsRef = doc(db, "news", newsId);
      const newsSnap = await getDoc(newsRef);
      if (!newsSnap.exists()) {
        console.error("News document does not exist for ID:", newsId);
        navigate(`/berita/${slug}`);
        return;
      }
      if (!newsSnap.data().hasOwnProperty("views")) {
        console.log("Initializing views for news ID:", newsId);
        await updateDoc(newsRef, { views: 0 });
      }

      try {
        await updateDoc(newsRef, { views: increment(1) });
        console.log("View count updated successfully for news ID:", newsId);
      } catch (incrementError) {
        console.warn("Increment failed, trying manual update:", incrementError);
        const currentViews = newsSnap.data().views || 0;
        await updateDoc(newsRef, { views: currentViews + 1 });
        console.log("Manual view count update successful for news ID:", newsId);
      }
    } catch (error) {
      console.error("Error updating views:", {
        message: error.message,
        code: error.code,
        details: error.details,
        newsId,
      });
      toast.error("Gagal memperbarui jumlah tampilan.");
    }
    navigate(`/berita/${slug}`);
  };

  const LoadingSkeleton = () => (
    <div className="container mx-auto px-4 sm:px-6 lg:px-16 mt-8">
      <div className="flex space-x-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-full w-24 animate-pulse"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column skeleton */}
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
        {/* Center skeleton - big */}
        <div className="space-y-3">
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
        {/* Right column skeleton */}
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 mt-8">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Berita</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchNews}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (newsData.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 mt-8">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada berita</h3>
          <p className="text-gray-500">Berita terbaru akan muncul di sini</p>
        </div>
      </div>
    );
  }

  const categories = ["Semua", ...new Set(newsData.map((item) => item.kategori || "Umum"))];

  const formatDate = (timestamp) => {
    if (!timestamp) return "Tanggal tidak tersedia";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Tanggal tidak valid";
    }
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000) return Math.floor(views / 1000000) + "M";
    if (views >= 1000) return Math.floor(views / 1000) + "K";
    return views.toString();
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Berita Terkini
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Dapatkan informasi terbaru dan terpercaya dari berbagai kategori
          </p>
        </div>
        <div className="mb-10">
          <div className="flex items-center justify-center">
            <div className="flex overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex space-x-2 mx-auto">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 whitespace-nowrap ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {filteredNews.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada berita</h3>
            <p className="text-gray-500">Tidak ada berita dalam kategori "{selectedCategory}"</p>
            <button
              onClick={() => handleCategoryChange("Semua")}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Lihat Semua Berita
            </button>
          </div>
        )}
        {filteredNews.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Left column - 2 items */}
            <div className="space-y-6">
              {filteredNews.slice(0, 2).map((item, index) => (
                <article
                  key={item.id || index}
                  className="group cursor-pointer"
                  onClick={() => handleNewsClick(item)}
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop"}
                        alt={item.judul || item.title || "Berita"}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop";
                          console.warn(`Failed to load image for news ID: ${item.id}`);
                        }}
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-full">
                          {item.kategori || "Berita"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {item.judul || item.title || "Tanpa Judul"}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.ringkasan || item.konten?.replace(/<[^>]+>/g, "").substring(0, 100) + "..." || "Ringkasan tidak tersedia"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(item.createdAt)}</span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {formatViews(item.views)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Center column - 1 big item */}
            {filteredNews[2] && (
              <article
                className="group cursor-pointer"
                onClick={() => handleNewsClick(filteredNews[2])}
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1 h-full">
                  <div className="relative overflow-hidden">
                    <img
                      src={filteredNews[2].gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop"}
                      alt={filteredNews[2].judul || filteredNews[2].title || "Berita"}
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop";
                        console.warn(`Failed to load image for news ID: ${filteredNews[2].id}`);
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                        {filteredNews[2].kategori || "Berita"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {filteredNews[2].judul || filteredNews[2].title || "Tanpa Judul"}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {filteredNews[2].ringkasan || filteredNews[2].konten?.replace(/<[^>]+>/g, "").substring(0, 150) + "..." || "Ringkasan tidak tersedia"}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(filteredNews[2].createdAt)}</span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {formatViews(filteredNews[2].views)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Right column - 2 items */}
            <div className="space-y-6">
              {filteredNews.slice(3, 5).map((item, index) => (
                <article
                  key={item.id || (index + 3)}
                  className="group cursor-pointer"
                  onClick={() => handleNewsClick(item)}
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop"}
                        alt={item.judul || item.title || "Berita"}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop";
                          console.warn(`Failed to load image for news ID: ${item.id}`);
                        }}
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-full">
                          {item.kategori || "Berita"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {item.judul || item.title || "Tanpa Judul"}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.ringkasan || item.konten?.replace(/<[^>]+>/g, "").substring(0, 100) + "..." || "Ringkasan tidak tersedia"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(item.createdAt)}</span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {formatViews(item.views)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 md:p-12 text-center">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ingin mengiklankan produk Anda?
            </h3>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Jangkau lebih banyak pelanggan dengan memasang iklan di platform berita terpercaya kami
            </p>
            <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-100 transition-colors duration-300 shadow-lg hover:shadow-xl">
              Hubungi Kami
            </button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        </div>
      </div>
    </div>
  );
};

export default NewsSection;