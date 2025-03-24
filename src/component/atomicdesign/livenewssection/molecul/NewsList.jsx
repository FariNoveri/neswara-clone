// components/livenews/molecules/NewsList.jsx
import React from "react";
import NewsItem from "../atoms/NewsItem";

const NewsList = ({ news, activeIndex, setActiveIndex }) => {
  return (
    <div className="relative">
      {news.map((item, index) => (
        <NewsItem
          key={index}
          title={item.title}
          isActive={activeIndex === index}
          onClick={() => setActiveIndex(index)}
        />
      ))}
    </div>
  );
};

export default NewsList;