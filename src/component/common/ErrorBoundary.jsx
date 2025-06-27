
     import React, { Component } from "react";

     class ErrorBoundary extends Component {
       state = { hasError: false, error: null };

       static getDerivedStateFromError(error) {
         return { hasError: true, error };
       }

       componentDidCatch(error, errorInfo) {
         console.error("Error caught in ErrorBoundary:", error, errorInfo);
       }

       render() {
         if (this.state.hasError) {
           return (
             <div className="container mx-auto px-4 py-8 text-center">
               <h2 className="text-2xl font-bold text-red-600">Terjadi Kesalahan</h2>
               <p className="text-gray-600 mt-2">
                 Maaf, ada masalah dengan halaman ini. Silakan coba lagi nanti.
               </p>
               <button
                 onClick={() => window.location.reload()}
                 className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
               >
                 Muat Ulang
               </button>
             </div>
           );
         }
         return this.props.children;
       }
     }

     export default ErrorBoundary;
