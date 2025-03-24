/ components/livenews/atoms/NewsTitle.jsx
import React from "react";

const NewsTitle = ({ title }) => {
  return <h2 className="text-lg md:text-2xl font-bold leading-snug">{title}</h2>;
};

export default NewsTitle;