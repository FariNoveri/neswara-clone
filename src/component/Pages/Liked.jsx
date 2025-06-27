import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { FaHeart, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Liked = () => {
  const { currentUser } = useAuth();
  const [likedNews, setLikedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLikedNews = async () => {
      if (!currentUser) {
        setLikedNews([]);
        setLoading(false);
        return;
      }

      try {
        setError(null);
        // Fetch all news documents
        const newsSnapshot = await getDocs(collection(db, 'news'));
        const likedNewsData = [];

        // Iterate through each news document to check its likes subcollection
        const newsPromises = newsSnapshot.docs.map(async (newsDoc) => {
          try {
            const likesQuery = query(
              collection(db, 'news', newsDoc.id, 'likes'),
              where('userId', '==', currentUser.uid)
            );
            const likesSnapshot = await getDocs(likesQuery);

            if (!likesSnapshot.empty) {
              // User liked this news item
              const newsData = {
                id: newsDoc.id,
                ...newsDoc.data(),
                judul: newsDoc.data().judul || 'Tanpa Judul',
                ringkasan: newsDoc.data().konten ? newsDoc.data().konten.replace(/<[^>]+>/g, '').substring(0, 200) : 'No summary available',
                author: newsDoc.data().author || 'Admin',
                createdAt: newsDoc.data().createdAt || { seconds: new Date().getTime() / 1000 },
                views: newsDoc.data().views || 0,
                gambar: newsDoc.data().gambar || 'https://via.placeholder.com/400x200',
                gambarDeskripsi: newsDoc.data().gambarDeskripsi || 'Gambar utama',
              };
              return newsData;
            }
            return null;
          } catch (err) {
            console.warn(`Error fetching likes for news ${newsDoc.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(newsPromises);
        likedNewsData.push(...results.filter(n => n !== null));

        setLikedNews(likedNewsData);
        if (likedNewsData.length === 0) {
          setError("Anda belum menyukai berita apa pun atau berita yang disukai telah dihapus.");
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
    e.stopPropagation(); // Prevent navigation when clicking Unlike
    if (!currentUser) {
      toast.warn('Silakan masuk untuk menghapus suka.');
      return;
    }

    try {
      const likeRef = doc(db, 'news', newsId, 'likes', currentUser.uid);
      await deleteDoc(likeRef);
      setLikedNews(likedNews.filter(item => item.id !== newsId));
      toast.success('Berita dihapus dari daftar suka.');
    } catch (error) {
      console.error('Error unliking news:', error);
      setError('Gagal menghapus suka. Silakan coba lagi.');
      toast.error('Gagal menghapus suka.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
          <FaHeart className="text-4xl text-red-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Anda Belum Login</h1>
          <p className="text-gray-600 mb-4">Silakan login untuk melihat berita yang Anda sukai.</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Yang Anda Like
        </h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 animate-in fade-in duration-500">
            <p>{error}</p>
          </div>
        )}
        {likedNews.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
            <FaHeart className="text-4xl text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 text-lg">Anda belum menyukai berita apa pun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedNews.map((news) => (
              <Link
                key={news.id}
                to={`/berita/${news.id}`}
                className="block bg-white rounded-xl shadow-md p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                style={{ animation: 'fadeIn 0.5s ease-out' }}
              >
                <div className="relative w-full bg-slate-200 rounded-2xl overflow-hidden shadow-lg mb-4" 
                     style={{ aspectRatio: '16/9' }}>
                  <img
                    src={news.gambar}
                    alt={news.gambarDeskripsi}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 truncate">{news.judul}</h2>
                <p className="text-gray-600 mt-2 line-clamp-2">{news.ringkasan}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {news.author} • {news.createdAt?.seconds ? new Date(news.createdAt.seconds * 1000).toLocaleDateString() : 'Baru'}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={(e) => handleUnlike(e, news.id)}
                    className="text-red-500 hover:text-red-700 flex items-center font-medium transition-colors duration-200"
                  >
                    <FaTrash className="h-5 w-5 mr-2" /> Unlike
                  </button>
                  <span className="text-sm text-gray-600 font-medium">{news.views || 0} views</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Liked;