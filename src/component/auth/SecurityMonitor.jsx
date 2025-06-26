import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const SecurityMonitor = () => {
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [ipAddress, setIpAddress] = useState("unknown");
  const [attackDetails, setAttackDetails] = useState("");

  // Helper function to detect XSS attempts
  const detectXSS = (input) => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /on\w+\s*=/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];
    return xssPatterns.some((pattern) => pattern.test(input));
  };

  // Fetch client IP address
  const getClientIp = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "unknown";
    } catch (error) {
      console.error("Error fetching IP:", error);
      return "unknown";
    }
  };

  // Monitor window events for XSS or suspicious input
  useEffect(() => {
    const handleInput = (e) => {
      const input = e.target.value;
      if (detectXSS(input)) {
        setAttackDetails(`Potensi XSS terdeteksi: ${input}`);
        setShowWarning(true);
        toast.error("Input berbahaya terdeteksi! Hentikan sekarang!");
      }
    };

    const handleCustomEvent = (e) => {
      if (e.detail?.type === "rate_limit_exceeded") {
        setAttackDetails(`Batas kecepatan terlampaui: ${e.detail.message}`);
        setShowWarning(true);
        toast.error("Terlalu cepat! Pertahanan kami aktif!");
      } else if (e.detail?.type === "invalid_file_upload") {
        setAttackDetails(`Unggahan file tidak valid: ${e.detail.message}`);
        setShowWarning(true);
        toast.error("File tidak valid terdeteksi! Akses ditolak!");
      }
    };

    document.addEventListener("input", handleInput);
    window.addEventListener("securityViolation", handleCustomEvent);

    // Fetch IP on mount
    getClientIp().then((ip) => setIpAddress(ip));

    return () => {
      document.removeEventListener("input", handleInput);
      window.removeEventListener("securityViolation", handleCustomEvent);
    };
  }, []);

  // Disable scrolling when popup is visible
  useEffect(() => {
    if (showWarning) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showWarning]);

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-500">
          <div className="relative bg-gradient-to-br from-blue-900 to-red-900/90 p-10 rounded-3xl border-4 border-red-600 shadow-2xl shadow-[0_0_20px_rgba(255,0,0,0.8),0_0_20px_rgba(0,0,255,0.8)] max-w-lg w-full text-center">
            {/* Flashing Police Siren Effect */}
            <style>
              {`
                @keyframes siren {
                  0% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 20px rgba(0, 0, 255, 0.8); }
                  50% { box-shadow: 0 0 30px rgba(255, 0, 0, 1), 0 0 30px rgba(0, 0, 255, 1); }
                  100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 20px rgba(0, 0, 255, 0.8); }
                }
                .animate-siren {
                  animation: siren 0.8s infinite;
                }
              `}
            </style>

            {/* Siren Icon */}
            <div className="text-7xl text-red-500 mb-6 animate-[pulse_0.5s_infinite]">🚨</div>

            {/* Threatening Police Message */}
            <h2 className="text-4xl font-extrabold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-blue-500 tracking-widest">
              POLISI CYBER MENANGKAPMU!
            </h2>
            <p className="text-white/90 text-lg mb-4 font-mono">
              KAMI TAHU KAMU DI IP: <span className="text-red-400 font-bold">{ipAddress}</span>.
              HENTIKAN SERANGANMU SEKARANG ATAU KAMU AKAN DITAHAN!
            </p>
            <p className="text-red-300 text-sm italic mb-6">
              {attackDetails || "Serangan XSS atau defacement terdeteksi. Kami mengawasimu!"}
            </p>

            {/* Refresh Prompt */}
            <p className="text-white text-lg font-bold mb-6 animate-pulse">
              SEGARKAN HALAMAN ATAU KAMU DALAM BAHAYA!
            </p>

            {/* Mandatory Refresh Button */}
            <button
              onClick={() => {
                setShowWarning(false);
                document.body.style.overflow = "auto";
                window.location.reload();
              }}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-full hover:bg-gradient-to-r hover:from-red-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(255,0,0,0.7)] font-bold tracking-wide"
            >
              TAATI PERINTAH!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SecurityMonitor;