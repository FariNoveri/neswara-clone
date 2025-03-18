import React from "react";

const HeroSection = () => {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://neswara.id/assets/frontend/images/avatars/journalist.jpg" // Sesuaikan dengan path gambar Anda
          alt="News Reporter"
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 md:px-16 text-white">
        <h4 className="text-sm md:text-lg font-semibold uppercase">
          NESWARA: DI BALIK BERITA, ADA ANDA.
        </h4>
        <h1 className="text-2xl md:text-4xl font-bold mt-2">
          <span role="img" aria-label="lightbulb">
            💡
          </span>{" "}
          BERGABUNGLAH SEKARANG!
        </h1>
        <p className="mt-3 text-sm md:text-base max-w-lg">
          Tunjukkan bahwa Anda adalah pemberita masa depan yang siap menginspirasi dunia.
        </p>
        <p className="text-sm md:text-base mt-2">
          Jadilah Pemberita Handal Bersama Neswara!
        </p>

        {/* Buttons */}
        <div className="mt-6 flex space-x-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold">
            SIGN UP NOW
          </button>
          <button className="border border-white text-white px-6 py-2 rounded-lg font-semibold">
            MORE DETAILS →
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
