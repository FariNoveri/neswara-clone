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
        {["SMK", "SMA", "Real Madrid", "Pasar", "Modern", "Peristiwa", "Daerah"].map(
          (item, index) => (
            <SwiperSlide key={index}>
              <div className="p-2 text-center bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-white">
                <span className="text-sm sm:text-lg font-bold uppercase">{item}</span>
              </div>
            </SwiperSlide>
          )
        )}
      </Swiper>

      {/* Grid Berita */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 grid-rows-3 lg:grid-rows-1 gap-4 sm:gap-6 mt-6 mx-auto max-w-7xl">
        {/* Kolom Kiri - 3 Gambar Berita */}
        <div className="flex flex-col space-y-4 lg:col-span-1">
          {newsImages.slice(0, 3).map((img, index) => (
            <div key={index} className="relative h-[100px] sm:h-[130px] lg:h-[160px]">
              <img
                src={img}
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
          <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[510px]">
            <img
              src={newsImages[3]}
              alt="Main News"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-transparent to-transparent p-2">
              <p className="text-white text-sm sm:text-lg font-bold text-left">Berita Hari Ini</p>
            </div>
          </div>
          <h2 className="text-base sm:text-lg font-bold mt-2 text-center">Judul Berita Utama</h2>
        </div>

        {/* Kolom Kanan - 3 Gambar Berita Lainnya */}
        <div className="flex flex-col space-y-4 lg:col-span-1">
          {newsImages.slice(1, 4).map((img, index) => (
            <div key={index} className="relative h-[100px] sm:h-[130px] lg:h-[160px]">
              <img
                src={img}
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
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Hubungi kami untuk menampilkan di sini!</p>
        </div>
      </div>
      <br />
      <br />
    </div>
  );
};

export default NewsSection;
