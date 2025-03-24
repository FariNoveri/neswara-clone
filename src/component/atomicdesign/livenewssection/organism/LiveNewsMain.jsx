// components/livenews/organisms/LiveNewsMain.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import NewsTitle from "../atoms/NewsTitle";

const LiveNewsMain = ({ news, activeIndex }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex flex-col justify-end p-6"
        style={{
          backgroundImage: `url(${news[activeIndex].image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-black bg-opacity-50 p-4 rounded-lg">
          <NewsTitle title={news[activeIndex].title} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveNewsMain;