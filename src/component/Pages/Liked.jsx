import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ArrowLeft, Newspaper, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const Liked = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [likedNews, setLikedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLikedNews = async () => {
      if (!currentUser) {
        setLikedNews([]);
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const newsSnapshot = await getDocs(collection(db, 'news'));
        const likedNewsData = [];

        const newsPromises = newsSnapshot.docs.map(async (newsDoc) => {
          try {
            const likesQuery = query(
              collection(db, 'news', newsDoc.id, 'likes'),
              where('userId', '==', currentUser.uid)
            );
            const likesSnapshot = await getDocs(likesQuery);

            if (!likesSnapshot.empty) {
              const newsData = newsDoc.data();
              return {
                id: newsDoc.id,
                slug: newsData.slug || newsData.judul || newsData.title || 'untitled',
                judul: newsData.judul || newsData.title || 'Tanpa Judul',
                ringkasan:
                  newsData.ringkasan ||
                  (newsData.konten ? newsData.konten.replace(/<[^>]+>/g, '').substring(0, 200) + '...' : 'Ringkasan tidak tersedia'),
                author: newsData.author || 'Admin',
                createdAt: newsData.createdAt || new Date(),
                views: newsData.views || 0,
                gambar: newsData.gambar || 'https://via.placeholder.com/400x200',
                gambarDeskripsi: newsData.gambarDeskripsi || 'Gambar utama',
                kategori: newsData.kategori || 'Berita',
              };
            }
            return null;
          } catch (err) {
            console.warn(`Error fetching likes for news ${newsDoc.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(newsPromises);
        likedNewsData.push(...results.filter((n) => n !== null));

        setLikedNews(likedNewsData);
        if (likedNewsData.length === 0) {
          setError('Anda belum menyukai berita apa pun atau berita yang disukai telah dihapus.');
        }
      } catch (error) {
        console.error('Error fetching liked news:', error);
        setError('Gagal memuat berita yang disukai. Silakan coba lagi.');
        toast.error('Gagal memuat berita yang disukai.');
      } finally {
        setLoading(false);
      }
    };

    fetchLikedNews();
  }, [currentUser]);

  const handleUnlike = async (e, newsId) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentUser) {
      setError('Silakan login untuk menghapus suka.');
      toast.warn('Silakan login untuk menghapus suka.');
      return;
    }

    try {
      const likeRef = doc(db, 'news', newsId, 'likes', currentUser.uid);
      await deleteDoc(likeRef);
      setLikedNews((prev) => prev.filter((item) => item.id !== newsId));
      toast.success('Berita dihapus dari daftar suka.', {
        position: 'top-center',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error unliking news:', error);
      setError('Gagal menghapus suka: ' + error.message);
      toast.error('Gagal menghapus suka: ' + error.message);
    }
  };

  // Filter and sort news
  const filteredNews = likedNews
    .filter((news) => news.judul.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'title-asc') {
        return a.judul.localeCompare(b.judul);
      } else if (sortBy === 'title-desc') {
        return b.judul.localeCompare(a.judul);
      } else if (sortBy === 'date-asc') {
        return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
      } else {
        // Default: date-desc
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      }
    });

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 w-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="h-12 w-48 bg-white/10 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white/10 rounded-2xl shadow-lg animate-pulse">
              <div className="h-48 bg-white/20 rounded-t-2xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-white/20 rounded"></div>
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform animate-scaleIn">
          <Heart className="text-4xl text-red-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Anda Belum Login</h1>
          <p className="text-white/80 mb-4">Silakan login untuk melihat berita yang Anda sukai.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:scale-105 transform shadow-lg"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="group flex items-center text-white/70 hover:text-white transition-all duration-300 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Kembali ke Profil
          </button>
          <div className="text-right">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Berita yang Anda Sukai
            </h1>
            <p className="text-white/60 mt-1">Lihat dan kelola berita yang Anda sukai</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-2xl mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              {error}
            </div>
          </div>
        )}

        {/* Search and Sort Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500 animate-slideUp mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Search className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Cari & Urutkan</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 transition-colors duration-200 group-focus-within:text-purple-400" />
              <input
                type="text"
                placeholder="Cari berita berdasarkan judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 w-full"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 cursor-pointer"
            >
              <option value="date-desc">Terbaru</option>
              <option value="date-asc">Terlama</option>
              <option value="title-asc">Judul A-Z</option>
              <option value="title-desc">Judul Z-A</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/60 mt-6">
            <Newspaper className="w-4 h-4" />
            <span>Menampilkan {filteredNews.length} dari {likedNews.length} berita</span>
          </div>
        </div>

        {filteredNews.length === 0 ? (
          <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl transform animate-scaleIn">
            <Heart className="mx-auto text-white/40 text-4xl mb-4 opacity-50" />
            <p className="text-white/80 text-lg">Anda belum menyukai berita apa pun.</p>
            <Link
              to="/"
              className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:scale-105 transform shadow-lg"
            >
              Jelajahi Berita
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((news, index) => (
              <div
                key={news.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link to={`/berita/${news.slug}`}>
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <img
                      src={news.gambar}
                      alt={news.gambarDeskripsi}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x200';
                        console.warn(`Failed to load image for news ID: ${news.id}`);
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-full">
                        {news.kategori}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">{news.judul}</h3>
                    <p className="text-white/80 text-sm mt-2 line-clamp-3">{news.ringkasan}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                      <span>
                        {news.createdAt?.toDate
                          ? news.createdAt.toDate().toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Tanggal tidak tersedia'}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {news.views || 0}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-4 pt-0">
                  <button
                    onClick={(e) => handleUnlike(e, news.id)}
                    className="flex items-center text-red-400 hover:text-red-500 text-sm font-medium transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-in {
          animation-fill-mode: forwards;
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
    </div>
  );
};

export default Liked;
