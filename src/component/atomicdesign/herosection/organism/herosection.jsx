import React from "react";
import HeroContent from "../molecules/HeroContent";

const HeroSection = () => {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://neswara.id/assets/frontend/images/avatars/journalist.jpg"
          alt="News Reporter"
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Hero Content */}
      <HeroContent />
    </section>
  );
};

export default HeroSection;
