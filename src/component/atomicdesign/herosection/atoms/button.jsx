import React from "react";

const Button = ({ text, type = "primary", onClick }) => {
  const baseStyle = "px-6 py-2 rounded-lg font-semibold";
  const styles = {
    primary: "bg-green-500 hover:bg-green-600 text-white",
    secondary: "border border-white text-white",
  };

  return (
    <button className={`${baseStyle} ${styles[type]}`} onClick={onClick}>
      {text}
    </button>
  );
};

export default Button;
