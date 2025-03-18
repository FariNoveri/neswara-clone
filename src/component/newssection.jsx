import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import NewsImage1 from "../assets/news-image.jpg";
import NewsImage2 from "../assets/news-image.jpg";
import NewsImage3 from "../assets/news-image.jpg";
import NewsImage4 from "../assets/news-image.jpg";
import NewsImage5 from "../assets/news-image.jpg";

const newsImages = [NewsImage1, NewsImage2, NewsImage3, NewsImage4, NewsImage5];

const NewsSection = () => {
  return (
    <div className="container mx-auto px-40 mt-6">
      {/* Swiper */}
      <Swiper
        modules={[Navigation]}
        slidesPerView={2}
        spaceBetween={8}
        navigation
        breakpoints={{
          640: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 5 },
        }}
        className="py-2"
      >
        {["SMK", "SMA", "Real Madrid", "Pasar", "Modern", "Peristiwa", "Daerah"].map(
          (item, index) => (
            <SwiperSlide key={index}>
              <div className="p-1  text-center bg-white rounded-lg shadow dark:bg-gray-800 dark:text-white">
                <span className="text-lg font-bold uppercase">{item}</span>
              </div>
            </SwiperSlide>
          )
        )}
      </Swiper>

      {/* Grid Berita */}
      <div className="grid grid-cols-5 gap-6 mt-6 mx-auto max-w-7xl">
        {/* Kolom Kiri - 3 Gambar Berita */}
        <div className="flex flex-col space-y-4 col-span-1">
          {newsImages.slice(0, 3).map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img}
                alt={`News ${index + 1}`}
                className="w-full h-[150px] object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-transparent to-transparent p-1">
                <p className="text-white text-sm text-left">Berita Hari Ini</p>
              </div>
            </div>
          ))}
        </div>

        {/* Kolom Tengah - Gambar Besar (Utama) */}
        <div className="col-span-3 flex flex-col items-center">
          <div className="relative w-full">
            <img
              src={newsImages[3]}
              alt="Main News"
              className="w-full h-[480px] object-cover rounded-lg"
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-transparent to-transparent p-2">
              <p className="text-white text-lg font-bold text-left">Berita Hari Ini</p>
            </div>
          </div>
          <h2 className="text-lg font-bold mt-2">Judul Berita Utama</h2>
        </div>

        {/* Kolom Kanan - 3 Gambar Berita Lainnya */}
        <div className="flex flex-col space-y-4 col-span-1">
          {newsImages.slice(1, 4).map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img}
                alt={`News ${index + 1}`}
                className="w-full h-[150px] object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-transparent to-transparent p-1">
                <p className="text-white text-sm text-left">Berita Hari Ini</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Iklan Persegi Panjang */}
      <div className="mt-1 flex justify-center">
        <div className="w-full max-w-7xl bg-gray-200 p-5 rounded-lg shadow-lg text-center">
          <h3 className="text-xl font-bold">Ingin mengiklankan produk Anda?</h3>
          <p className="text-gray-600 mt-2">Hubungi kami untuk menampilkan di sini!</p>
        </div>
      </div>
    </div>
  );
};

export default NewsSection;
