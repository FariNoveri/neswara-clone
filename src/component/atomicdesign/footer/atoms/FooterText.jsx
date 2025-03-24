import React from "react";

const FooterText = ({ children, className }) => {
  return <p className={`text-xs ${className}`}>{children}</p>;
};

export default FooterText;
