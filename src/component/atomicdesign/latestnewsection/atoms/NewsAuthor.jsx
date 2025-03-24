import React from "react";

const NewsAuthor = ({ author, comments }) => {
  return (
    <div className="text-sm text-gray-300 mt-2">
      <span className="text-green-400">📝 {author}</span> • 💬 {comments}
    </div>
  );
};

export default NewsAuthor;
