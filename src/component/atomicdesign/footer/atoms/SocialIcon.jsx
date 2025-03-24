import React from "react";

const SocialIcon = ({ icon: Icon, link }) => {
  return (
    <a href={link} className="hover:text-white">
      <Icon size={20} />
    </a>
  );
};

export default SocialIcon;
