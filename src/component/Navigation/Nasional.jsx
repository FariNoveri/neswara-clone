import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseconfig.js";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

const Nasional = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const CATEGORY = "NASIONAL";

  useEffect(() => {
    setIsLoading(true);
    try {
      const collectionRef = collection(db, "news");
      const q = query(
        collectionRef,
        where("category", "==", CATEGORY),
        where("isActive", "==", true),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNews(newsData);
        setIsLoading(false);
        setError(null);
      }, (err) => {
        console.error("Firestore onSnapshot error (Nasional):", {
          message: err.message || "Unknown error",
          code: err.code || "No code",
          details: err.details || "No details",
        });
        setError(err.message || "Failed to fetch news");
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error in fetchNews (Nasional):", {
        message: err.message || "Unknown error",
        code: err.code || "No code",
        details: err.details || "No details",
      });
      setError(err.message || "Failed to fetch news");
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <style jsx>{`
        @keyframes fadePulse {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
        .no-news-container {
          animation: fadePulse 2s infinite ease-in-out;
        }
      `}</style>

      {isLoading ? (
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl text-blue-500">🌀</div>
          <p className="mt-2 text-gray-600">Memuat berita...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : news.length === 0 ? (
        <div className="no-news-container text-center py-12">
          <div className="text-6xl text-gray-400 mb-4 animate-[pulse_2s_infinite]">📰</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Tidak Ada Berita</h2>
          <p className="text-gray-500">Belum ada berita untuk kategori Nasional. Silakan cek kembali nanti!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link
              key={item.id}
              to={`/berita/${item.id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Nasional;
