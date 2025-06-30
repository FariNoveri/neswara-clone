import React, { useState, useEffect } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../config/slug";

const Hero = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(1));
        const snapshot = await getDocs(q);
        const newsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          slug: doc.data().slug,
        }));
        setNews(newsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching news:", error);
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleNewsClick = (slug) => {
    console.log(`Navigating to: /berita/${slug}`);
    navigate(`/berita/${slug}`);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Memuat...</div>;
  }

  const featuredNews = news[0];

  return (
    <section className="h-screen flex flex-col justify-center items-center text-center bg-gray-100">
      {featuredNews ? (
        <>
          <h1
            className="text-4xl font-bold cursor-pointer"
            onClick={() =>
              handleNewsClick(featuredNews.slug || createSlug(featuredNews.judul || featuredNews.title || 'untitled'))
            }
          >
            {featuredNews.judul || "Judul tidak tersedia"}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            {featuredNews.ringkasan || "Deskripsi tidak tersedia"}
          </p>
          <button
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg"
            onClick={() =>
              handleNewsClick(featuredNews.slug || createSlug(featuredNews.judul || featuredNews.title || 'untitled'))
            }
          >
            Baca Berita
          </button>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold">Selamat Datang di Neswara</h1>
          <p className="mt-4 text-lg text-gray-600">Solusi Keuangan Berbasis Digital</p>
          <button className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg">Get Started</button>
        </>
      )}
    </section>
  );
};

export default Hero;
