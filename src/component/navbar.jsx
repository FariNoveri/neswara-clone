import React, { useState, useEffect } from "react";
import { FaSearch, FaUserCircle, FaBars, FaTimes, FaEllipsisH, FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import logo from "../assets/neswara (1).jpg"; // Pastikan path ini benar

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [iconClicked, setIconClicked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk sidebar
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mencegah scroll saat modal atau sidebar terbuka
  useEffect(() => {
    document.body.style.overflow = isModalOpen || isSidebarOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen, isSidebarOpen]);

  // Menutup modal saat tekan ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        if (isModalOpen) handleCloseModal();
        if (isSidebarOpen) handleCloseSidebar();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isModalOpen, isSidebarOpen]);

  // Fungsi untuk menutup modal dengan animasi
  const handleCloseModal = () => {
    setClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setClosing(false);
    }, 300);
  };

  // Fungsi untuk membuka modal dengan efek pembukaan
  const handleOpenModal = () => {
    setIconClicked(true);
    setOpening(true);
    setTimeout(() => {
      setIconClicked(false);
      setIsModalOpen(true);
      setTimeout(() => setOpening(false), 300);
    }, 200);
  };

  // Fungsi untuk membuka sidebar
  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  // Fungsi untuk menutup sidebar
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Fungsi untuk berpindah antara Login ↔ Sign Up
  const handleSwitchForm = () => {
    setClosing(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setClosing(false);
    }, 300);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="w-full bg-white shadow-md px-4 py-4">
        <div className="container mx-auto flex justify-between items-center px-4 md:px-20">
          {/* Logo dan Tombol Toggle untuk Mobile */}
          <div className="flex items-center space-x-4">
            {/* Tombol Toggle untuk Mobile */}
            <button
              className="md:hidden text-black text-2xl focus:outline-none"
              onClick={handleOpenSidebar}
            >
              <FaBars />
            </button>
            {/* Logo */}
            <img src={logo} alt="Neswara Logo" className="h-12 mr-1" />
          </div>

          {/* Navigation Links (Desktop) */}
          <ul className="hidden md:flex space-x-6 font-semibold text-black">
            <li className="hover:text-yellow-500 cursor-pointer">LIFESTYLE</li>
            <li className="hover:text-yellow-500 cursor-pointer">EDUCATION</li>
            <li className="hover:text-yellow-500 cursor-pointer">REGION</li>
            <li className="hover:text-yellow-500 cursor-pointer">SPORT</li>
            <li className="hover:text-yellow-500 cursor-pointer">TOUR & TRAVEL</li>
            <li className="hover:text-yellow-500 cursor-pointer">NATIONAL</li>
            <li className="hover:text-yellow-500 cursor-pointer">BUSINESS</li>
            <li>
              <FaEllipsisH className="text-black text-lg cursor-pointer hover:text-yellow-500" />
            </li>
          </ul>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <FaSearch className="text-black text-lg cursor-pointer hover:text-yellow-500" />
            <FaUserCircle
              className={`text-black text-2xl cursor-pointer hover:text-yellow-500 transition-transform duration-200 ${
                iconClicked ? "scale-125" : "scale-100"
              }`}
              onClick={handleOpenModal}
            />
          </div>
        </div>
      </nav>

      {/* Sidebar untuk Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          onClick={handleCloseSidebar}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()} // Mencegah penutupan saat klik di dalam sidebar
          >
            {/* Tombol Close untuk Sidebar */}
            <button
              className="absolute top-4 right-4 text-black text-2xl focus:outline-none"
              onClick={handleCloseSidebar}
            >
              <FaTimes />
            </button>

            {/* Navigation Links (Mobile) */}
            <ul className="mt-16 p-4 space-y-4 font-semibold text-black">
              <li className="hover:text-yellow-500 cursor-pointer">LIFESTYLE</li>
              <li className="hover:text-yellow-500 cursor-pointer">EDUCATION</li>
              <li className="hover:text-yellow-500 cursor-pointer">REGION</li>
              <li className="hover:text-yellow-500 cursor-pointer">SPORT</li>
              <li className="hover:text-yellow-500 cursor-pointer">TOUR & TRAVEL</li>
              <li className="hover:text-yellow-500 cursor-pointer">NATIONAL</li>
              <li className="hover:text-yellow-500 cursor-pointer">BUSINESS</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal (Tetap Sama) */}
      {isModalOpen && (
  <div
    className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
      closing ? "opacity-0" : "opacity-100"
    }`}
    onClick={handleCloseModal} // Menutup modal saat klik di luar
  >
    <div
      className={`bg-white w-full mx-4 md:w-[500px] p-4 md:p-8 rounded-lg shadow-lg relative transition-all duration-300 transform ${
        opening
          ? "scale-95 opacity-0 translate-y-5"
          : closing
          ? "translate-y-10 opacity-0 scale-95"
          : "translate-y-0 opacity-100 scale-100"
      }`}
      onClick={(e) => e.stopPropagation()} // Mencegah penutupan saat klik di dalam modal
    >
      {/* Close Button */}
      <IoClose
        className="absolute top-4 right-4 text-3xl cursor-pointer text-black transition-transform duration-200 transform hover:rotate-90"
        onClick={handleCloseModal} // Menutup modal saat tombol close diklik
      />

      {/* Form Title */}
      <h2 className="text-center text-xl md:text-2xl font-bold mb-4 md:mb-5 text-black">
        {isLogin ? "LOG IN" : "SIGN UP"}
      </h2>

      {/* Form */}
      <input
        type="email"
        placeholder="Your email"
        className="w-full border border-gray-300 bg-white px-4 py-2 md:py-3 rounded-md mb-3 md:mb-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border border-gray-300 bg-white px-4 py-2 md:py-3 rounded-md mb-3 md:mb-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {!isLogin && (
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border border-gray-300 bg-white px-4 py-2 md:py-3 rounded-md mb-3 md:mb-4 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      )}

      <button
        className="w-full bg-green-500 text-white py-2 md:py-3 rounded-md text-md md:text-lg hover:bg-green-600 transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
        onClick={() => {
          // Tambahkan logika login/sign up di sini
          console.log(isLogin ? "Logging in..." : "Signing up...");
        }}
      >
        {isLogin ? "LOG IN" : "SIGN UP"}
      </button>

      <div className="text-center my-3 md:my-4 text-black">OR</div>

      {/* Social Logins */}
      <div className="flex flex-row justify-center space-x-2 md:space-x-4">
        <button className="border p-2 md:px-6 md:py-3 rounded-md bg-gray-800 text-white flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-green-500">
          <FaGoogle className="text-red-500 text-lg md:text-xl" />
          <span className="hidden md:inline ml-2">Google</span> {/* Teks hanya muncul di desktop */}
        </button>
        <button className="border p-2 md:px-6 md:py-3 rounded-md bg-gray-800 text-white flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-green-500">
          <FaFacebook className="text-blue-600 text-lg md:text-xl" />
          <span className="hidden md:inline ml-2">Facebook</span> {/* Teks hanya muncul di desktop */}
        </button>
        <button className="border p-2 md:px-6 md:py-3 rounded-md bg-gray-800 text-white flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-green-500">
          <FaTwitter className="text-blue-400 text-lg md:text-xl" />
          <span className="hidden md:inline ml-2">Twitter</span> {/* Teks hanya muncul di desktop */}
        </button>
      </div>

      {/* Switch Between Login & Sign Up */}
      <p className="text-center mt-4 md:mt-5 text-sm md:text-md text-black">
        {isLogin ? (
          <>Don't have an account? <span className="text-green-500 cursor-pointer hover:underline" onClick={handleSwitchForm}>Sign up</span></>
        ) : (
          <>Already have an account? <span className="text-green-500 cursor-pointer hover:underline" onClick={handleSwitchForm}>Log in</span></>
        )}
      </p>
    </div>
  </div>
)}
    </>
  );
};

export default Navbar;