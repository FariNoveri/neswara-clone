import React from "react";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin } from "react-icons/fa";
import SocialIcon from "../atoms/SocialIcon";

const SocialMediaLinks = () => {
  return (
    <div className="flex justify-center space-x-5 mt-4">
      <SocialIcon link="#" icon={FaLinkedin} />
      <SocialIcon link="#" icon={FaFacebook} />
      <SocialIcon link="#" icon={FaInstagram} />
      <SocialIcon link="#" icon={FaTwitter} />
      <SocialIcon link="#" icon={FaYoutube} />
    </div>
  );
};

export default SocialMediaLinks;
