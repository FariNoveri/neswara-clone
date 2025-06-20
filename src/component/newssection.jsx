import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { db } from "../firebaseconfig";
import { 
  collection, 
  getDocs, 
  orderBy, 
  query,
  updateDoc,
  doc,
  increment
} from "firebase/firestore";

const NewsSection = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch news from Firebase - menggunakan pola yang sama dengan AdminDashboard
  const fetchNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNewsData(data.slice(0, 5)); // Ambil 5 berita terbaru
    } catch (error) {
      console.error("Error fetching news:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handle news click to increment views - sama seperti AdminDashboard
  const handleNewsClick = async (newsId) => {
    try {
      await updateDoc(doc(db, "news", newsId), {
        views: increment(1)
      });
      // Update local state
      setNewsData(prevData => 
        prevData.map(item => 
          item.id === newsId 
            ? { ...item, views: (item.views || 0) + 1 }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating views:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
        <p className="mt-2 text-gray-600">Memuat berita...</p>
      </div>
    );
  }

  if (newsData.length === 0) {
    return <div className="text-center py-10">Tidak ada berita tersedia</div>;
  }

  const categories = [...new Set(newsData.map(item => item.kategori || "Umum"))];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-16 mt-6">
      {/* Swiper */}
      <Swiper
        modules={[Navigation]}
        slidesPerView={1.5}
        spaceBetween={8}
        navigation
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 12 },
          768: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 5, spaceBetween: 20 },
        }}
        className="py-2"
      >
        {categories.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="p-2 text-center bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-white">
              <span className="text-sm sm:text-lg font-bold uppercase">{item}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Grid Berita */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 grid-rows-3 lg:grid-rows-1 gap-4 sm:gap-6 mt-6 mx-auto max-w-7xl">
        {/* Kolom Kiri - 3 Gambar Berita */}
        <div className="flex flex-col space-y-4 lg:col-span-1">
          {newsData.slice(0, 3).map((item, index) => (
            <div 
              key={index} 
              className="relative h-[100px] sm:h-[130px] lg:h-[160px] cursor-pointer"
              onClick={() => handleNewsClick(item.id)}
            >
              <img
                src={item.gambar}
                alt={`News ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-transparent to-transparent p-1">
                <p className="text-white text-xs sm:text-sm text-left">Berita Hari Ini</p>
              </div>
            </div>
          ))}
        </div>

        {/* Kolom Tengah - Gambar Besar (Utama) */}
        <div className="lg:col-span-3 flex flex-col items-center">
          {newsData[3] && (
            <div 
              className="relative w-full h-[300px] sm:h-[400px] lg:h-[510px] cursor-pointer"
              onClick={() => handleNewsClick(newsData[3].id)}
            >
              <img
                src={newsData[3].gambar}
                alt="Main News"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-transparent to-transparent p-2">
                <p className="text-white text-sm sm:text-lg font-bold text-left">
                  {newsData[3].judul}
                </p>
              </div>
            </div>
          )}
          <h2 className="text-base sm:text-lg font-bold mt-2 text-center">
            {newsData[3]?.judul || "Judul Berita Utama"}
          </h2>
        </div>

        {/* Kolom Kanan - 3 Gambar Berita Lainnya */}
        <div className="flex flex-col space-y-4 lg:col-span-1">
          {newsData.slice(1, 4).map((item, index) => (
            <div 
              key={index} 
              className="relative h-[100px] sm:h-[130px] lg:h-[160px] cursor-pointer"
              onClick={() => handleNewsClick(item.id)}
            >
              <img
                src={item.gambar}
                alt={`News ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-transparent to-transparent p-1">
                <p className="text-white text-xs sm:text-sm text-left">Berita Hari Ini</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Iklan Persegi Panjang */}
      <div className="mt-4 sm:mt-6 flex justify-center">
        <div className="w-full max-w-7xl bg-gray-200 p-4 sm:p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-base sm:text-xl font-bold">Ingin mengiklankan produk Anda?</h3>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Hubungi kami untuk menampilkan di sini!
          </p>
        </div>
      </div>
      <br />
      <br />
    </div>
  );
};

export default NewsSection;