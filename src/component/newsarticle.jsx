import React, { useState, useEffect } from "react";
import { FaComment, FaFacebook, FaInstagram, FaYoutube, FaEye, FaCalendar } from "react-icons/fa";
import { db } from "../firebaseconfig";
import { collection, getDocs, orderBy, query, limit, where } from "firebase/firestore";

const NewsArticle = () => {
  const [latestNews, setLatestNews] = useState([]);
  const [popularNews, setPopularNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Fetch latest news
        const latestQuery = query(
          collection(db, "news"), 
          orderBy("createdAt", "desc"), 
          limit(4)
        );
        const latestSnapshot = await getDocs(latestQuery);
        const latestData = latestSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch popular news (berdasarkan views atau komentar)
        const popularQuery = query(
          collection(db, "news"), 
          orderBy("views", "desc"), 
          limit(4)
        );
        const popularSnapshot = await getDocs(popularQuery);
        const popularData = popularSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Format latest news
        const formattedLatest = latestData.map(item => ({
          id: item.id,
          title: item.judul || "Judul tidak tersedia",
          description: item.ringkasan || item.konten?.substring(0, 150) + "..." || "Deskripsi tidak tersedia",
          image: item.gambar || `https://source.unsplash.com/600x400/?${item.kategori || 'news'}`,
          date: item.createdAt?.seconds 
            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short', 
                year: 'numeric'
              })
            : "Baru",
          author: item.author || "Admin",
          comments: item.komentar || 0,
          views: item.views || 0,
          category: item.kategori || "Umum",
          link: `/news/${item.id}`
        }));

        // Format popular news
        const formattedPopular = popularData.map(item => ({
          id: item.id,
          title: item.judul || "Judul tidak tersedia",
          date: item.createdAt?.seconds 
            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : "Baru",
          comments: item.komentar || 0,
          views: item.views || 0,
          link: `/news/${item.id}`
        }));

        setLatestNews(formattedLatest);
        setPopularNews(formattedPopular);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching news:", error);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleSubscribe = () => {
    if (email) {
      // Di sini Anda bisa menambahkan logika untuk menyimpan email ke database
      alert(`Terima kasih! Email ${email} telah berlangganan newsletter.`);
      setEmail("");
    } else {
      alert("Mohon masukkan email yang valid");
    }
  };

  const LoadingCard = () => (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md animate-pulse">
      <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="w-full md:w-48 h-48 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        <div className="flex-grow space-y-3">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="max-w-6xl mx-auto my-8 px-4 relative">
      {/* Background Box */}
      <div className="absolute inset-0 bg-white dark:bg-gray-800 shadow-lg rounded-lg -z-10 p-6"></div>

      {/* Header */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold">Saran Berita</h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
            {[1, 2, 3, 4].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {/* Latest News Column */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Berita Terbaru
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {latestNews.length} berita
              </span>
            </div>
            
            {latestNews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📰</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Belum ada berita terbaru
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Admin belum menambahkan berita. Silakan cek kembali nanti.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {latestNews.map((news, index) => (
                  <article
                    key={news.id}
                    className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6"
                  >
                    {/* Image */}
                    <div className="w-full md:w-56 h-48 flex-shrink-0 relative group">
                      <img
                        src={news.image?.trim() ? news.image.trim() : "https://source.unsplash.com/600x400/?news"}
                        alt={news.title}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "https://source.unsplash.com/600x400/?news";
                        }}
                      />
                      {/* Category Badge */}
                      <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {news.category}
                      </span>
                      {/* Date Badge */}
                      <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                        <FaCalendar className="mr-1" />
                        {news.date}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 hover:text-green-600 transition-colors">
                          <a href={news.link}>
                            {news.title}
                          </a>
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                          {news.description}
                        </p>
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">By {news.author}</span>
                          <span className="flex items-center">
                            <FaEye className="mr-1" />
                            {news.views}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                          <FaComment className="text-green-600" />
                          <span className="font-medium">{news.comments}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular News */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                🔥 Popular Now
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({popularNews.length})
                </span>
              </h2>
              
              {popularNews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Belum ada berita populer
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {popularNews.map((news, index) => (
                    <div 
                      key={news.id} 
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <div className="flex items-center text-xs text-gray-500 space-x-2">
                          <span className="flex items-center">
                            <FaEye className="mr-1" />
                            {news.views}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 leading-tight hover:text-green-600 transition-colors">
                        <a href={news.link}>
                          {news.title}
                        </a>
                      </h3>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>{news.date}</span>
                        <span className="flex items-center">
                          <FaComment className="mr-1" />
                          {news.comments}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter Subscription */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                📧 Follow @farinoveri
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Dapatkan berita terbaru langsung di email Anda
              </p>
              
              {/* Email Input */}
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-4 py-3 rounded-md text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Subscribe Button */}
              <button 
                onClick={handleSubscribe}
                className="w-full bg-green-500 text-white py-3 rounded-md text-sm font-semibold hover:bg-green-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Subscribe Now
              </button>
              
              {/* Social Media Icons */}
              <div className="flex justify-center space-x-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a 
                  href="#" 
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110"
                  title="Facebook"
                >
                  <FaFacebook className="text-2xl" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-600 dark:text-gray-400 hover:text-pink-600 transition-colors transform hover:scale-110"
                  title="Instagram"
                >
                  <FaInstagram className="text-2xl" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors transform hover:scale-110"
                  title="YouTube"
                >
                  <FaYoutube className="text-2xl" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NewsArticle;