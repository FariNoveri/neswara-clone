import React from "react";
import NewsTime from "../atoms/NewsTime";

const AdditionalNewsItem = ({ title, time }) => {
  return (
    <div className="flex justify-between items-center border-b pb-2">
      <div className="flex-1">
        <p className="text-sm font-medium text-black">{title}</p>
        <NewsTime time={time} />
      </div>
      <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
    </div>
  );
};

export default AdditionalNewsItem;
