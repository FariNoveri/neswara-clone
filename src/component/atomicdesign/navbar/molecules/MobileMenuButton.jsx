import React from "react";
import Icon from "../atoms/Icon";
import { FaBars } from "react-icons/fa";

const MobileMenuButton = ({ onClick }) => {
  return <Icon IconComponent={FaBars} className="md:hidden text-black text-2xl" onClick={onClick} />;
};

export default MobileMenuButton;

