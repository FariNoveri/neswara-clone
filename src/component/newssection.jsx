import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import NewsImage from "../assets/news-image.jpg"; // Pastikan path benar

const NewsSection = () => {
  return (
    <div className="container mx-auto px-4 mt-6">
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
              <div className="p-2 text-center bg-white rounded-lg shadow dark:bg-gray-800 dark:text-white">
                <span className="text-lg font-bold uppercase">{item}</span>
              </div>
            </SwiperSlide>
          )
        )}
      </Swiper>

      {/* Grid Berita */}
      <div className="grid grid-cols-5 gap-6 mt-6">
        {/* Kolom Kiri - 3 Gambar Berita */}
        <div className="flex flex-col space-y-4 col-span-1">
          {Array(3)
            .fill(NewsImage)
            .map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`News ${index + 1}`}
                className="w-full h-[90px] object-cover rounded-lg"
              />
            ))}
        </div>

        {/* Kolom Tengah - Gambar Besar (Utama) */}
        <div className="col-span-3 flex flex-col items-center">
          <img
            src={NewsImage}
            alt="Main News"
            className="w-full h-[300px] object-cover rounded-lg"
          />
          <h2 className="text-lg font-bold mt-2">Judul Berita Utama</h2>
        </div>

        {/* Kolom Kanan - 3 Kotak "Tidak Ada Berita" */}
        <div className="flex flex-col space-y-5 col-span-1">
          {Array(3)
            .fill("Tidak Ada Berita")
            .map((text, index) => (
              <div
                key={index}
                className="bg-gray-900 text-white p-4 rounded-lg flex items-center justify-center text-center"
              >
                <p>{text}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default NewsSection;
