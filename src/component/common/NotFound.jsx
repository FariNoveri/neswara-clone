import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-8 text-center">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-lg mb-6">Halaman tidak ditemukan</p>
      <Link to="/" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
        Kembali ke Beranda
      </Link>
    </div>
  );
};

export default NotFound;
