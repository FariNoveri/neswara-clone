import React from "react";
import FooterText from "../atoms/FooterText";

const FooterInfo = () => {
  return (
    <div className="mt-4 text-center">
      <FooterText className="font-medium text-white">Kantor Pusat NESWARA</FooterText>
      <FooterText className="mt-1">Jl. Endro Suratmin No.52d, Way Dadi, Kec. Sukarame, Kota Bandar Lampung, Lampung 35131.</FooterText>
      <FooterText className="mt-4">🌍 English</FooterText>
      <FooterText className="mt-2 text-gray-500">Neswara © {new Date().getFullYear()}, All rights reserved.</FooterText>
      <div className="mt-1 space-x-3">
        <a href="#" className="hover:text-white text-xs">Privacy Notice</a>
        <span>|</span>
        <a href="#" className="hover:text-white text-xs">Terms of Condition</a>
      </div>
    </div>
  );
};

export default FooterInfo;
