 
import React from "react";
import Icon from "../atoms/Icon";
import { FaSearch } from "react-icons/fa";

const SearchBar = () => {
  return <Icon IconComponent={FaSearch} className="text-black hover:text-yellow-500" />;
};

export default SearchBar;
