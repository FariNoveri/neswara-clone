import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LiveNewsSection = () => {
  const newsList = [
    { 
      title: "Balancing Work and Wellness: Tech Solutions for Healthy", 
      image: "https://source.unsplash.com/600x400/?work,wellness" 
    },
    { 
      title: "Business Agility in the Digital Age: Leveraging AI and Automation", 
      image: "https://source.unsplash.com/600x400/?business,technology" 
    },
    { 
      title: "The Art of Baking: From Classic Bread to Artisan Pastries", 
      image: "https://source.unsplash.com/600x400/?baking,bread" 
    },
    { 
      title: "AI-Powered Financial Planning: How Algorithms Revolutionizing", 
      image: "https://source.unsplash.com/600x400/?finance,AI" 
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const dragRef = useRef(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % newsList.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + newsList.length) % newsList.length);
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX || e.touches[0].clientX;
  };

  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    let moveX = (e.clientX || e.touches[0].clientX) - startX.current;
    setOffsetX(moveX);
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (offsetX > 80) {
      handlePrev();
    } else if (offsetX < -80) {
      handleNext();
    }
    setOffsetX(0);
  };

  return (
    <section className="w-full bg-black text-white py-10 select-none">
      <div className="container mx-auto px-6 md:px-16">
        {/* LIVE NOW Label */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-red-500 text-sm font-bold">🔴 LIVE NOW</span>
        </div>

        {/* Live News Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main News Box - Bisa di Drag & Animasi Smooth */}
          <div
            className="relative w-full md:w-2/3 h-[400px] bg-gray-900 rounded-lg flex flex-col justify-end p-6 overflow-hidden min-h-64px lg:min-h-100px"
            ref={dragRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col justify-end p-6"
                style={{
                  backgroundImage: `url(${newsList[activeIndex].image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="bg-black bg-opacity-50 p-4 rounded-lg">
                  <h2 className="text-lg md:text-2xl font-bold leading-snug">
                    {newsList[activeIndex].title}
                  </h2>
                </div>
                <br />
                <div className="absolute bottom-4 left-6 text-sm text-gray-300">
                  <span className="text-green-400">📝 Sarah Eddrissi</span> <strong>Sarah Eddrissi</strong> • 2mo ago • 💬 2
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* News List */}
          <div className="relative w-full md:w-1/3 space-y-4">
            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold"
              onClick={handlePrev}
            >
              PREV
            </button>

            {/* Wrapper for gradient effect */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/30 to-transparent z-10 pointer-events-none"></div>

              {newsList.map((news, index) => (
                <div
                  key={index}
                  className={`flex items-center bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 relative z-20 ${
                    activeIndex === index ? "border border-white" : ""
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="w-10 h-10 bg-gray-700 flex items-center justify-center rounded-md mr-4">
                    ▶️
                  </div>
                  <p className="text-sm leading-tight">{news.title}</p>
                </div>
              ))}
            </div>

            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold"
              onClick={handleNext}
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveNewsSection;
