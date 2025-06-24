import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";

const AuthModal = ({ formMode, setFormMode, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleSwitchForm = (mode) => {
    setIsSwitching(true);
    setTimeout(() => {
      setFormMode(mode);
      setIsSwitching(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={handleClose}>
      <div
        className={`bg-white w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl modal-content ${
          isClosing ? "closing" : isSwitching ? "switching" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserCircle className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formMode === "login" ? "Masuk Akun" : formMode === "register" ? "Daftar Akun" : "Reset Password"}
          </h2>
          <p className="text-gray-600 mt-2">
            {formMode === "login" ? "Masuk untuk mengakses fitur lengkap" : 
              formMode === "register" ? "Buat akun baru untuk bergabung" : 
              "Kami akan mengirim link reset ke email Anda"}
          </p>
        </div>
        {formMode === "login" && <Login onSwitchForm={handleSwitchForm} onClose={onClose} />}
        {formMode === "register" && <Register onSwitchForm={handleSwitchForm} onClose={onClose} />}
        {formMode === "forgot" && <ForgotPassword onSwitchForm={handleSwitchForm} onClose={onClose} />}
      </div>
    </div>
  );
};

export default AuthModal;