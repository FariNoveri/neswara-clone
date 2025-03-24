import React from "react";
import Logo from "../atoms/Logo";
import NavLink from "../atoms/NavLink";
import SearchBar from "../molecules/SearchBar";
import UserMenu from "../molecules/UserMenu";
import MobileMenuButton from "../molecules/MobileMenuButton";

const NavbarAtomicDesign = ({ onMenuClick }) => {
  return (
    <nav className="w-full bg-white shadow-md px-4 py-4">
      <div className="container mx-auto flex justify-between items-center px-4 md:px-20">
        {/* Logo & Mobile Menu */}
        <div className="flex items-center space-x-4">
          <MobileMenuButton onClick={onMenuClick} />
          <Logo />
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-6 font-semibold text-black">
          {["LIFESTYLE", "EDUCATION", "REGION", "SPORT", "TOUR & TRAVEL", "NATIONAL", "BUSINESS"].map((item) => (
            <NavLink key={item} label={item} />
          ))}
        </ul>

        {/* Search & User Menu */}
        <div className="flex items-center space-x-4">
          <SearchBar />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default NavbarAtomicDesign;

