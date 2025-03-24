import React from "react";
import Button from "./Button";
import Icon from "./Icon";
import Logo from "./Logo";
import NavLink from "./NavLink";
import { FaHome } from "react-icons/fa";

const Atoms = () => {
  console.log("✅ Atoms component loaded!");

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Atoms Page</h1>

      <div className="space-y-4">
        <Button className="bg-blue-500 text-white">Click Me</Button>

        <Icon IconComponent={FaHome} className="text-red-500" />

        <Logo />

        <ul>
          <NavLink label="Home" onClick={() => alert("Home Clicked")} />
        </ul>
      </div>
    </div>
  );
};

export default Atoms;
