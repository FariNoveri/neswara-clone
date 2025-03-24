import React from "react";

const Heading = ({ level = "h1", children }) => {
  const Tag = level;
  const styles = {
    h1: "text-2xl md:text-4xl font-bold mt-2",
    h4: "text-sm md:text-lg font-semibold uppercase",
  };

  return <Tag className={styles[level]}>{children}</Tag>;
};

export default Heading;
