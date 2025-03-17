import React from "react";

const LiveNewsSection = () => {
  // Contoh daftar berita live
  const newsList = [
    { title: "Balancing Work and Wellness: Tech Solutions for Healthy" },
    { title: "Business Agility the Digital Age: Leveraging AI and Automation" },
    { title: "The Art of Baking: From Classic Bread to Artisan Pastries" },
    { title: "AI-Powered Financial Planning: How Algorithms Revolutionizing" },
  ];

  return (
    <section className="w-full bg-black text-white py-10">
      <div className="container mx-auto px-6 md:px-16">
        {/* LIVE NOW Label */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-red-500 text-sm font-bold">🔴 LIVE NOW</span>
        </div>

        {/* Live News Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main News Box */}
          <div className="bg-gray-900 w-full md:w-2/3 h-64 md:h-80 rounded-lg relative p-6">
            {/* Judul berita utama */}
            <h2 className="text-lg md:text-2xl font-bold">
              BALANCING WORK AND WELLNESS: TECH SOLUTIONS...
            </h2>
            {/* Info Penulis */}
            <div className="absolute bottom-4 left-6 text-sm text-gray-300">
              <span className="text-green-400">📝 Sarah Eddrissi</span>{" "}
              <strong>Sarah Eddrissi</strong> • 1h ago • 💬 0
            </div>
          </div>

          {/* News List */}
          <div className="w-full md:w-1/3 space-y-4">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold">
              PREV
            </button>

            {newsList.map((news, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700"
              >
                <div className="w-10 h-10 bg-gray-700 flex items-center justify-center rounded-md mr-4">
                  ▶️
                </div>
                <p className="text-sm">{news.title}</p>
              </div>
            ))}

            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold">
              NEXT
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveNewsSection;
