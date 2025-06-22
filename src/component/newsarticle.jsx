import React, { useState, useEffect } from "react";
import { FaComment, FaFacebook, FaInstagram, FaYoutube, FaEye, FaCalendar } from "react-icons/fa";
import { db } from "../firebaseconfig";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

const NewsArticle = () => {
  const [latestNews, setLatestNews] = useState([]);
  const [popularNews, setPopularNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Fetch latest news
        const latestQuery = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(4));
        const latestSnapshot = await getDocs(latestQuery);
        const latestData = latestSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch popular news
        const popularQuery = query(collection(db, "news"), orderBy("views", "desc"), limit(4));
        const popularSnapshot = await getDocs(popularQuery);
        const popularData = popularSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Format latest news
        const formattedLatest = latestData.map((item) => ({
          id: item.id,
          title: item.judul || "Judul tidak tersedia",
          description: item.ringkasan || item.konten?.substring(0, 150) + "..." || "Deskripsi tidak tersedia",
          image: item.gambar || "https://source.unsplash.com/600x400/?news",
          date: item.createdAt?.seconds
            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Baru",
          author: item.author || "Admin",
          comments: item.komentar || 0,
          views: item.views || 0,
          category: item.kategori || "Umum",
          link: `/news/${item.id}`,
        }));

        // Format popular news
        const formattedPopular = popularData.map((item) => ({
          id: item.id,
          title: item.judul || "Judul tidak tersedia",
          date: item.createdAt?.seconds
            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Baru",
          comments: item.komentar || 0,
          views: item.views || 0,
          link: `/news/${item.id}`,
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

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubscribe = () => {
    if (!email) {
      setEmailError("Email harus diisi.");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Masukkan email yang valid.");
      return;
    }
    // Logika untuk menyimpan email ke database
    alert(`Terima kasih! Email ${email} telah berlangganan newsletter.`);
    setEmail("");
    setEmailError("");
  };

  const LoadingCard = () => (
    <div className="bg-white p-4 rounded-lg shadow animate-pulse">
      <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-40 h-40 bg-gray-200 rounded-lg"></div>
        <div className="flex-grow space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto py-12 px-4">
      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            {[1, 2, 3, 4].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest News */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Berita Terbaru</h2>
              <button
                className="text-blue-600 hover:underline text-sm font-medium"
                onClick={() => navigate("/news")}
              >
                Lihat Semua
              </button>
            </div>
            {latestNews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-5xl mb-4">📰</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Belum Ada Berita</h3>
                <p className="text-gray-500">Cek kembali nanti untuk pembaruan terbaru.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {latestNews.map((news) => (
                  <article
                    key={news.id}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-4"
                  >
                    <div className="w-full md:w-40 h-40 flex-shrink-0 relative overflow-hidden rounded-lg group">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => (e.target.src = "https://source.unsplash.com/600x400/?news")}
                      />
                      <span className="absolute top-2 left-2 border border-blue-600 text-blue-600 text-xs px-2 py-1 rounded font-medium">
                        {news.category}
                      </span>
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div>
                        <Link to={news.link}>
                          <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors mb-2">
                            {news.title}
                          </h3>
                        </Link>
                        <p className="text-base text-gray-600 mb-4 line-clamp-3">{news.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>By {news.author}</span>
                          <span className="flex items-center">
                            <FaEye className="mr-1" /> {news.views}
                          </span>
                          <span className="flex items-center">
                            <FaCalendar className="mr-1" /> {news.date}
                          </span>
                        </div>
                        <span className="flex items-center text-blue-600">
                          <FaComment className="mr-1" /> {news.comments}
                        </span>
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
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Berita Populer</h2>
                <span className="text-sm text-gray-500">({popularNews.length})</span>
              </div>
              {popularNews.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm text-gray-500">Belum ada berita populer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {popularNews.map((news, index) => (
                    <div
                      key={news.id}
                      className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <FaEye className="mr-1" /> {news.views}
                        </span>
                      </div>
                      <Link to={news.link}>
                        <h3 className="text-base font-bold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
                          {news.title}
                        </h3>
                      </Link>
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                        <span>{news.date}</span>
                        <span className="flex items-center">
                          <FaComment className="mr-1" /> {news.comments}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter Subscription */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Langganan Newsletter</h3>
              <p className="text-sm text-gray-600 mb-4">Dapatkan berita terbaru langsung di inbox Anda.</p>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className="w-full border border-gray-200 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>
              <button
                onClick={handleSubscribe}
                className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Subscribe Sekarang
              </button>
              <div className="flex justify-center space-x-6 mt-6">
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors" aria-label="Facebook">
                  <FaFacebook className="text-xl" />
                </a>
                <a href="#" className="text-gray-600 hover:text-pink-600 transition-colors" aria-label="Instagram">
                  <FaInstagram className="text-xl" />
                </a>
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors" aria-label="YouTube">
                  <FaYoutube className="text-xl" />
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