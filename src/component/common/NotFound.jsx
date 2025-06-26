import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800 p-8 text-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-green-200 rounded-full opacity-30 animate-bounce delay-500"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-purple-200 rounded-full opacity-25 animate-bounce delay-700"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-md">
        {/* Animated 404 number */}
        <div className="relative mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-8xl md:text-9xl font-bold text-blue-200 animate-ping opacity-20">
            404
          </div>
        </div>

        {/* Animated icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <svg 
                className="w-12 h-12 text-white animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-blue-400 rounded-full animate-ping opacity-25"></div>
          </div>
        </div>

        {/* Animated text */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 animate-fade-in-up">
            Oops! Halaman Tidak Ditemukan
          </h2>
          <p className="text-lg text-gray-600 animate-fade-in-up delay-200">
            Sepertinya halaman yang Anda cari sedang bersembunyi di dimensi lain
          </p>
          <p className="text-sm text-gray-500 animate-fade-in-up delay-400">
            Jangan khawatir, mari kita bawa Anda kembali ke tempat yang aman
          </p>
        </div>

        {/* Animated button */}
        <div className="animate-fade-in-up delay-600">
          <Link 
            to="/" 
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out"
          >
            <svg 
              className="w-5 h-5 mr-2 group-hover:animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            Kembali ke Beranda
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Loading dots animation */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;