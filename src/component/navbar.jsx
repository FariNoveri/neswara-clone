import React from "react";
import { FaSearch, FaUserCircle, FaEllipsisH } from "react-icons/fa";

const Navbar = () => {
  return (
    <nav className="w-full bg-white shadow-md px-6 py-6">
      <div className="container mx-auto flex justify-between items-center px-10">
        {/* Logo */}
        <div className="flex items-center">
          <img src="./assets/neswara (1).png" alt="Neswara Logo" className="h-25 mr-10" />
          <span className="text-yellow-500 text-2xl font-bold">NESWARA</span>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-6 font-semibold text-gray-700">
          <li className="hover:text-yellow-500 cursor-pointer">LIFESTYLE</li>
          <li className="hover:text-yellow-500 cursor-pointer">EDUCATION</li>
          <li className="hover:text-yellow-500 cursor-pointer">REGION</li>
          <li className="hover:text-yellow-500 cursor-pointer">SPORT</li>
          <li className="hover:text-yellow-500 cursor-pointer">TOUR & TRAVEL</li>
          <li className="hover:text-yellow-500 cursor-pointer">NATIONAL</li>
          <li className="hover:text-yellow-500 cursor-pointer">BUSINESS</li>
          <li>
            <FaEllipsisH className="text-gray-600 text-lg cursor-pointer hover:text-yellow-500" />
          </li>
        </ul>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          <FaSearch className="text-gray-600 text-lg cursor-pointer hover:text-yellow-500" />
          <FaUserCircle className="text-gray-600 text-2xl cursor-pointer hover:text-yellow-500" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
