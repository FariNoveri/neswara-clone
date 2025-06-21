import React, { useState, useEffect } from 'react';
import { Clock, User, MessageCircle, Eye } from 'lucide-react';
import { db } from "../firebaseconfig";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const NewsPage = () => {
  const [newsData, setNewsData] = useState([]);
  const [popularNews, setPopularNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const postsQuery = query(
      collection(db, 'news'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        setNewsData(posts);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching posts:', err);
        setError('Gagal memuat berita');
        setLoading(false);
      }
    );

    const popularQuery = query(
      collection(db, 'news'),
      orderBy('views', 'desc'),
      limit(4)
    );

    const unsubscribePopular = onSnapshot(
      popularQuery,
      (snapshot) => {
        const popular = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        setPopularNews(popular);
      },
      (err) => {
        console.error('Error fetching popular news:', err);
      }
    );

    return () => {
      unsubscribePosts();
      unsubscribePopular();
    };
  }, []);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'PEMERINTAHAN': 'bg-blue-600',
      'BERITA': 'bg-green-600',
      'KEAMANAN': 'bg-red-600',
      'KESEHATAN': 'bg-purple-600',
      'TEKNOLOGI': 'bg-indigo-600',
      'OLAHRAGA': 'bg-yellow-600',
      'EKONOMI': 'bg-teal-600',
      'POLITIK': 'bg-pink-600',
    };
    return colors[category?.toUpperCase()] || 'bg-gray-600';
  };

  const getImageUrl = (news) => {
    const url = news.imageUrl || news.image || news.gambar;
    return typeof url === "string" && url.trim()
      ? url.trim()
      : "https://source.unsplash.com/600x400/?news";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat berita...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {newsData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Belum ada berita tersedia</p>
              </div>
            ) : (
              <div className="space-y-6">
                {newsData.map((news, index) => (
                  <div
                    key={news.id}
                    className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/berita/${news.id}`)}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <img
                          src={getImageUrl(news)}
                          alt={news.title || "Gambar berita"}
                          className="w-full h-48 md:h-32 object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://source.unsplash.com/600x400/?news";
                          }}
                        />
                      </div>
                      <div className="md:w-2/3 p-4">
                        <div className="flex items-center mb-2 space-x-2">
                          <span className={`${getCategoryColor(news.category)} text-xs px-2 py-1 rounded text-white font-semibold`}>
                            {news.category || 'BERITA'}
                          </span>
                          {index === 0 && (
                            <span className="bg-red-600 text-xs px-2 py-1 rounded text-white font-semibold">
                              TERBARU
                            </span>
                          )}
                          {news.featured && (
                            <span className="bg-yellow-600 text-xs px-2 py-1 rounded text-white font-semibold">
                              UNGGULAN
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold mb-3 text-white hover:text-orange-400 transition-colors line-clamp-2">
                          {news.title}
                        </h2>
                        {news.summary && (
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {news.summary}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-gray-400 space-x-4 flex-wrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>{news.author || news.authorName || 'Admin'}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{formatTimeAgo(news.createdAt)}</span>
                          </div>
                          {news.comments && (
                            <div className="flex items-center">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              <span>{news.comments}</span>
                            </div>
                          )}
                          {news.views && (
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              <span>{news.views}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-6 text-orange-400">BERITA POPULER</h3>
              {popularNews.length === 0 ? (
                <p className="text-gray-400 text-sm">Belum ada berita populer</p>
              ) : (
                <div className="space-y-4">
                  {popularNews.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 pb-4 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-700 p-2 rounded transition-colors"
                      onClick={() => navigate(`/berita/${item.id}`)}
                    >
                      <div className="flex-shrink-0">
                        <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white hover:text-orange-400 transition-colors mb-1 line-clamp-3">
                          {item.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-400 space-x-2">
                          <span>{formatTimeAgo(item.createdAt)}</span>
                          {item.views && (
                            <>
                              <span>•</span>
                              <div className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                <span>{item.views}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sponsor */}
            <div className="bg-gray-800 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-bold mb-4 text-orange-400">FOLLOW SPONSOR</h3>
              <div className="space-y-2">
                <button className="w-full bg-orange-600 hover:bg-orange-700 p-3 rounded text-sm transition-colors font-semibold">
                  SUBSCRIBE NOW
                </button>
                <button className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded text-sm transition-colors">
                  IKLAN DISINI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
