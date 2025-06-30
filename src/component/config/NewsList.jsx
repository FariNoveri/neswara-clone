import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { collection, getDocs } from "firebase/firestore";
import { createSlug } from "../config/slug";

const NewsList = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsSnapshot = await getDocs(collection(db, "news"));
        const newsData = newsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`News ID: ${doc.id}, Slug: ${data.slug || "none"}, Title: ${data.judul || data.title || "untitled"}`);
          return {
            id: doc.id,
            ...data,
            slug: data.slug || createSlug(data.judul || data.title || "untitled"),
          };
        });
        setNewsItems(newsData);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return <div className="text-center">Memuat berita...</div>;
  }

  if (newsItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Daftar Berita</h2>
        <p className="text-slate-600">Tidak ada berita tersedia.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Daftar Berita</h2>
      <div className="grid gap-6">
        {newsItems.map(item => (
          <Link
            key={item.id}
            to={`/berita/${item.slug}`}
            className="block bg-white rounded-2xl shadow-lg p-6 hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-xl font-semibold text-slate-800">{item.judul || item.title || "Tanpa Judul"}</h3>
            <p className="text-slate-600 mt-2">{item.ringkasan || "Tanpa ringkasan"}</p>
            <p className="text-slate-500 text-sm mt-1">Slug: {item.slug}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewsList;
