import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Show button only when scrolled down
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Auto-hide after 3 seconds if not interacted
    let timer;
    if (isVisible && isScrolled) {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isVisible, isScrolled]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsVisible(true); // Keep visible on interaction
  };

  const handleInteraction = () => {
    setIsVisible(true); // Show on hover/touch
  };

  if (!isScrolled) return null;

  return (
    <div
      className={`fixed bottom-12 right-4 z-40 transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-10"
      }`}
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <button
        onClick={handleScrollToTop}
        className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl glass-effect focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:scale-110"
        aria-label="Scroll to top"
      >
        <FaArrowUp className="text-lg" />
      </button>
    </div>
  );
};

export default ScrollToTop;