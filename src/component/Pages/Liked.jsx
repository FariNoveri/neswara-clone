import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { db } from '../../firebaseconfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { FaHeart, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Liked = () => {
  const { currentUser } = useAuth();
  const [likedNews, setLikedNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedNews = async () => {
      if (!currentUser) {
        setLikedNews([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const likes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const newsPromises = likes.map(async (like) => {
          const newsDoc = await getDocs(query(collection(db, 'news'), where('id', '==', like.newsId)));
          const newsData = newsDoc.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          return newsData[0] || null;
        });
        const newsData = (await Promise.all(newsPromises)).filter(n => n !== null);
        setLikedNews(newsData);
      } catch (error) {
        console.error('Error fetching liked news:', error);
      }
      setLoading(false);
    };

    fetchLikedNews();
  }, [currentUser]);

  const handleUnlike = async (newsId) => {
    if (!currentUser) return;

    try {
      const q = query(collection(db, 'likes'), where('userId', '==', currentUser.uid), where('newsId', '==', newsId));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      setLikedNews(likedNews.filter(item => item.id !== newsId));
    } catch (error) {
      console.error('Error unliking news:', error);
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
            onClick={() => {}}
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
        {likedNews.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
            <FaHeart className="text-4xl text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 text-lg">Anda belum menyukai berita apa pun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedNews.map((news) => (
              <div
                key={news.id}
                className="bg-white rounded-xl shadow-md p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animation: 'fadeIn 0.5s ease-out' }}
              >
                <h2 className="text-xl font-semibold text-gray-800 truncate">{news.judul}</h2>
                <p className="text-gray-600 mt-2 line-clamp-2">{news.ringkasan}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {news.author} • {news.createdAt?.seconds ? new Date(news.createdAt.seconds * 1000).toLocaleDateString() : 'Baru'}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => handleUnlike(news.id)}
                    className="text-red-500 hover:text-red-700 flex items-center font-medium transition-colors duration-200"
                  >
                    <FaTrash className="h-5 w-5 mr-2" /> Unlike
                  </button>
                  <span className="text-sm text-gray-600 font-medium">{news.views || 0} views</span>
                </div>
              </div>
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
