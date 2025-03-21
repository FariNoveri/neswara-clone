import React from "react";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8">
      <div className="container mx-auto px-6 md:px-16 text-center">
        {/* Alamat Kantor */}
        <p className="text-sm font-medium text-white">Kantor Pusat NESWARA</p>
        <p className="text-xs mt-1">
          Jl. Endro Suratmin No.52d, Way Dadi, Kec. Sukarame, Kota Bandar Lampung, Lampung 35131.
        </p>

        {/* Sosial Media */}
        <div className="flex justify-center space-x-5 mt-4">
          <a href="#" className="hover:text-white">
            <FaLinkedin size={20} />
          </a>
          <a href="#" className="hover:text-white">
            <FaFacebook size={20} />
          </a>
          <a href="#" className="hover:text-white">
            <FaInstagram size={20} />
          </a>
          <a href="#" className="hover:text-white">
            <FaTwitter size={20} />
          </a>
          <a href="#" className="hover:text-white">
            <FaYoutube size={20} />
          </a>
        </div>

        {/* Hak Cipta & Kebijakan */}
        <div className="mt-4 text-xs">
          <p>🌍 English</p>
          <p className="mt-2 text-gray-500">Neswara © {new Date().getFullYear()}, All rights reserved.</p>
          <div className="mt-1 space-x-3">
            <a href="#" className="hover:text-white">Privacy Notice</a>
            <span>|</span>
            <a href="#" className="hover:text-white">Terms of Condition</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
