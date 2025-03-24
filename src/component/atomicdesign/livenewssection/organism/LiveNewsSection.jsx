/ components/livenews/LiveNewsSection.jsx
import React, { useState } from "react";
import LiveLabel from "./atoms/LiveLabel";
import NewsButton from "./atoms/NewsButton";
import NewsList from "./molecules/NewsList";
import LiveNewsMain from "./organisms/LiveNewsMain";

const LiveNewsSection = () => {
  const newsList = [
    { title: "Balancing Work and Wellness", image: "https://source.unsplash.com/600x400/?work,wellness" },
    { title: "Business Agility in Digital Age", image: "https://source.unsplash.com/600x400/?business,technology" },
    { title: "The Art of Baking", image: "https://source.unsplash.com/600x400/?baking,bread" },
    { title: "AI-Powered Financial Planning", image: "https://source.unsplash.com/600x400/?finance,AI" },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="w-full bg-black text-white py-10 select-none">
      <div className="container mx-auto px-6 md:px-16">
        <div className="flex items-center space-x-2 mb-4">
          <LiveLabel />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-full md:w-2/3 h-[400px] bg-gray-900 rounded-lg overflow-hidden">
            <LiveNewsMain news={newsList} activeIndex={activeIndex} />
          </div>

          <div className="relative w-full md:w-1/3 space-y-4">
            <NewsButton text="PREV" onClick={() => setActiveIndex((prev) => (prev - 1 + newsList.length) % newsList.length)} />
            <NewsList news={newsList} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
            <NewsButton text="NEXT" onClick={() => setActiveIndex((prev) => (prev + 1) % newsList.length)} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveNewsSection;
