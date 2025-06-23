
   import React, { useState, useEffect, useRef } from "react";
   import { FaSearch, FaUserCircle, FaBars, FaTimes, FaEye, FaEyeSlash, FaFacebook, FaGoogle, FaChevronDown, FaBell, FaHome, FaNewspaper, FaGlobe } from "react-icons/fa";
   import { Link, useNavigate } from "react-router-dom";
   import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
   import ReCAPTCHA from "react-google-recaptcha";
   import { sendVerificationEmail } from "./emailservice";

   const Navbar = () => {
     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
     const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
     const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [formMode, setFormMode] = useState("login");
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [confirmPassword, setConfirmPassword] = useState("");
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState("");
     const [success, setSuccess] = useState("");
     const [showPassword, setShowPassword] = useState(false);
     const [isClosing, setIsClosing] = useState(false);
     const [isSwitching, setIsSwitching] = useState(false);
     const [isScrolled, setIsScrolled] = useState(false);
     const [isVerificationPopupOpen, setIsVerificationPopupOpen] = useState(false);
     const [isUnverifiedPopupOpen, setIsUnverifiedPopupOpen] = useState(false);
     const [recaptchaToken, setRecaptchaToken] = useState(null);

     const auth = getAuth();
     const navigate = useNavigate();
     const profileDropdownRef = useRef(null);
     const moreDropdownRef = useRef(null);
     const recaptchaRef = useRef(null);

     // Menu items
     const mainMenuItems = [
       { name: "BERANDA", path: "/", icon: FaHome },
       { name: "NASIONAL", path: "/nasional", icon: FaNewspaper },
       { name: "INTERNASIONAL", path: "/internasional", icon: FaGlobe },
       { name: "OLAHRAGA", path: "/olahraga" },
       { name: "EKONOMI", path: "/ekonomi" },
       { name: "TEKNOLOGI", path: "/teknologi" },
       { name: "LIFESTYLE", path: "/lifestyle" },
       { name: "DAERAH", path: "/daerah" },
     ];

     const dropdownItems = [
       { name: "PENDIDIKAN", path: "/pendidikan" },
       { name: "KESEHATAN", path: "/kesehatan" },
       { name: "OTOMOTIF", path: "/otomotif" },
       { name: "WISATA", path: "/wisata" },
       { name: "KULINER", path: "/kuliner" },
       { name: "ENTERTAINMENT", path: "/entertainment" },
     ];

     // Check auth state and enforce email verification
     useEffect(() => {
       const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
         if (currentUser && !currentUser.emailVerified) {
           await signOut(auth);
           setUser(null);
           setIsVerificationPopupOpen(true);
         } else {
           setUser(currentUser);
         }
       });
       return () => unsubscribe();
     }, [auth]);

     // Scroll effect
     useEffect(() => {
       const handleScroll = () => {
         setIsScrolled(window.scrollY > 10);
       };
       window.addEventListener("scroll", handleScroll);
       return () => window.removeEventListener("scroll", handleScroll);
     }, []);

     // Close dropdowns when clicking outside
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

     // Verify reCAPTCHA with backend
     const verifyRecaptcha = async (token, action) => {
       try {
         const response = await fetch('http://localhost:3001/api/verify-recaptcha', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ token, action }),
         });
         const data = await response.json();
         return data.success && data.score >= 0.7;
       } catch (error) {
         console.error('reCAPTCHA verification failed:', error);
         setError('Gagal memverifikasi reCAPTCHA. Periksa koneksi atau server.');
         return false;
       }
     };

     // Handle login
     const handleLogin = async (e) => {
       e.preventDefault();
       setLoading(true);
       setError("");

       if (!recaptchaToken) {
         setError("Harap selesaikan reCAPTCHA.");
         setLoading(false);
         return;
       }

       const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, "login");
       if (!isRecaptchaValid) {
         setLoading(false);
         return;
       }

       try {
         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const user = userCredential.user;
         if (!user.emailVerified) {
           setIsUnverifiedPopupOpen(true);
           setLoading(false);
           return;
         }
         setSuccess("Login berhasil!");
         handleCloseModal();
         navigate("/");
       } catch (err) {
         setError(err.message || "Login gagal. Periksa email dan password.");
       }
       setLoading(false);
     };

     // Handle register
     const handleRegister = async (e) => {
       e.preventDefault();
       setLoading(true);
       setError("");

       if (!recaptchaToken) {
         setError("Harap selesaikan reCAPTCHA.");
         setLoading(false);
         return;
       }

       const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, "register");
       if (!isRecaptchaValid) {
         setLoading(false);
         return;
       }

       if (password !== confirmPassword) {
         setError("Password dan konfirmasi password tidak cocok.");
         setLoading(false);
         return;
       }

       try {
         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
         const user = userCredential.user;
         await sendVerificationEmail(user);
         setSuccess("Pendaftaran berhasil! Silakan verifikasi email Anda untuk mengakses profil dan login.");
         setIsVerificationPopupOpen(true);
         await signOut(auth);
         handleSwitchForm("login");
       } catch (err) {
         setError(err.message || "Pendaftaran gagal. Periksa data Anda.");
       }
       setLoading(false);
     };

     // Handle forgot password
     const handleForgotPassword = async (e) => {
       e.preventDefault();
       setLoading(true);
       setError("");
       try {
         await sendPasswordResetEmail(auth, email);
         setSuccess("Link reset password telah dikirim ke email Anda.");
       } catch (err) {
         setError(err.message || "Gagal mengirim link reset. Periksa email Anda.");
       }
       setLoading(false);
     };

     // Handle Google login
     const handleGoogleLogin = async () => {
       setLoading(true);
       setError("");
       try {
         const provider = new GoogleAuthProvider();
         await signInWithPopup(auth, provider);
         setSuccess("Login dengan Google berhasil!");
         handleCloseModal();
         navigate("/");
       } catch (err) {
         setError(err.message || "Login dengan Google gagal.");
       }
       setLoading(false);
     };

     // Handle Facebook login
     const handleFacebookLogin = async () => {
       setLoading(true);
       setError("");
       try {
         const provider = new FacebookAuthProvider();
         await signInWithPopup(auth, provider);
         setSuccess("Login dengan Facebook berhasil!");
         handleCloseModal();
         navigate("/");
       } catch (err) {
         setError(err.message || "Login dengan Facebook gagal.");
       }
       setLoading(false);
     };

     // Handle logout
     const handleLogout = async () => {
       try {
         await signOut(auth);
         setUser(null);
         navigate("/");
       } catch (err) {
         setError(err.message || "Logout gagal.");
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
       setIsClosing(false);
       setError("");
       setSuccess("");
       setEmail("");
       setPassword("");
       setConfirmPassword("");
       setIsProfileDropdownOpen(false);
       setIsMoreDropdownOpen(false);
       setRecaptchaToken(null);
       if (recaptchaRef.current) recaptchaRef.current.reset();
     };

     const handleCloseModal = () => {
       setIsClosing(true);
       setTimeout(() => {
         setIsModalOpen(false);
         setIsClosing(false);
         setFormMode("login");
         setError("");
         setSuccess("");
         setRecaptchaToken(null);
         if (recaptchaRef.current) recaptchaRef.current.reset();
       }, 300);
     };

     const handleCloseVerificationPopup = () => {
       setIsVerificationPopupOpen(false);
     };

     const handleCloseUnverifiedPopup = () => {
       setIsUnverifiedPopupOpen(false);
     };

     const handleSwitchForm = (mode) => {
       setIsSwitching(true);
       setTimeout(() => {
         setFormMode(mode);
         setIsSwitching(false);
         setError("");
         setSuccess("");
         setEmail("");
         setPassword("");
         setConfirmPassword("");
         setRecaptchaToken(null);
         if (recaptchaRef.current) recaptchaRef.current.reset();
       }, 300);
     };

     return (
       <>
         <style>
           {`
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
             
             * {
               font-family: 'Inter', sans-serif;
             }
             
             @keyframes fadeIn {
               from { opacity: 0; transform: translateY(-20px); }
               to { opacity: 1; transform: translateY(0); }
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
             
             .modal-content {
               animation: fadeIn 0.3s ease-out;
               backdrop-filter: blur(10px);
               -webkit-backdrop-filter: blur(10px);
             }
             
             .modal-content.closing {
               animation: fadeOut 0.3s ease-in;
             }
             
             @keyframes fadeOut {
               from { opacity: 1; transform: scale(1); }
               to { opacity: 0; transform: scale(0.95); }
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
             
             .social-button {
               display: flex;
               align-items: center;
               justify-content: center;
               width: 100%;
               padding: 10px 15px;
               border: 1px solid #e5e7eb;
               border-radius: 0.5rem;
               color: #1f2937;
               font-weight: 500;
               transition: all 0.3s ease;
               background-color: white;
             }
             
             .social-button:hover {
               background-color: #f9fafb;
             }
             
             .g-recaptcha {
               transform: scale(0.8);
               transform-origin: 0 0;
               margin: 10px 0;
             }
           `}
         </style>

         {/* Breaking News Bar */}
         <div className="breaking-news">
           <div className="container mx-auto px-4 flex items-center">
             <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold mr-4 flex-shrink-0">
               BREAKING
             </span>
             <div className="overflow-hidden flex-1">
               <div className="breaking-news-text">
                 🔴 LIVE: Pemilu 2024 - Hasil Quick Count Terbaru | Ekonomi Indonesia Tumbuh 5.2% | Gempa 6.2 SR Guncang Sumatra
               </div>
             </div>
           </div>
         </div>

         {/* Main Navbar */}
         <nav className={`w-full sticky top-0 z-40 navbar-transition ${
           isScrolled ? 'glass-effect shadow-lg' : 'bg-white shadow-md'
         }`}>
           <div className="container mx-auto px-4">
             {/* Top Bar */}
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
                   {/* Logo */}
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
                 
                 {/* Date & Time */}
                 <div className="hidden lg:block text-sm text-gray-600">
                   <div className="flex items-center space-x-2">
                     <span>{new Date().toLocaleDateString('id-ID', { 
                       weekday: 'long', 
                       year: 'numeric', 
                       month: 'long', 
                       day: 'numeric' 
                     }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                 </div>
               </div>

               {/* Right Actions */}
               <div className="flex items-center space-x-4">
                 {/* Search */}
                 <div className="relative hidden sm:block">
                   <input
                     type="text"
                     placeholder="Cari berita..."
                     className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     aria-label="Cari berita"
                   />
                   <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 </div>
                 
                 <FaSearch className="sm:hidden text-gray-600 text-lg cursor-pointer hover:text-blue-500 transition-colors" aria-label="Cari" />
                 
                 {/* Notifications */}
                 <div className="relative">
                   <FaBell className="text-gray-600 text-lg cursor-pointer hover:text-blue-500 transition-colors" aria-label="Notifikasi" />
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-xs"></span>
                 </div>

                 {/* User Menu */}
                 {user && user.emailVerified ? (
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
                       <span className="text-sm font-medium">{user.displayName || user.email}</span>
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

             {/* Main Menu */}
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
                 
                 {/* More Menu */}
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

         {/* Mobile Menu */}
         <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-all duration-300 ${
           isMobileMenuOpen ? "block" : "hidden"
         }`}>
           <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ${
             isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
           }`}>
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

         {/* Login/Register Modal */}
         {isModalOpen && (
           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={handleCloseModal}>
             <div
               className={`bg-white w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl modal-content ${
                 isClosing ? "closing" : isSwitching ? "switching" : ""
               }`}
               onClick={(e) => e.stopPropagation()}
             >
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <FaUserCircle className="text-white text-2xl" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">
                   {formMode === "login" ? "Masuk Akun" : formMode === "register" ? "Daftar Akun" : "Reset Password"}
                 </h2>
                 <p className="text-gray-600 mt-2">
                   {formMode === "login" ? "Masuk untuk mengakses fitur lengkap" : 
                    formMode === "register" ? "Buat akun baru untuk bergabung" : 
                    "Kami akan mengirim link reset ke email Anda"}
                 </p>
               </div>

               {error && (
                 <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                   {error}
                 </div>
               )}
               
               {success && (
                 <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
                   {success}
                 </div>
               )}

               <form onSubmit={formMode === "login" ? handleLogin : formMode === "register" ? handleRegister : handleForgotPassword}>
                 <div className="space-y-4">
                   <div>
                     <input
                       type="email"
                       placeholder="Email"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                       aria-label="Email"
                     />
                   </div>
                   
                   {formMode !== "forgot" && (
                     <div className="relative">
                       <input
                         type={showPassword ? "text" : "password"}
                         placeholder="Password"
                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         required
                         aria-label="Password"
                       />
                       <button
                         type="button"
                         className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         onClick={() => setShowPassword(!showPassword)}
                         aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                       >
                         {showPassword ? <FaEyeSlash /> : <FaEye />}
                       </button>
                     </div>
                   )}
                   
                   {formMode === "register" && (
                     <div>
                       <input
                         type="password"
                         placeholder="Konfirmasi Password"
                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         required
                         aria-label="Konfirmasi Password"
                       />
                     </div>
                   )}

                  {(formMode === "login" || formMode === "register") && (
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey="6LdUQGorAAAAAOuQQwPAYnGtJrDmewRwGJbh1gJK" // Ganti dengan site key baru
                      onChange={(token) => setRecaptchaToken(token)}
                      onErrored={() => setError("Gagal memuat reCAPTCHA. Periksa kunci atau koneksi.")}
                      onExpired={() => {
                        setRecaptchaToken(null);
                        setError("reCAPTCHA kadaluarsa. Silakan coba lagi.");
                      }}
                    />
                  )}

                   <button
                     type="submit"
                     disabled={loading || !recaptchaToken}
                     className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                     aria-label={formMode === "login" ? "Masuk" : formMode === "register" ? "Daftar" : "Kirim Link Reset"}
                   >
                     {loading ? (
                       <div className="flex justify-center">
                         <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                       </div>
                     ) : (
                       formMode === "login" ? "Masuk" : formMode === "register" ? "Daftar" : "Kirim Link Reset"
                     )}
                   </button>
                 </div>
               </form>

               {formMode !== "forgot" && (
                 <>
                   <div className="flex items-center my-6">
                     <div className="flex-1 border-t border-gray-300"></div>
                     <span className="px-4 text-gray-500 text-sm">atau</span>
                     <div className="flex-1 border-t border-gray-300"></div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <button
                       onClick={handleGoogleLogin}
                       className="social-button flex items-center justify-center"
                     >
                       <FaGoogle className="text-red-500 mr-2" />
                       <span>Google</span>
                     </button>
                     <button
                       onClick={handleFacebookLogin}
                       className="social-button flex items-center justify-center"
                     >
                       <FaFacebook className="text-blue-600 mr-2" />
                       <span>Facebook</span>
                     </button>
                   </div>
                 </>
               )}

               <div className="text-center mt-6 text-sm">
                 {formMode === "login" ? (
                   <p className="text-gray-600">
                     Belum punya akun?{" "}
                     <button
                       type="button"
                       className="text-blue-500 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                       onClick={() => handleSwitchForm("register")}
                       aria-label="Daftar sekarang"
                     >
                       Daftar sekarang
                     </button>
                     <br />
                     <button
                       type="button"
                       className="text-blue-500 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                       onClick={() => handleSwitchForm("forgot")}
                       aria-label="Lupa password"
                     >
                       Lupa password?
                     </button>
                   </p>
                 ) : formMode === "register" ? (
                   <p className="text-gray-600">
                     Sudah punya akun?{" "}
                     <button
                       type="button"
                       className="text-blue-500 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                       onClick={() => handleSwitchForm("login")}
                       aria-label="Masuk di sini"
                     >
                       Masuk di sini
                     </button>
                   </p>
                 ) : (
                   <p className="text-gray-600">
                     Kembali ke{" "}
                     <button
                       type="button"
                       className="text-blue-500 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                       onClick={() => handleSwitchForm("login")}
                       aria-label="Halaman masuk"
                     >
                       halaman masuk
                     </button>
                   </p>
                 )}
               </div>
             </div>
           </div>
         )}

         {/* Verification Required Popup */}
         {isVerificationPopupOpen && (
           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={handleCloseVerificationPopup}>
             <div
               className="bg-white w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl modal-content"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Verifikasi Email Diperlukan</h2>
                 <p className="text-gray-600 mt-2">
                   Silakan periksa email Anda untuk memverifikasi akun Anda. Anda harus memverifikasi email sebelum dapat login atau mengakses profil.
                 </p>
               </div>
               <button
                 onClick={handleCloseVerificationPopup}
                 className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 aria-label="Tutup"
               >
                 Tutup
               </button>
             </div>
           </div>
         )}

         {/* Unverified Account Popup */}
         {isUnverifiedPopupOpen && (
           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={handleCloseUnverifiedPopup}>
             <div
               className="bg-white w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl modal-content"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Akun Belum Terverifikasi</h2>
                 <p className="text-gray-600 mt-2">
                   Anda harus memverifikasi email Anda sebelum dapat masuk. Silakan periksa email Anda dan ikuti tautan verifikasi.
                 </p>
               </div>
               <button
                 onClick={handleCloseUnverifiedPopup}
                 className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 aria-label="Tutup"
               >
                 Tutup
               </button>
             </div>
           </div>
         )}
       </>
     );
   };

   export default Navbar;
