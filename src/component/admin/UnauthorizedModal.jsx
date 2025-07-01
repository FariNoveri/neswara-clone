import { AlertTriangle, LogOut, Shield, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

const UnauthorizedModal = ({ show, onClose, userEmail, logActivity }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      // Log unauthorized access attempt when modal is shown
      logActivity?.('UNAUTHORIZED_ACCESS', { 
        userEmail: userEmail || 'Unknown', 
        action: 'attempted_admin_access' 
      });
    }
  }, [show, userEmail, logActivity]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!show && !isAnimating) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      show && !isClosing ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
    }`}>
      <div className={`relative w-full max-w-lg transform transition-all duration-500 ease-out ${
        show && !isClosing 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-95 opacity-0 translate-y-8'
      }`}>
        
        {/* Floating particles effect */}
        <div className="absolute -inset-4 opacity-30">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-red-400 rounded-full animate-pulse ${
                i % 2 === 0 ? 'animate-bounce' : ''
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Main modal */}
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-red-50 rounded-2xl shadow-2xl border border-red-100/50 overflow-hidden">
          
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-500 rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-400 rounded-full translate-x-12 translate-y-12 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Shield className="h-10 w-10 animate-pulse" />
                <div className="absolute -top-1 -right-1">
                  <Lock className="h-5 w-5 text-red-200 animate-bounce" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide">Akses Ditolak</h2>
                <p className="text-red-100 text-sm opacity-90">Zona Terbatas</p>
              </div>
            </div>
            
            {/* Animated warning indicator */}
            <div className="absolute top-2 right-2">
              <AlertTriangle className="h-6 w-6 text-yellow-300 animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 space-y-6">
            
            {/* Main message */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full animate-pulse">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              
              <div>
                <p className="text-gray-800 font-medium text-lg">
                  Maaf, Anda tidak memiliki akses
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Halaman ini khusus untuk administrator
                </p>
              </div>
            </div>

            {/* User info card */}
            <div className="bg-gradient-to-r from-gray-50 to-red-50 rounded-xl p-4 border border-red-100/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Email Anda
                  </p>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {userEmail || 'Tidak diketahui'}
                  </p>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  Percobaan akses ini telah dicatat untuk keamanan sistem
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleClose}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-300/50 transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <LogOut className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                <span>Keluar</span>
                
                {/* Button glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedModal;