import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import LikeButton from "../LikeButton";
import CommentBox from "../CommentBox";
import { useAuth } from "../Hooks/useAuth";

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "news", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setNews({ 
            id: snapshot.id, 
            ...snapshot.data(),
            title: snapshot.data().judul || "Tanpa Judul",
            content: snapshot.data().konten || "Konten belum ditulis.",
            image: snapshot.data().gambar || null,
            imageDescription: snapshot.data().gambarDeskripsi || "Gambar utama"
          });
          if (currentUser) {
            await updateDoc(docRef, {
              views: increment(1),
            });
          }
        } else {
          setError("Berita tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching news or updating views:", err.message);
        setError("Gagal memuat berita. Silakan coba lagi.");
      }
      setLoading(false);
    };
    fetchNews();
  }, [id, currentUser]);

  if (loading) {
    return <p className="text-center py-10 text-white">Memuat berita...</p>;
  }
  if (error) {
    return <p className="text-center py-10 text-white">{error}</p>;
  }
  if (!news) {
    return <p className="text-center py-10 text-white">Berita tidak ditemukan.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-orange-400 mb-6 hover:underline"
        >
          ← Kembali
        </button>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3">{news.title}</h1>
        <div className="text-sm text-gray-400 mb-6">
          Oleh <span className="font-medium text-white">{news.author || "Admin"}</span> •{" "}
          {news.views || 0} views
        </div>

        {news.image && (
          <img
            src={news.image}
            alt={news.imageDescription}
            className="w-full max-h-[400px] object-cover rounded-lg mb-6 mx-auto"
          />
        )}

        <div className="overflow-y-auto overflow-x-hidden max-h-[60vh] prose prose-invert max-w-prose text-gray-100 text-lg leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: news.content }} />
        </div>

        <LikeButton newsId={id} currentUserId={currentUser?.uid || "anonim"} />
        <hr className="border-gray-600 my-8" />
        <CommentBox newsId={id} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default NewsDetail;