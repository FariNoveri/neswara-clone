import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from "react-icons/fa";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, FacebookAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
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
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);
  const [dailyAttemptsRemaining, setDailyAttemptsRemaining] = useState(5);
  const [failedPasswordAttempts, setFailedPasswordAttempts] = useState(0);

  const auth = getAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const MAX_ATTEMPTS = 5; // Temporary rate limit
  const DAILY_LIMIT = 5; // Total login attempts per day
  const MAX_FAILED_PASSWORD_ATTEMPTS = 5; // Failed password attempts per day
  const COOLDOWN_PERIODS = [60, 300, 600]; // 1 min, 5 min, 10 min

  // Calculate time until midnight
  const getSecondsUntilMidnight = useCallback(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.ceil((midnight - now) / 1000);
  }, []);

  // Check if it's a new day
  const isNewDay = useCallback((lastAttemptDate) => {
    const today = new Date().toDateString();
    const lastDate = lastAttemptDate ? new Date(lastAttemptDate).toDateString() : null;
    return !lastAttemptDate || today !== lastDate;
  }, []);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!user.emailVerified) {
          setIsUnverifiedPopupOpen(true);
          signOut(auth);
        } else {
          setSuccess("Login berhasil!");
          // PERBAIKAN: Hanya reset temporary rate limit, bukan daily attempts
          const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts')) || {
            count: 0,
            timestamp: null,
            blockCount: 0,
            dailyAttempts: 0,
            lastAttemptDate: new Date().toDateString()
          };
          const failedPasswordAttempts = JSON.parse(localStorage.getItem('failedPasswordAttempts')) || {
            count: 0,
            lastAttemptDate: new Date().toDateString()
          };
          
          // Reset hanya temporary rate limit, preserve daily attempts
          localStorage.setItem('loginAttempts', JSON.stringify({
            ...loginAttempts,
            count: 0,
            timestamp: null,
            blockCount: 0
          }));
          localStorage.setItem('failedPasswordAttempts', JSON.stringify({
            ...failedPasswordAttempts,
            count: 0
          }));
          
          setIsRateLimited(false);
          setRemainingTime(0);
          navigate("/");
          if (typeof onClose === 'function') onClose();
        }
      }
    }, (err) => {
      console.error('Auth state error:', err);
      setError("Gagal memeriksa status autentikasi.");
    });
    return () => unsubscribe();
  }, [auth, navigate, onClose]);

  // Initialize rate limiter state
  useEffect(() => {
    const checkRateLimits = () => {
      const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts')) || {
        count: 0,
        timestamp: null,
        blockCount: 0,
        dailyAttempts: 0,
        lastAttemptDate: null
      };
      const failedPasswordAttempts = JSON.parse(localStorage.getItem('failedPasswordAttempts')) || {
        count: 0,
        lastAttemptDate: null
      };
      const now = Date.now();
      const today = new Date().toDateString();

      // Reset daily counters if it's a new day
      if (isNewDay(loginAttempts.lastAttemptDate)) {
        loginAttempts.dailyAttempts = 0;
        loginAttempts.lastAttemptDate = today;
        loginAttempts.count = 0;
        loginAttempts.timestamp = null;
        loginAttempts.blockCount = 0;
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
      }
      if (isNewDay(failedPasswordAttempts.lastAttemptDate)) {
        failedPasswordAttempts.count = 0;
        failedPasswordAttempts.lastAttemptDate = today;
        localStorage.setItem('failedPasswordAttempts', JSON.stringify(failedPasswordAttempts));
      }

      setDailyAttemptsRemaining(DAILY_LIMIT - loginAttempts.dailyAttempts);
      setFailedPasswordAttempts(failedPasswordAttempts.count);

      // Check daily limits
      if (loginAttempts.dailyAttempts >= DAILY_LIMIT || failedPasswordAttempts.count >= MAX_FAILED_PASSWORD_ATTEMPTS) {
        setIsDailyLimitReached(true);
        setRemainingTime(getSecondsUntilMidnight());
      } else {
        setIsDailyLimitReached(false);
      }

      // Check temporary rate limit
      if (loginAttempts.timestamp) {
        const cooldownPeriod = COOLDOWN_PERIODS[Math.min(loginAttempts.blockCount, COOLDOWN_PERIODS.length - 1)] * 1000;
        const timeElapsed = now - loginAttempts.timestamp;
        if (timeElapsed < cooldownPeriod) {
          setIsRateLimited(true);
          setRemainingTime(Math.ceil((cooldownPeriod - timeElapsed) / 1000));
        } else {
          localStorage.setItem('loginAttempts', JSON.stringify({
            ...loginAttempts,
            count: 0,
            timestamp: null,
            blockCount: loginAttempts.blockCount
          }));
          setIsRateLimited(false);
          setRemainingTime(0);
        }
      }
    };

    checkRateLimits();
    const interval = setInterval(checkRateLimits, 1000);
    return () => clearInterval(interval);
  }, [getSecondsUntilMidnight, isNewDay]);

  const verifyRecaptcha = useCallback(async (token, action) => {
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
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Verifikasi reCAPTCHA gagal.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      if (error.name === 'AbortError') {
        setError('Verifikasi reCAPTCHA timeout. Silakan coba lagi.');
      } else {
        setError(error.message || 'Gagal memverifikasi reCAPTCHA.');
      }
      return false;
    }
  }, []);

  const updateRateLimits = useCallback((isFailedPassword = false, isSuccess = false) => {
    const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts')) || {
      count: 0,
      timestamp: null,
      blockCount: 0,
      dailyAttempts: 0,
      lastAttemptDate: null
    };
    const failedPasswordAttempts = JSON.parse(localStorage.getItem('failedPasswordAttempts')) || {
      count: 0,
      lastAttemptDate: null
    };
    const today = new Date().toDateString();

    // PERBAIKAN: Jika sukses, hanya reset temporary rate limit
    if (isSuccess) {
      localStorage.setItem('loginAttempts', JSON.stringify({
        ...loginAttempts,
        count: 0,
        timestamp: null,
        blockCount: 0
      }));
      localStorage.setItem('failedPasswordAttempts', JSON.stringify({
        ...failedPasswordAttempts,
        count: 0
      }));
      setIsRateLimited(false);
      setRemainingTime(0);
      // Tidak reset daily attempts dan failed password attempts
      return;
    }

    // Update daily attempts
    if (isNewDay(loginAttempts.lastAttemptDate)) {
      loginAttempts.dailyAttempts = 1;
      loginAttempts.lastAttemptDate = today;
      loginAttempts.count = 1;
    } else {
      loginAttempts.dailyAttempts += 1;
      loginAttempts.count += 1;
    }

    // Update failed password attempts
    if (isFailedPassword) {
      if (isNewDay(failedPasswordAttempts.lastAttemptDate)) {
        failedPasswordAttempts.count = 1;
        failedPasswordAttempts.lastAttemptDate = today;
      } else {
        failedPasswordAttempts.count += 1;
      }
    }

    // Apply temporary rate limit
    if (loginAttempts.count >= MAX_ATTEMPTS) {
      loginAttempts.count = 0;
      loginAttempts.timestamp = Date.now();
      loginAttempts.blockCount = Math.min(loginAttempts.blockCount + 1, COOLDOWN_PERIODS.length - 1);
      setIsRateLimited(true);
      setRemainingTime(COOLDOWN_PERIODS[loginAttempts.blockCount]);
    }

    // Apply daily limits
    if (loginAttempts.dailyAttempts >= DAILY_LIMIT || failedPasswordAttempts.count >= MAX_FAILED_PASSWORD_ATTEMPTS) {
      setIsDailyLimitReached(true);
      setRemainingTime(getSecondsUntilMidnight());
    }

    setDailyAttemptsRemaining(DAILY_LIMIT - loginAttempts.dailyAttempts);
    setFailedPasswordAttempts(failedPasswordAttempts.count);

    localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
    localStorage.setItem('failedPasswordAttempts', JSON.stringify(failedPasswordAttempts));

    console.log('Updated login attempts:', loginAttempts, 'Failed password attempts:', failedPasswordAttempts);
  }, [getSecondsUntilMidnight, isNewDay]);

  const validateEmail = useCallback((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }, []);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();

    if (isDailyLimitReached) {
      setError(`Batas percobaan login harian (${DAILY_LIMIT} kali) atau gagal password (${MAX_FAILED_PASSWORD_ATTEMPTS} kali) telah tercapai. Silakan coba lagi dalam ${remainingTime} detik.`);
      return;
    }

    if (isRateLimited) {
      setError(`Terlalu banyak percobaan login. Silakan tunggu ${remainingTime} detik.`);
      return;
    }

    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Email dan password harus diisi.");
      setLoading(false);
      updateRateLimits();
      return;
    }

    if (!validateEmail(email)) {
      setError("Format email tidak valid.");
      setLoading(false);
      updateRateLimits();
      return;
    }

    if (!recaptchaToken) {
      setError("Harap selesaikan reCAPTCHA.");
      setLoading(false);
      updateRateLimits();
      return;
    }

    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, "login");
    if (!isRecaptchaValid) {
      setLoading(false);
      updateRateLimits();
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        setIsUnverifiedPopupOpen(true);
        await signOut(auth);
        setLoading(false);
        updateRateLimits();
        return;
      }
      updateRateLimits(false, true);
    } catch (err) {
      console.error('Firebase error:', err.code, err.message);
      updateRateLimits(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential');
      setError(`${err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' ? 'Email atau password salah' : err.message || 'Login gagal'}. Sisa percobaan hari ini: ${Math.max(0, dailyAttemptsRemaining - 1)}, gagal password: ${Math.max(0, MAX_FAILED_PASSWORD_ATTEMPTS - failedPasswordAttempts - (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' ? 1 : 0))}.`);
      setLoading(false);
    }
  }, [email, password, recaptchaToken, isRateLimited, isDailyLimitReached, remainingTime, dailyAttemptsRemaining, failedPasswordAttempts, validateEmail, updateRateLimits]);

  const handleSocialLogin = useCallback(async (providerType) => {
    if (isDailyLimitReached) {
      setError(`Batas percobaan login harian (${DAILY_LIMIT} kali) atau gagal password (${MAX_FAILED_PASSWORD_ATTEMPTS} kali) telah tercapai. Silakan coba lagi dalam ${remainingTime} detik.`);
      return;
    }

    if (isRateLimited) {
      setError(`Terlalu banyak percobaan login. Silakan tunggu ${remainingTime} detik.`);
      return;
    }

    setLoading(true);
    setError("");
    updateRateLimits();

    let provider;
    if (providerType === 'google') {
      provider = new GoogleAuthProvider();
      provider.setCustomParameters({ 'prompt': 'select_account', 'include_granted_scopes': 'true' });
    } else if (providerType === 'facebook') {
      provider = new FacebookAuthProvider();
      provider.setCustomParameters({ 'display': 'popup' });
    }

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      if (!user.emailVerified) {
        setIsUnverifiedPopupOpen(true);
        await signOut(auth);
        setLoading(false);
        return;
      }
      updateRateLimits(false, true);
    } catch (err) {
      console.error(`${providerType} login failed:`, err);
      if (err.code === 'auth/popup-blocked' || err.message.includes('Cross-Origin-Opener-Policy') || err.message.includes('window.closed') || err.message.includes('COOP')) {
        setError("Popup diblokir atau gagal karena pengaturan keamanan browser. Mengalihkan...");
        try {
          await signInWithRedirect(auth, provider);
          setSuccess(`Mengalihkan untuk login dengan ${providerType === 'google' ? 'Google' : 'Facebook'}...`);
        } catch (redirectErr) {
          setError(`Gagal mengalihkan login. Coba gunakan login email atau browser lain. Sisa percobaan hari ini: ${Math.max(0, dailyAttemptsRemaining - 1)}.`);
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError(`Popup ditutup sebelum login selesai. Sisa percobaan hari ini: ${Math.max(0, dailyAttemptsRemaining - 1)}.`);
      } else {
        setError(`${err.message || `Login dengan ${providerType === 'google' ? 'Google' : 'Facebook'} gagal.`} Sisa percobaan hari ini: ${Math.max(0, dailyAttemptsRemaining - 1)}.`);
      }
      setLoading(false);
    }
  }, [isRateLimited, isDailyLimitReached, remainingTime, dailyAttemptsRemaining, updateRateLimits]);

  const handleGoogleLogin = () => handleSocialLogin('google');
  const handleFacebookLogin = () => handleSocialLogin('facebook');

  const isLoginDisabled = loading || !recaptchaToken || isRateLimited || isDailyLimitReached;

  return (
    <>
      {error && (
        <div className="bg-red-50 border-b border-red-600 text-red-600 px-4 py-3 rounded-lg mb-2 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-b border-green-600 text-green-600 px-4 py-2 rounded-lg mb-2 text-sm">
          {success}
        </div>
      )}
      {!isDailyLimitReached && (
        <div className="bg-blue-50 border-b border-blue-600 text-blue-600 px-4 py-2 rounded-lg mb-2 text-sm">
          Sisa percobaan login hari ini: {dailyAttemptsRemaining}, gagal password: {Math.max(0, MAX_FAILED_PASSWORD_ATTEMPTS - failedPasswordAttempts)}
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
              disabled={isLoginDisabled}
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoginDisabled}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoginDisabled}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITEKEY}
            onChange={(token) => setRecaptchaToken(token)}
            onErrored={() => setError("Gagal memuat reCAPTCHA. Periksa koneksi internet Anda.")}
            onExpired={() => {
              setRecaptchaToken(null);
              setError("reCAPTCHA kadaluarsa. Silakan coba lagi.");
            }}
          />
          <button
            type="submit"
            disabled={isLoginDisabled}
            className="w-full bg-blue-500 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-between my-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="px-2 text-sm text-gray-500">ATAU</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoginDisabled}
          className="flex items-center justify-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
        >
          <FaGoogle className="mr-2 text-red-500" />
          Google
        </button>
        <button
          onClick={handleFacebookLogin}
          disabled={isLoginDisabled}
          className="flex items-center justify-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
        >
          <FaFacebook className="mr-2 text-blue-600" />
          Facebook
        </button>
      </div>
      <div className="text-center mt-4 text-sm">
        <p className="text-gray-600">
          Belum punya akun?{" "}
          <button
            type="button"
            className="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => onSwitchForm("register")}
            disabled={isLoginDisabled}
          >
            Daftar sekarang
          </button>
        </p>
        <p className="text-gray-600 mt-2">
          Lupa password?{" "}
          <button
            type="button"
            className="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => onSwitchForm("forgot")}
            disabled={isLoginDisabled}
          >
            Reset di sini
          </button>
        </p>
      </div>
      {isUnverifiedPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md mx-4 p-6 rounded-lg shadow-lg animate-bounce-in">
            <h2 className="text-lg font-bold text-red-600">Akun Belum Terverifikasi</h2>
            <p className="text-gray-600 mt-2">
              Silakan verifikasi email Anda untuk melanjutkan. Periksa kotak masuk Anda untuk tautan verifikasi.
            </p>
            <button
              onClick={() => setIsUnverifiedPopupOpen(false)}
              className="w-full bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      {isRateLimited && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md mx-4 p-6 rounded-lg shadow-lg animate-bounce-in">
            <h2 className="text-lg font-bold text-red-600">Login Dibatasi Sementara</h2>
            <p className="text-gray-600 mt-2">
              Anda telah mencapai batas percobaan login sementara. Silakan tunggu {remainingTime} detik.
            </p>
            <button
              onClick={() => setIsRateLimited(false)}
              className="w-full bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      {isDailyLimitReached && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md mx-4 p-6 rounded-lg shadow-lg animate-bounce-in">
            <h2 className="text-lg font-bold text-red-600">Batas Harian Tercapai</h2>
            <p className="text-gray-600 mt-2">
              Anda telah mencapai batas percobaan login harian ({DAILY_LIMIT - dailyAttemptsRemaining}/{DAILY_LIMIT} total, {failedPasswordAttempts}/{MAX_FAILED_PASSWORD_ATTEMPTS} gagal password). Silakan coba lagi dalam {remainingTime} detik atau hubungi admin.
            </p>
            <button
              onClick={() => setIsDailyLimitReached(false)}
              className="w-full bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease;
        }
      `}</style>
    </>
  );
};

export default Login;