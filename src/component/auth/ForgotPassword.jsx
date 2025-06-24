import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = ({ onSwitchForm }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const auth = getAuth();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent to your email.");
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (err.code === "auth/user-not-found") {
        setError("Email not registered.");
      } else {
        setError(err.message || "Failed to send reset link.");
      }
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-600 border-b border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500 border-b border-green-600 text-green-600 px-4 py-2 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}
      <form onSubmit={handleForgotPassword}>
        <div className="space-y-2">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 text-sm border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded-full py-2 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-500"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
          <div className="text-center py-2 text-sm">
            <p className="text-gray-500">
              Back to{" "}
              <button
                type="button"
                className="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => onSwitchForm("login")}
                >
                  Login
                </button>
              </p>
            </div>
          </>
        );
      }

      export default ForgotPassword;


