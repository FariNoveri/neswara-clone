import React, { useState, useEffect } from "react";

const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <section 
      className="relative w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),transparent_50%)]"
          style={{
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
      </div>

      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://neswara.id/assets/frontend/images/avatars/journalist.jpg')`,
            transform: `scale(1.1) translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
      </div>

      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-40 w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-40 right-60 w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl">
          {/* Badge/Tag */}
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-200 text-sm font-medium tracking-wider uppercase">
              Breaking News Platform
            </span>
          </div>

          {/* Main Headline */}
          <div className={`transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h4 className="text-blue-300 text-lg md:text-xl font-medium mb-4 tracking-wide">
              NESWARA
            </h4>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              DI BALIK BERITA,
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                ADA ANDA
              </span>
            </h1>
          </div>

          {/* Description */}
          <div className={`transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <p className="text-xl md:text-2xl text-gray-300 font-light mb-4 max-w-2xl leading-relaxed">
              Bergabunglah dengan generasi pemberita masa depan
            </p>
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Tunjukkan kemampuan jurnalistik Anda dan inspirasi dunia dengan berita yang bermakna
            </p>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 mt-12 transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <button className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
              <span className="relative z-10 flex items-center gap-2">
                <span>Mulai Sekarang</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
            
            <button className="group relative bg-transparent border-2 border-gray-400 hover:border-white text-gray-300 hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <span>Pelajari Lebih Lanjut</span>
                <svg className="w-5 h-5 transition-transform group-hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </button>
          </div>

          {/* Stats or Features */}
          <div className={`flex flex-wrap gap-8 mt-16 transition-all duration-1000 delay-800 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg">Real-time</div>
                <div className="text-gray-400 text-sm">Berita Terkini</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg">Community</div>
                <div className="text-gray-400 text-sm">Jurnalis Profesional</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg">Verified</div>
                <div className="text-gray-400 text-sm">Berita Terpercaya</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm">Scroll untuk explore</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;