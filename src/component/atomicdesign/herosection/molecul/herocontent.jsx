import React from "react";
import Heading from "../atoms/Heading";
import Paragraph from "../atoms/Paragraph";
import Button from "../atoms/Button";

const HeroContent = () => {
  return (
    <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 md:px-16 text-white">
      <Heading level="h4">NESWARA: DI BALIK BERITA, ADA ANDA.</Heading>
      <Heading level="h1">
        <span role="img" aria-label="lightbulb">
          💡
        </span>{" "}
        BERGABUNGLAH SEKARANG!
      </Heading>
      <Paragraph>
        Tunjukkan bahwa Anda adalah pemberita masa depan yang siap menginspirasi dunia.
      </Paragraph>
      <Paragraph>Jadilah Pemberita Handal Bersama Neswara!</Paragraph>

      {/* Buttons */}
      <div className="mt-6 flex space-x-4">
        <Button text="SIGN UP NOW" type="primary" />
        <Button text="MORE DETAILS →" type="secondary" />
      </div>
    </div>
  );
};

export default HeroContent;
