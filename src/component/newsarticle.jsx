import React from "react";

const latestNews = [
  {
    title: "Seorang Kakek di Lampung Timur Dianiaya Menantu Hingga Patah Tulang",
    description: "Kakek di Lampung Dianiaya Menantu hingga mengalami patah tulang...",
    image: "https://neswara.id/file_manager/berita/1736952527-images (4).jpeg",
    date: "15 Jan 2025",
    link: "https://neswara.id/view/seorang-kakek-di-lampung-timur-dianiaya-menantu-hingga-patah-tulang"
  },
  {
    title: "Pasar Tradisional Mulai Sepi, Pedagang Mengeluh",
    description: "Perubahan gaya belanja masyarakat mulai berdampak pada pasar tradisional...",
    image: "https://source.unsplash.com/300x300/?market",
    date: "14 Jan 2025",
    link: "#"
  },
  {
    title: "Pemerintah Luncurkan Program Bantuan UMKM 2025",
    description: "Pemerintah berencana menyalurkan bantuan modal untuk UMKM tahun ini...",
    image: "https://source.unsplash.com/300x300/?business",
    date: "13 Jan 2025",
    link: "#"
  },
  {
    title: "Cuaca Ekstrem Melanda Sejumlah Wilayah di Indonesia",
    description: "Hujan deras dan angin kencang mengakibatkan banjir di beberapa kota besar...",
    image: "https://source.unsplash.com/300x300/?storm",
    date: "12 Jan 2025",
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

      <div className="grid grid-cols-3 gap-8">
        {/* Kolom Berita Terbaru */}
        <div className="col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Berita Terbaru</h2>
          <div className="space-y-4">
            {latestNews.map((news, index) => (
              <article key={index} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md flex items-start space-x-6">
                {/* Gambar di kiri */}
                <div className="w-48 h-48 flex-shrink-0">
                  <img
                    src={news.image}
                    alt="News Thumbnail"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Judul & Deskripsi di kanan */}
                <div className="flex flex-col justify-between flex-grow">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    <a href={news.link} className="hover:text-primary transition duration-200">
                      {news.title}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{news.description}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{news.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Kolom Popular Now (di dalam kotak putih) */}
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
        </div>
      </div>
    </section>
  );
};

export default NewsArticle;
