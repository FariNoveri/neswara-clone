import React, { useState, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getAuth, createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from "firebase/auth";
import ReCAPTCHA from "react-google-recaptcha";
import { sendVerificationEmail } from "../config/emailService";

const Register = ({ onSwitchForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isVerificationPopupOpen, setIsVerificationPopupOpen] = useState(false);

  const auth = getAuth();
  const recaptchaRef = useRef(null);

  const verifyRecaptcha = async (token, action) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("http://localhost:3001/verify-recaptcha", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, action }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          setError(data.message || 'reCAPTCHA verification failed');
          return false;
        }
        return true;
      } catch (error) {
        console.error('reCAPTCHA verification failed:', error);
        if (error.name === 'AbortError') {
          setError('reCAPTCHA verification timed out. Please try again.');
        } else {
          setError(error.message || 'Failed to verify reCAPTCHA.');
        }
        return false;
      }
    };

    const handleRegister = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      if (!recaptchaToken) {
        setError("Please complete the reCAPTCHA.");
        setLoading(false);
        return;
      }

      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, "register");
      if (!isRecaptchaValid) {
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendVerificationEmail(user);
        setSuccess("Registration successful! Please verify your email.");
        setIsVerificationPopupOpen(true);
        await signOut(auth);
        onSwitchForm("login");
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            if (signInMethods.length > 0) {
              setError("Email already exists. Please login or reset password.");
              onSwitchForm("login");
            } else {
              setError("Email registered but not verified. Please check your email.");
              setIsVerificationPopupOpen(true);
            }
          } catch (fetchErr) {
            setError("Email already registered. Please login or reset password.");
          }
        } else if (err.code === "auth/invalid-email") {
          setError("Invalid email format.");
        } else if (err.code === "auth/weak-password") {
          setError("Password too weak. Use at least 6 characters.");
        } else {
          setError(err.message || "Registration failed.");
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
      <form onSubmit={handleRegister}>
        <div className="space-y-2">
          <div>
            <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-2 text-sm border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      className="w-full px-4 py-2 text-sm border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      />
                    </div>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey="6LdUQGorAAAAAOuQQwPAYnGtJrDmewRwGJbh1gJK"
                      onChange={(token) => setRecaptchaToken(token)}
                      onErrored={() => setError("Failed to load reCAPTCHA. Please check your connection.")}
                      onExpired={() => {
                        setRecaptchaToken(null);
                        setError("reCAPTCHA expired. Please try again.");
                      }}
                      />
                    <button
                      type="submit"
                      disabled={loading || !recaptchaToken}
                    className="mt-2 w-full bg-blue-600 text-white rounded-full py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600"
                      >
                        {loading ? "Submitting..." : "Register"}
                      </button>
                    </div>
                  </form>
                  <div className="text-center py-2 text-sm">
                    <p className="text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-blue-500 hover:underline focus:outline-none"
                        onClick={() => onSwitchForm("login")}
                        >
                          Login here
                        </button>
                      </p>
                    </div>
                    {isVerificationPopupOpen && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white w-full max-w-md mx-4 p-6 rounded-lg shadow-lg">
                          <h2 className="text-lg font-medium">Email Verification Required</h2>
                          <p className="text-gray-600 mt-2">
                            Please check your email to verify your account.
                          </p>
                          <button
                            onClick={() => setIsVerificationPopupOpen(false)}
                            className="w-full bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                    )}
                  </>
                );
              };

              export default Register;