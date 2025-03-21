import React from "react";
import { FaComment, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa"; // Ikon untuk komentar dan media sosial

const latestNews = [
  {
    title: "Seorang Kakek di Lampung Timur Dianiaya Menantu Hingga Patah Tulang",
    description: "Kakek di Lampung Dianiaya Menantu hingga mengalami patah tulang...",
    image: "https://neswara.id/file_manager/berita/1736952527-images (4).jpeg",
    date: "15 Jan 2025",
    author: "John Doe", // Pembuat berita
    comments: 5, // Jumlah komentar
    link: "https://neswara.id/view/seorang-kakek-di-lampung-timur-dianiaya-menantu-hingga-patah-tulang"
  },
  {
    title: "Dukung Ketahanan Pangan, Satbrimob Polda Lampung Tanam Jagung",
    description: "Perubahan gaya belanja masyarakat mulai berdampak pada pasar tradisional...",
    image: "https://neswara.id/file_manager/berita/1736926587-IMG-20250115-WA0042.jpg",
    date: "14 Jan 2025",
    author: "Jane Smith",
    comments: 12,
    link: "#"
  },
  {
    title: "Empat Provokator Diamankan Dalam Pengosongan Lahan PTPN VII",
    description: "Pemerintah berencana menyalurkan bantuan modal untuk UMKM tahun ini...",
    image: "https://neswara.id/file_manager/berita/1736925778-ptahJdS07wj3HlOES8fdwqF7ljelueCXyECRjf3m.jpg",
    date: "13 Jan 2025",
    author: "Alice Johnson",
    comments: 8,
    link: "#"
  },
  {
    title: "Inovasi Baru di Tahun 2025: Teknologi AI Membantu Produktivitas Harian",
    description: "Hujan deras dan angin kencang mengakibatkan banjir di beberapa kota besar...",
    image: "https://neswara.id/file_manager/berita/1736391139-aii.jpeg",
    date: "12 Jan 2025",
    author: "Bob Brown",
    comments: 20,
    link: "#"
  }
];

const popularNews = [
  { title: "Real Madrid Juara Lagi!", date: "10 Jan 2025", comments: 5, link: "#" },
  { title: "Harga Minyak Dunia Naik", date: "9 Jan 2025", comments: 12, link: "#" },
  { title: "BTS Rilis Lagu Baru", date: "8 Jan 2025", comments: 20, link: "#" },
  { title: "Startup Indonesia Go International", date: "7 Jan 2025", comments: 8, link: "#" }
];

const NewsArticle = () => {
  return (
    <section className="max-w-6xl mx-auto my-8 px-4 relative">
      {/* Kotak Putih Latar Belakang untuk Semua Berita */}
      <div className="absolute inset-0 bg-white dark:bg-gray-800 shadow-lg rounded-lg -z-10 p-6"></div>

      {/* Saran Berita di Atas Tengah */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold">Saran Berita</h2>
      </div>

      {/* Grid untuk Berita Terbaru dan Popular Now */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kolom Berita Terbaru */}
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Berita Terbaru</h2>
          <div className="space-y-4">
            {latestNews.map((news, index) => (
              <article
                key={index}
                className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6"
              >
                {/* Gambar di atas (mobile) atau di kiri (desktop) */}
                <div className="w-full md:w-48 h-48 flex-shrink-0 relative">
                  <img
                    src={news.image}
                    alt="News Thumbnail"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {/* Tanggal di atas gambar */}
                  <span className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {news.date}
                  </span>
                </div>

                {/* Judul, Deskripsi, Pembuat, dan Komentar */}
                <div className="flex flex-col justify-between flex-grow">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    <a href={news.link} className="hover:text-primary transition duration-200">
                      {news.title}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{news.description}</p>
                  {/* Pembuat dan Jumlah Komentar */}
                  <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>By {news.author}</span>
                    <div className="flex items-center space-x-1">
                      <FaComment className="text-gray-500" />
                      <span>{news.comments} Komentar</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Kolom Popular Now */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Popular Now</h2>
          <div className="space-y-4">
            {popularNews.map((news, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="text-md font-bold text-gray-900 dark:text-white">
                  <a href={news.link} className="hover:text-primary transition duration-200">
                    {news.title}
                  </a>
                </h3>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>{news.date}</span>
                  <span>{news.comments} Komentar</span>
                </div>
              </div>
            ))}
          </div>

          {/* Kotak Terpisah untuk Follow, Email, Subscribe, dan Ikon Media Sosial */}
          <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Follow @farinoveri
            </h3>
            {/* Input Email */}
            <input
              type="email"
              placeholder="Your Email"
              className="w-full border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 px-4 py-2 rounded-md mb-4 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {/* Tombol Subscribe */}
            <button className="w-full bg-green-500 text-white py-2 rounded-md text-md hover:bg-green-600 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500">
              Subscribe Now
            </button>
            {/* Ikon Media Sosial */}
            <div className="flex justify-center space-x-4 mt-4">
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-green-500">
                <FaFacebook className="text-2xl" />
              </a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-green-500">
                <FaInstagram className="text-2xl" />
              </a>
              <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-green-500">
                <FaYoutube className="text-2xl" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsArticle;