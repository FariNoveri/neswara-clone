import React from "react";

const Paragraph = ({ children }) => {
  return <p className="text-sm md:text-base max-w-lg mt-2">{children}</p>;
};

export default Paragraph;
