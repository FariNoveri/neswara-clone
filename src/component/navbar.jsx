import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaUserCircle, FaBars, FaTimes, FaEllipsisH, FaEye, FaEyeSlash, FaFacebook, FaGoogle, FaChevronRight } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { auth } from "../firebaseconfig";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

import logo from "../assets/neswara (1).jpg";
import { registerUser, loginUser, loginWithGoogle, loginWithFacebook, logoutUser } from "./auth";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();

  const timeoutRef = useRef(null); // ✅ Ref to store the timeout

  const navbarItems = [
    {
      name: "Atomic Design",
      path: "/atomicdesign",
      children: [
        {
          name: "Atoms",
          path: "/atomicdesign/atoms",
          children: ["Button", "Icon", "Logo", "NavLink"].map((item) => ({
            name: item,
            path: `/atomicdesign/atoms/${item.toLowerCase()}`,
          })),
        },
        {
          name: "Molecules",
          path: "/atomicdesign/molecules",
          children: ["SearchBar", "UserMenu", "MobileMenuButton"].map((item) => ({
            name: item,
            path: `/atomicdesign/molecules/${item.toLowerCase()}`,
          })),
        },
        {
          name: "Organisms",
          path: "/atomicdesign/organisms",
          children: ["NavbarAtomicDesign"].map((item) => ({
            name: item,
            path: `/atomicdesign/organisms/${item.toLowerCase()}`,
          })),
        },
      ],
    },
  ];
  
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const subMenuTimeoutRef = useRef(null);

  // ✅ Function to reset the logout timer
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      signOut(auth)
        .then(() => {
          navigate('/');
          alert("Session expired. You have been logged out.");
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          setError("Failed to log out: " + error.message);
        });
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
  };

  // ✅ Handle user activity to reset timer
  const handleUserActivity = () => {
    resetTimeout();
  };

  const handleMouseEnter = (menuName) => {
    if (subMenuTimeoutRef.current) clearTimeout(subMenuTimeoutRef.current);
    setActiveSubMenu(menuName);
  };
  
  const handleMouseLeave = () => {
    subMenuTimeoutRef.current = setTimeout(() => setActiveSubMenu(null), 300);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // ✅ Start the timeout when user is authenticated
        resetTimeout();

        // ✅ Add event listeners for user activity
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('click', handleUserActivity);
      } else {
        // ✅ Clear timeout and event listeners if user is not authenticated
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('click', handleUserActivity);
      }
    });

    // ✅ Cleanup on unmount
    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (subMenuTimeoutRef.current) {
        clearTimeout(subMenuTimeoutRef.current);
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };  

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsClosing(false);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
    }, 300);
  };

  const handleSwitchForm = () => {
    setIsSwitching(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsSwitching(false);
      setError("");
    }, 300);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      handleCloseModal();
      navigate('/profile');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleCloseModal();
      navigate('/profile');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      handleCloseModal();
      navigate('/profile');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      handleCloseModal();
      navigate('/profile');
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideOutToLeft {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(-100%);
            }
          }

          .mobile-menu {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 70%;
            max-width: 280px;
            background: white;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
            padding: 20px;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s ease-out;
          }

          .mobile-menu.open {
            transform: translateX(0);
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
              transform: translateY(0);
            }
            to {
              opacity: 0;
              transform: translateY(-20px);
            }
          }

          .modal-content {
            animation: fadeIn 0.3s ease-out;
          }

          .modal-content.closing {
            animation: fadeOut 0.3s ease-in;
          }

          .modal-content.switching {
            animation: fadeOut 0.3s ease-out;
          }

          .modal-content.switching.active {
            animation: fadeIn 0.3s ease-in;
          }

          .text-black {
            color: black;
          }

          .text-green-500 {
            color: #10B981;
          }

          .text-green-500:hover {
            text-decoration: underline;
            cursor: pointer;
          }
        `}
      </style>

      <nav className="w-full bg-white shadow-md px-4 py-4">
        <div className="container mx-auto flex justify-between items-center px-4 md:px-20">
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden text-black text-2xl focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <FaBars />
            </button>
            <img src={logo} alt="Neswara Logo" className="h-12 mr-1" />
          </div>

          <ul className="hidden md:flex space-x-6 font-semibold text-black">
            <li className="hover:text-yellow-500 cursor-pointer">LIFESTYLE</li>
            <li className="hover:text-yellow-500 cursor-pointer">EDUCATION</li>
            <li className="hover:text-yellow-500 cursor-pointer">REGION</li>
            <li className="hover:text-yellow-500 cursor-pointer">SPORT</li>
            <li className="hover:text-yellow-500 cursor-pointer">TOUR & TRAVEL</li>
            <li className="hover:text-yellow-500 cursor-pointer">NATIONAL</li>
            <li className="hover:text-yellow-500 cursor-pointer">BUSINESS</li>
            
            <li className="relative">
              <FaEllipsisH
                className="text-black text-lg cursor-pointer hover:text-yellow-500"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              />

              {isDropdownOpen && (
                <ul className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md py-2 z-50">
                  {navbarItems.map((item, index) => (
                    <li
                      key={index}
                      className="relative group px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseEnter={() => handleMouseEnter(item.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <span className="flex justify-between items-center">
                        {item.name}
                        {item.children && <FaChevronRight className="text-gray-500" />}
                      </span>

                      {activeSubMenu === item.name && item.children && (
                        <ul
                          className="absolute left-full top-0 w-48 bg-white shadow-md rounded-md py-2"
                          onMouseEnter={() => handleMouseEnter(item.name)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {item.children.map((subItem, subIndex) => (
                            <li
                              key={subIndex}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => navigate(subItem.path)}
                            >
                              {subItem.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>

          <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-all duration-300 ${isMobileMenuOpen ? "block" : "hidden"}`}>
            <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg p-5 transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
              <button className="absolute top-4 right-4 text-2xl text-gray-600" onClick={toggleMobileMenu}>
                <FaTimes />
              </button>

              <ul className="mt-10 space-y-6 font-semibold text-black">
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

          <div className="flex items-center space-x-4">
            <FaSearch aria-label="Search" className="text-black text-lg cursor-pointer hover:text-yellow-500" />
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  className="text-black text-sm font-semibold cursor-pointer hover:text-yellow-500"
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </button>
                <button
                  className="text-black text-sm font-semibold cursor-pointer hover:text-yellow-500"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <FaUserCircle
                aria-label="User"
                className="text-black text-2xl cursor-pointer hover:text-yellow-500"
                onClick={handleOpenModal}
              />
            )}
          </div>
        </div>
      </nav>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={handleCloseModal}>
          <div
            className={`bg-white w-full max-w-md p-6 rounded-lg shadow-lg modal-content ${
              isClosing ? "closing" : isSwitching ? "switching" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-black text-2xl font-bold mb-4">{isLogin ? "LOG IN" : "SIGN UP"}</h2>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <form onSubmit={isLogin ? handleLogin : handleRegister}>
              <input
                type="email"
                placeholder="Your email"
                className="w-full border border-gray-300 px-4 py-2 rounded-md mb-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full border border-gray-300 px-4 py-2 rounded-md mb-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {!isLogin && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full border border-gray-300 px-4 py-2 rounded-md mb-4"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
              >
                {isLogin ? "LOG IN" : "SIGN UP"}
              </button>
            </form>

            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={handleFacebookLogin}
                className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                <FaFacebook className="mr-2" />
                Facebook
              </button>
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                <FaGoogle className="mr-2" />
                Google
              </button>
            </div>

            <p className="text-center mt-4 text-black">
              {isLogin ? (
                <>Don't have an account? <span className="text-green-500" onClick={handleSwitchForm}>Sign up</span></>
              ) : (
                <>Already have an account? <span className="text-green-500" onClick={handleSwitchForm}>Log in</span></>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;