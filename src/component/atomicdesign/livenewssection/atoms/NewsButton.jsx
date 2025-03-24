// components/livenews/atoms/NewsButton.jsx
import React from "react";

const NewsButton = ({ onClick, text }) => {
  return (
    <button
      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold"
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default NewsButton;
