import React from "react";
import NewsTime from "../atoms/NewsTime";
import NewsTitle from "../atoms/NewsTitle";
import NewsAuthor from "../atoms/NewsAuthor";

const MainNewsItem = ({ title, author, time, comments }) => {
  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg h-48 flex flex-col justify-end">
      <NewsTime time={time} />
      <NewsTitle title={title} />
      <NewsAuthor author={author} comments={comments} />
    </div>
  );
};

export default MainNewsItem;
