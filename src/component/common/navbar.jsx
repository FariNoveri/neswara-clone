import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaUserCircle, FaBars, FaTimes, FaBell, FaHome, FaNewspaper, FaGlobe, FaChevronDown, FaBookmark } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AuthModal from "../auth/AuthModal";
import { db } from "../../firebaseconfig";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { logoutUser } from "../auth/Auth";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("login");
  const [isScrolled, setIsScrolled] = useState(true);
  const [breakingNews, setBreakingNews] = useState([]);
  const profileDropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const q = query(
          collection(db, "breakingNews"),
          where("isActive", "==", true),
          orderBy("priority", "asc")
        );
        const snapshot = await getDocs(q);
        const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBreakingNews(newsData);
      } catch (error) {
        console.error("Error fetching breaking news for navbar:", error);
      }
    };
    fetchBreakingNews();
  }, []);

  const mainMenuItems = [
    { name: "BERANDA", path: "/", icon: FaHome },
    { name: "NASIONAL", path: "/nasional", icon: FaNewspaper },
    { name: "INTERNASIONAL", path: "/internasional", icon: FaGlobe },
    { name: "OLAHRAGA", path: "/olahraga" },
    { name: "EKONOMI", path: "/ekonomi" },
    { name: "TEKNOLOGI", path: "/teknologi" },
    { name: "LIFESTYLE", path: "/lifestyle" },
    { name: "DAERAH", path: "/daerah" },
    { name: "YANG ANDA SIMPAN", path: "/saved", icon: FaBookmark },
  ];

  const dropdownItems = [
    { name: "PENDIDIKAN", path: "/pendidikan" },
    { name: "KESEHATAN", path: "/kesehatan" },
    { name: "OTOMOTIF", path: "/otomotif" },
    { name: "WISATA", path: "/wisata" },
    { name: "KULINER", path: "/kuliner" },
    { name: "ENTERTAINMENT", path: "/entertainment" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setIsMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err.message);
      alert("Gagal logout. Silakan coba lagi.");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileDropdownOpen(false);
    setIsMoreDropdownOpen(false);
  };

  const handleOpenModal = (mode = "login") => {
    setFormMode(mode);
    setIsModalOpen(true);
    setIsProfileDropdownOpen(false);
    setIsMoreDropdownOpen(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            font-family: 'Inter', sans-serif;
          }
          
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .navbar-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .menu-item {
            position: relative;
            transition: all 0.2s ease;
          }
          
          .menu-item::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 50%;
            width: 0;
            height: 2px;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            transition: all 0.3s ease;
            transform: translateX(-50%);
          }
          
          .menu-item:hover::after {
            width: 100%;
          }
          
          .dropdown-menu {
            animation: slideDown 0.2s ease-out;
          }
          
          .mobile-menu {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .breaking-news {
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color: white;
            padding: 8px 0;
            font-size: 13px;
            font-weight: 500;
          }
          
          .breaking-news-text {
            white-space: nowrap;
            animation: marquee 30s linear infinite;
          }
          
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>

      {breakingNews.length > 0 && (
        <div className="breaking-news">
          <div className="container mx-auto px-4 flex items-center">
            <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold mr-4 flex-shrink-0">
              BREAKING
            </span>
            <div className="overflow-hidden flex-1">
              <div className="breaking-news-text">
                {breakingNews.map((news, index) => (
                  <span key={news.id} className="mr-8">
                    {news.text}
                    {index < breakingNews.length - 1 && " | "}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className={`w-full sticky top-0 z-40 navbar-transition ${
        isScrolled ? "glass-effect shadow-lg" : "bg-white shadow-md"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <button
                  className="md:hidden text-gray-700 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle mobile menu"
                >
                  <FaBars />
                </button>
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FaNewspaper className="text-white text-lg" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">NewsWara</h1>
                    <p className="text-xs text-gray-500 -mt-1">Berita Terpercaya</p>
                  </div>
                </Link>
              </div>
              <div className="hidden lg:block text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) +
                      " " +
                      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Cari berita..."
                  className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Cari berita"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <FaSearch
                className="sm:hidden text-gray-600 text-lg cursor-pointer hover:text-blue-500 transition-colors"
                aria-label="Cari"
              />
              <div className="relative">
                <FaBell
                  className="text-gray-600 text-lg cursor-pointer hover:text-blue-500 transition-colors"
                  aria-label="Notifikasi"
                />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-xs"></span>
              </div>
              {currentUser && currentUser.emailVerified ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                      setIsMoreDropdownOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Menu pengguna"
                  >
                    <FaUserCircle className="text-lg" />
                    <span className="text-sm font-medium">{currentUser.displayName || currentUser.email}</span>
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-100 dropdown-menu z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Profil
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleOpenModal("login")}
                  className="bg-blue-500 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Masuk"
                >
                  Masuk
                </button>
              )}
            </div>
          </div>
          <div className="py-2">
            <ul className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {mainMenuItems.map((item, index) => (
                <li key={index} className="menu-item">
                  <Link
                    to={item.path}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-500 transition-colors py-2"
                  >
                    {item.icon && <item.icon className="text-sm" />}
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
              <li className="relative" ref={moreDropdownRef}>
                <button
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-500 transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => {
                    setIsMoreDropdownOpen(!isMoreDropdownOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  aria-label="Menu lainnya"
                >
                  <span>LAINNYA</span>
                  <FaChevronDown className="text-xs" />
                </button>
                {isMoreDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-100 dropdown-menu z-50">
                    {dropdownItems.map((item, index) => (
                      <Link
                        key={index}
                        to={item.path}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        onClick={() => setIsMoreDropdownOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-all duration-300 ${
          isMobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <div
          className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-6">
            <button
              className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-blue-500 focus:ring-2 focus:ring-blue-500"
              onClick={toggleMobileMenu}
              aria-label="Tutup menu mobile"
            >
              <FaTimes />
            </button>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaNewspaper className="text-white text-sm" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">NewsWara</h2>
                <p className="text-xs text-gray-500">Menu Navigasi</p>
              </div>
            </div>
            <ul className="space-y-2">
              {[...mainMenuItems, ...dropdownItems].map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors"
                    onClick={toggleMobileMenu}
                  >
                    {item.icon && <item.icon className="text-sm" />}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AuthModal
          formMode={formMode}
          setFormMode={setFormMode}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;