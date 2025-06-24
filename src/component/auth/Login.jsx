import React, { useState, useRef } from "react";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from "react-icons/fa";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, FacebookAuthProvider, signOut } from "firebase/auth";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";

const Login = ({ onSwitchForm, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isUnverifiedPopupOpen, setIsUnverifiedPopupOpen] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const verifyRecaptcha = async (token, action) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("http://localhost:3001/verify-recaptcha", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, action }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'reCAPTCHA verification failed');
        return false;
      }
      return true;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      if (error.name === 'AbortError') {
        setError('reCAPTCHA verification timed out. Please try again.');
      } else {
        setError(error.message || 'Gagal memverifikasi reCAPTCHA.');
      }
      return false;
    }
  };

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
        await signOut(auth);
        setLoading(false);
        return;
      }
      setSuccess("Login berhasil!");
      navigate("/");
      if (typeof onClose === 'function') onClose(); // Safe call to onClose
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Email atau password salah.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else {
        setError(err.message || "Login gagal. Periksa email dan password.");
      }
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerType) => {
    setLoading(true);
    setError("");
    
    let provider;
    if (providerType === 'google') {
      provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        'prompt': 'select_account',
        'include_granted_scopes': 'true'
      });
    } else if (providerType === 'facebook') {
      provider = new FacebookAuthProvider();
      provider.setCustomParameters({
        'display': 'popup'
      });
    }

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          setIsUnverifiedPopupOpen(true);
          await signOut(auth);
          setLoading(false);
          return;
        }
        
        setSuccess(`Login dengan ${providerType === 'google' ? 'Google' : 'Facebook'} berhasil!`);
        navigate("/");
        if (typeof onClose === 'function') onClose(); // Safe call to onClose
        return;
        
      } catch (err) {
        attempts++;
        console.error(`${providerType} login attempt ${attempts} failed:`, err);
        
        if (err.code === 'auth/popup-blocked') {
          setError("Popup diblokir browser. Silakan aktifkan popup atau coba lagi.");
          break;
        } else if (err.code === 'auth/popup-closed-by-user') {
          setError("Popup ditutup sebelum login selesai. Silakan coba lagi.");
          break;
        } else if (err.code === 'auth/cancelled-popup-request') {
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        } else if (err.message && (
          err.message.includes('Cross-Origin-Opener-Policy') || 
          err.message.includes('window.closed') ||
          err.message.includes('COOP')
        )) {
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          } else {
            // Fallback to signInWithRedirect
            setError("Popup login gagal karena pengaturan keamanan browser. Mengalihkan...");
            try {
              await signInWithRedirect(auth, provider);
              return; // Redirect handles navigation and modal closing
            } catch (redirectErr) {
              setError("Gagal mengalihkan login. Coba gunakan login email atau browser lain.");
            }
            break;
          }
        } else {
          setError(err.message || `Login dengan ${providerType === 'google' ? 'Google' : 'Facebook'} gagal.`);
          break;
        }
      }
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => handleSocialLogin('google');
  const handleFacebookLogin = () => handleSocialLogin('facebook');

  return (
    <>
      {error && (
        <div className="bg-red-50 border-b border-red-600 text-red-600 px-4 py-3 rounded-lg mb-2 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500 border-b border-green-600 text-green-600 px-4 py-2 rounded-lg mb-2 text-sm">
          {success}
        </div>
      )}
      <form onSubmit={handleLogin}>
        <div className="space-y-2">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-2 py-2 text-sm border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey="6LdUQGorAAAAAOuQQwPAYnGtJrDmewRwGJbh1gJK"
            onChange={(token) => setRecaptchaToken(token)}
            onErrored={() => setError("Failed to load reCAPTCHA. Please check your connection.")}
            onExpired={() => {
              setRecaptchaToken(null);
              setError("reCAPTCHA expired. Please try again.");
            }}
          />
          <button
            type="submit"
            disabled={loading || !recaptchaToken}
            className="w-full bg-blue-500 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-between my-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="px-2 text-sm text-gray-500">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
        >
          <FaGoogle className="mr-2 text-red-500" />
          Google
        </button>
        <button
          onClick={handleFacebookLogin}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
        >
          <FaFacebook className="mr-2 text-blue-600" />
          Facebook
        </button>
      </div>
      <div className="text-center mt-4 text-sm">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => onSwitchForm("register")}
          >
            Sign up now
          </button>
        </p>
        <p className="text-gray-600 mt-2">
          Forgot password?{" "}
          <button
            type="button"
            className="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => onSwitchForm("forgot")}
          >
            Reset here
          </button>
        </p>
      </div>
      {isUnverifiedPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md mx-4 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold">Account Not Verified</h2>
            <p className="text-gray-600 mt-2">
              Please verify your email to proceed. Check your inbox for the verification link.
            </p>
            <button
              onClick={() => setIsUnverifiedPopupOpen(false)}
              className="w-full bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;