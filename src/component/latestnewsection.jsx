import React from "react";

const LatestNewsSection = () => {
  // Data berita
  const latestNews = [
    {
      title: "The Rise of AI-Powered Personal Assistants: How They Manage",
      author: "David Peterson",
      time: "1min",
      comments: 2,
    },
    {
      title: "The Future of Sustainable Living: Driving Eco-Friendly Lifestyles",
      author: "Anna Luis",
      time: "12h",
      comments: 1,
    },
    {
      title: "Hidden Gems: Underrated Travel Destinations Around the World",
      author: "David Peterson",
      time: "23d",
      comments: 15,
    },
  ];

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
          {latestNews.map((news, index) => (
            <div key={index}>
              {/* Berita utama dalam kolom */}
              <div className="bg-gray-900 text-white p-6 rounded-lg h-48 flex flex-col justify-end">
                <span className="text-xs text-gray-400">{news.time}</span>
                <h3 className="text-lg font-bold">{news.title}</h3>
                <div className="text-sm text-gray-300 mt-2">
                  <span className="text-green-400">📝 {news.author}</span> • 💬 {news.comments}
                </div>
              </div>

              {/* Daftar berita tambahan di bawahnya */}
              <div className="mt-4 space-y-3">
                {additionalNews[index].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span className="text-xs text-gray-500">{item.time}</span>
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
