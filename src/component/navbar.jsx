import React, { useState, useEffect } from "react";
import { FaSearch, FaUserCircle, FaBars, FaTimes, FaEllipsisH, FaEye, FaEyeSlash, FaFacebook, FaGoogle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { auth } from "../firebaseconfig"; // Pastikan auth di-import
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth"; // Impor hanya sekali

import logo from "../assets/neswara (1).jpg";
import { registerUser, loginUser, loginWithGoogle, loginWithFacebook, logoutUser } from "./auth"; // Pastikan ini tidak mendeklarasikan ulang logoutUser


const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // Untuk animasi keluar
  const [isSwitching, setIsSwitching] = useState(false); // Untuk animasi switch form

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsClosing(false); // Reset animasi keluar
  };

  const handleCloseModal = () => {
    setIsClosing(true); // Memulai animasi keluar
    setTimeout(() => {
      setIsModalOpen(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
    }, 300); // Sesuaikan dengan durasi animasi
  };

  const handleSwitchForm = () => {
    setIsSwitching(true); // Memulai animasi switch form
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsSwitching(false); // Reset animasi switch form
      setError("");
    }, 300); // Sesuaikan dengan durasi animasi
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
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError(error.message);
    }
  };

  // Menutup modal ketika menekan tombol ESC
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
      {/* CSS Styles */}
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

      {/* Navbar */}
      <nav className="w-full bg-white shadow-md px-4 py-4">
        <div className="container mx-auto flex justify-between items-center px-4 md:px-20">
          <div className="flex items-center space-x-4">
            <button className="md:hidden text-black text-2xl focus:outline-none">
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
            <li>
              <FaEllipsisH className="text-black text-lg cursor-pointer hover:text-yellow-500" />
            </li>
          </ul>

          <div className="flex items-center space-x-4">
            <FaSearch aria-label="Search" className="text-black text-lg cursor-pointer hover:text-yellow-500" />
            {user ? (
              <button
                className="text-black text-lg font-semibold cursor-pointer hover:text-yellow-500"
                onClick={handleLogout}
              >
                Logout
              </button>
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

      {/* Modal */}
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
              onClick={loginWithFacebook}
               className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                <FaFacebook className="mr-2" />
                Facebook
              </button>
              <button
              onClick={loginWithGoogle}
               className="flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">
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