 
import React from "react";

const NavLink = ({ label, onClick }) => {
  return (
    <li className="hover:text-yellow-500 cursor-pointer" onClick={onClick}>
      {label}
    </li>
  );
};

export default NavLink;
