import React, { useEffect, useState } from "react";
import { db } from "../firebaseconfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const LatestNewsSection = () => {
  const [newsFromDB, setNewsFromDB] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const news = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNewsFromDB(news.slice(0, 3)); // hanya ambil 3 berita terbaru
    };
    fetchNews();
  }, []);

  // Data tambahan tetap hardcoded
  const additionalNews = [
    [
      { title: "Tech Innovations Reshaping the Retail Landscape: AI Payments", time: "55min" },
      { title: "Balancing Work and Wellness: Tech Solutions for Healthy", time: "1h" },
      { title: "The Importance of Sleep: Tips for Better Rest and Recovery", time: "2h" },
    ],
    [
      { title: "Business Agility the Digital Age: Leveraging AI and Automation", time: "7d" },
      { title: "The Art of Baking: From Classic Bread to Artisan Pastries", time: "9d" },
      { title: "AI and Marketing: Unlocking Customer Insights", time: "15d" },
    ],
    [
      { title: "Eco-Tourism: Traveling Responsibly and Sustainably", time: "29d" },
      { title: "Solo Travel: Some Tips and Destinations for the Adventurous Explorer", time: "2mo" },
      { title: "AI-Powered Financial Planning: How Algorithms Revolutionizing", time: "2mo" },
    ],
  ];

  return (
    <section className="w-full bg-white py-10">
      <div className="container mx-auto px-6 md:px-16">
        <div className="grid md:grid-cols-3 gap-6">
          {newsFromDB.map((news, index) => (
            <div key={news.id || index}>
              {/* Kategori Berita */}
              <span className="text-sm font-semibold text-black uppercase mb-2 block">
                {news.kategori || "Umum"}
              </span>

              {/* Berita utama dalam kotak */}
              <div className="bg-gray-900 text-white p-6 rounded-lg h-48 flex flex-col justify-end">
                <span className="text-xs text-gray-400">
                  {news.createdAt?.seconds
                    ? new Date(news.createdAt.seconds * 1000).toLocaleDateString()
                    : "Baru"}
                </span>
                <h3 className="text-lg font-bold">{news.judul}</h3>
                <div className="text-sm text-gray-300 mt-2">
                  <span className="text-green-400">📝 {news.author || "Admin"}</span> • 💬 {news.komentar || 0}
                </div>
              </div>

              {/* Daftar berita tambahan tetap statis */}
              <div className="mt-4 space-y-3">
                {additionalNews[index] &&
                  additionalNews[index].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black">{item.title}</p>
                        <span className="text-xs text-gray-500 block mt-1">{item.time}</span>
                      </div>
                      <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestNewsSection;
