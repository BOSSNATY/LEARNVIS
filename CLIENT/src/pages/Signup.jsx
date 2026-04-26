import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";

const Signup = ({ setUser }) => {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = () => {
    const pass = formData.password;
    if (pass.length === 0) return { level: 0, text: "", color: "" };
    if (pass.length < 6) return { level: 1, text: "Weak", color: "red" };
    if (pass.length < 10 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass))
      return { level: 2, text: "Medium", color: "yellow" };
    return { level: 3, text: "Strong", color: "green" };
  };

  const strength = passwordStrength();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setUser({ role: "student", name: formData.name, email: formData.email });
      setIsLoading(false);
      navigate("/student/onboarding");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-[5%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[5%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>

      {/* Brand Header */}
      <div
        className="flex items-center gap-3 mb-8 relative z-10 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
          <div className="w-7 h-7 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Learnvis
        </h1>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-md bg-[#111827]/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-400 text-sm">
            Join thousands of learners today
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full bg-[#1f2937]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-[#1f2937]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Create a password"
              className="w-full bg-[#1f2937]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all pr-12"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-10 text-gray-400 hover:text-white"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {formData.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength.level === 1
                        ? "bg-red-500 w-1/3"
                        : strength.level === 2
                          ? "bg-yellow-500 w-2/3"
                          : "bg-green-500 w-full"
                    }`}
                  ></div>
                </div>
                <span className={`text-xs text-${strength.color}-400`}>
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              className="w-full bg-[#1f2937]/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">
                  Passwords do not match
                </p>
              )}
          </div>

          <div className="flex items-start gap-3 py-2">
            <input
              type="checkbox"
              className="mt-1 rounded border-gray-700 bg-gray-800 text-blue-600"
              required
            />
            <p className="text-xs text-gray-400">
              I agree to the{" "}
              <span className="text-blue-500 cursor-pointer">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-blue-500 cursor-pointer">
                Privacy Policy
              </span>
            </p>
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="w-full flex items-center gap-4 text-gray-500">
            <div className="h-[1px] bg-white/10 flex-grow"></div>
            <span className="text-xs">or continue with</span>
            <div className="h-[1px] bg-white/10 flex-grow"></div>
          </div>

          <div className="flex gap-4 w-full">
            <button className="flex-1 bg-[#1f2937] py-2.5 rounded-xl border border-white/5 flex items-center justify-center gap-2 hover:bg-gray-700 transition-all">
              <img
                src="https://www.google.com/favicon.ico"
                className="w-4 h-4"
                alt="G"
              />
              <span className="text-sm font-medium text-white">Google</span>
            </button>
            <button className="flex-1 bg-[#1f2937] py-2.5 rounded-xl border border-white/5 flex items-center justify-center gap-2 hover:bg-gray-700 transition-all">
              <img
                src="https://www.microsoft.com/favicon.ico"
                className="w-4 h-4"
                alt="M"
              />
              <span className="text-sm font-medium text-white">Microsoft</span>
            </button>
          </div>

          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-500 cursor-pointer font-semibold"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
