import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import Header from "../components/Header";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-[20%] left-[-10%] w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]"></div>

      <Header variant="auth" />

      {/* Card */}
      <div className="w-full max-w-md bg-[#111827]/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[2rem] shadow-2xl relative z-10">
        {!isSubmitted ? (
          <>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back to login</span>
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-400 text-sm">
                No worries! Enter your email and we'll send you reset
                instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-[#1f2937]/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-gray-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              We've sent a password reset link to
              <br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Back to Login
            </button>
            <p className="text-gray-500 text-xs mt-6">
              Didn't receive the email?{" "}
              <span
                className="text-blue-500 cursor-pointer hover:underline"
                onClick={() => setIsSubmitted(false)}
              >
                Click to resend
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
