// components/livenews/molecules/NewsItem.jsx
import React from "react";

const NewsItem = ({ title, onClick, isActive }) => {
  return (
    <div
      className={`flex items-center bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 ${
        isActive ? "border border-white" : ""
      }`}
      onClick={onClick}
    >
      <div className="w-10 h-10 bg-gray-700 flex items-center justify-center rounded-md mr-4">
        ▶️
      </div>
      <p className="text-sm leading-tight">{title}</p>
    </div>
  );
};

export default NewsItem;