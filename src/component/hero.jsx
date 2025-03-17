import React from "react";

const Hero = () => {
  return (
    <section className="h-screen flex flex-col justify-center items-center text-center bg-gray-100">
      <h1 className="text-4xl font-bold">Selamat Datang di Neswara</h1>
      <p className="mt-4 text-lg text-gray-600">Solusi Keuangan Berbasis Digital</p>
      <button className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg">Get Started</button>
    </section>
  );
};

export default Hero;
