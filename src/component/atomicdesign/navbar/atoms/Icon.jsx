import React from "react";

const Icon = ({ IconComponent, onClick, className }) => {
  return <IconComponent className={`text-lg cursor-pointer ${className}`} onClick={onClick} />;
};

export default Icon;

