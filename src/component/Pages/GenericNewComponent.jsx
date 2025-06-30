import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const createSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const GenericNewsComponent = ({ category = null }) => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        let newsQuery = collection(db, "news");
        if (category) {
          newsQuery = query(newsQuery, where("kategori", "==", category));
        }
        const newsSnapshot = await getDocs(newsQuery);
        const newsData = newsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNewsItems(newsData);
      } catch (error) {
        console.error(`Error fetching news for ${category || 'all'}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [category]);

  if (loading) {
    return <div className="text-center">Memuat berita...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{category || "Berita Terbaru"}</h2>
      <div className="grid gap-6">
        {newsItems.map(item => (
          <Link
            key={item.id}
            to={`/berita/${item.slug || createSlug(item.judul || item.title || 'untitled')}`}
            className="block bg-white rounded-2xl shadow-lg p-6 hover:bg-slate-50 transition-colors"
            onClick={() => console.log(`Navigating to: /berita/${item.slug || createSlug(item.judul || item.title || 'untitled')}`)} // Debug
          >
            <h3 className="text-xl font-semibold text-slate-800">{item.judul || item.title || "Tanpa Judul"}</h3>
            <p className="text-slate-600 mt-2">{item.ringkasan || "Tanpa ringkasan"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GenericNewsComponent;