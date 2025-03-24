import React from "react";
import CategoryLabel from "../atoms/CategoryLabel";
import MainNewsItem from "../molecules/MainNewsItem";
import AdditionalNewsItem from "../molecules/AdditionalNewsItem";

const LatestNewsColumn = ({ category, mainNews, additionalNews }) => {
  return (
    <div>
      <CategoryLabel category={category} />
      <MainNewsItem {...mainNews} />
      <div className="mt-4 space-y-3">
        {additionalNews.map((news, index) => (
          <AdditionalNewsItem key={index} {...news} />
        ))}
      </div>
    </div>
  );
};

export default LatestNewsColumn;
