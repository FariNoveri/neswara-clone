import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Function to create a slug from a string
const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
};

const Ekonomi = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const CATEGORY = "Ekonomi";

  // Ambil data berita
  const fetchNews = async () => {
    setLoading(true);
    try {
      console.log("Initializing fetchNews for category:", CATEGORY);
      const collectionRef = collection(db, "news");
      const q = query(
        collectionRef,
        where("kategori", "==", CATEGORY),
        // where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );
      console.log("Query constructed:", q);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("Snapshot received, docs count:", snapshot.docs.length);
        const newsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("Mapped data:", newsData);
        setNewsData(newsData);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error(`Firestore onSnapshot error (${CATEGORY}):`, {
          message: err.message,
          code: err.code,
          details: err.details,
        });
        setError(err.message || "Failed to fetch news");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(`Error in fetchNews (${CATEGORY}):`, {
        message: err.message,
        code: err.code,
        details: err.details,
      });
      setError(err.message || "Failed to fetch news");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handle klik berita
  const handleNewsClick = async (newsId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log("Auth state for view update:", user ? user.uid : "Unauthenticated");

    const item = newsData.find((n) => n.id === newsId);
    if (!item) {
      console.error("News item not found for ID:", newsId);
      navigate(`/berita/${newsId}`); // Fallback to id if item not found
      return;
    }

    const slug = item.slug || createSlug(item.judul || item.title || 'untitled');
    console.log("Navigating to slug:", slug);

    if (!user) {
      console.log("User not authenticated, skipping view update");
      navigate(`/berita/${slug}`);
      return;
    }

    try {
      await user.getIdToken(true);
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
      } catch (incrementError) {
        console.warn("Increment failed, trying manual update:", incrementError);
        const currentViews = newsSnap.data().views || 0;
        await updateDoc(newsRef, { views: currentViews + 1 });
      }
      
      console.log("View count updated successfully for news ID:", newsId);
    } catch (error) {
      console.error("Error updating views:", {
        message: error.message,
        code: error.code,
        details: error.details,
        newsId,
      });
    }
    navigate(`/berita/${slug}`);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="container mx-auto px-4 sm:px-6 lg:px-16 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 lg:row-span-2">
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="mt-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Format tanggal
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Format jumlah views
  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return Math.floor(views / 1000000) + 'M';
    if (views >= 1000) return Math.floor(views / 1000) + 'K';
    return views.toString();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 mt-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-500">{error}</p>
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
          <p className="text-gray-500">Belum ada berita untuk kategori {CATEGORY.toLowerCase()}.</p>
        </div>
      </div>
    );
  }

  const featuredNews = newsData[0];
  const sideNews = newsData.slice(1, 7);

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {featuredNews && (
            <article 
              className="lg:col-span-2 lg:row-span-2 group cursor-pointer"
              onClick={() => handleNewsClick(featuredNews.id)}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500">
                <img
                  src={featuredNews.gambar || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop"}
                  alt={featuredNews.judul || featuredNews.title}
                  className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                    {featuredNews.kategori || 'Berita'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-3 line-clamp-3 group-hover:text-blue-200 transition-colors">
                    {featuredNews.judul || featuredNews.title}
                  </h2>
                  <p className="text-gray-300 mb-4 line-clamp-2">
                    {featuredNews.ringkasan || featuredNews.description || featuredNews.konten?.substring(0, 150) + '...'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{formatDate(featuredNews.createdAt)}</span>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                        </svg>
                        {formatViews(featuredNews.views)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}
          {sideNews.map((item, index) => (
            <article 
              key={item.id || index}
              className="group cursor-pointer"
              onClick={() => handleNewsClick(item.id)}
            >
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
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
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
    </div>
  );
};

export default Ekonomi;