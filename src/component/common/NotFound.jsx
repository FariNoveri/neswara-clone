import React, { useState, useEffect } from "react";

const NotFound = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const floatingElements = [...Array(8)].map((_, i) => (
    <div
      key={i}
      className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-60"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${3 + Math.random() * 4}s`,
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      {/* Dynamic background with mouse interaction */}
      <div 
        className="absolute inset-0 opacity-20 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Animated floating elements */}
      <div className="absolute inset-0">
        {floatingElements}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          
          {/* Glitch effect 404 */}
          <div className="relative mb-12">
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 relative">
              404
            </h1>
            
            {/* Glitch layers */}
            <h1 className="absolute inset-0 text-8xl md:text-9xl font-black text-red-400 opacity-70 animate-pulse" style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
              transform: 'translateX(-2px)'
            }}>
              404
            </h1>
            <h1 className="absolute inset-0 text-8xl md:text-9xl font-black text-cyan-400 opacity-70 animate-pulse" style={{
              clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)',
              transform: 'translateX(2px)',
              animationDelay: '0.1s'
            }}>
              404
            </h1>
          </div>

          {/* Modern card container */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md mx-auto">
            
            {/* Animated icon */}
            <div className="mb-6 relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="absolute inset-0 w-20 h-20 mx-auto bg-blue-400 rounded-2xl animate-ping opacity-20"></div>
            </div>

            {/* Content */}
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Halaman Menghilang
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Sepertinya halaman yang Anda cari telah melakukan perjalanan ke dimensi paralel. Mari kita bawa Anda kembali ke realitas!
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              <a 
                href="/" 
                className="group relative w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="w-5 h-5 mr-2 relative z-10 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="relative z-10">Kembali ke Beranda</span>
              </a>

              <button 
                onClick={() => window.history.back()}
                className="group w-full inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-medium rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Halaman Sebelumnya
              </button>
            </div>
          </div>

          {/* Animated dots */}
          <div className="mt-12 flex justify-center space-x-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce opacity-70"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(180deg); 
          }
        }
        
        .absolute:nth-child(odd) {
          animation: float linear infinite;
        }
        
        .absolute:nth-child(even) {
          animation: float linear infinite reverse;
        }
        
        @keyframes glitch {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;