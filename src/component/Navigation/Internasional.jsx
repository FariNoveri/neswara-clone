import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseconfig.js";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

const Internasional = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const CATEGORY = "INTERNASIONAL";

  useEffect(() => {
    const fetchNews = async () => {
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
          const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNews(newsData);
          setIsLoading(false);
        }, (error) => {
          console.error("Firestore onSnapshot error (Internasional):", {
            message: error.message || "Unknown error",
            code: error.code || "No code",
            stack: error.stack || "No stack trace",
          });
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error in fetchNews:", {
          message: error.message || "Unknown error",
          code: error.code || "No code",
          stack: error.stack || "No stack trace",
        });
        setIsLoading(false);
      }
    };

    fetchNews();
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
      ) : news.length === 0 ? (
        <div className="no-news-container text-center py-12">
          <div className="text-6xl text-gray-400 mb-4 animate-[pulse_2s_infinite]">📰</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Tidak Ada Berita</h2>
          <p className="text-gray-500">Belum ada berita untuk kategori Internasional. Silakan cek kembali nanti!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link
              key={item.id}
              to={`/berita/${item.id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3">{item.content}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Internasional;
