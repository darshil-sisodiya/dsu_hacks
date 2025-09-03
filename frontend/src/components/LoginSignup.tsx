"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserAlt, FaLock, FaEnvelope } from "react-icons/fa";
import { poppins } from "../fonts";
import { signup as apiSignup, login as apiLogin } from "../lib/api";
import { useRouter } from "next/navigation";

export default function LoginSignup() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (isLogin) {
        const res = await apiLogin({ email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        router.push("/tasks");
      } else {
        const res = await apiSignup({ name, email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.user));
        router.push("/tasks");
      }
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${poppins.className} min-h-screen flex bg-gray-100`}>
      {/* Left Section */}
      {/* Left Section */}
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.8 }}
  className="relative w-1/2 flex flex-col justify-center items-center text-white p-10 overflow-hidden"
>
  {/* Background Video */}
  <video
    className="absolute inset-0 w-full h-full object-cover"
    autoPlay
    loop
    muted
    playsInline
  >
    <source src="/bg.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>

  {/* Overlay */}
  <div className="absolute inset-0 bg-black/40"></div>

  {/* Content */}
  <div className="relative z-10 text-center">
    <h1 className="text-5xl font-bold mb-4">ContextFlow</h1>
    <p className="text-lg text-gray-200 mb-6">
      Your productivity companion. Pick up right where you left off!
    </p>
  </div>
</motion.div>


      {/* Right Section */}
      <div className="w-1/2 flex justify-center items-center p-10">
        <div
          className="relative w-full max-w-md"
          style={{ perspective: "1000px" }} // Enables 3D flip
        >
          <AnimatePresence mode="wait">
            <motion.div
  key={isLogin ? "login" : "signup"}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
  className="bg-white rounded-xl shadow-md p-8"
>


              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-center text-gray-500 mb-8">
                {isLogin
                  ? "Log in to continue your work."
                  : "Sign up to start managing your tasks."}
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="relative">
                    <FaUserAlt className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                )}

                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition disabled:opacity-60"
                >
                  {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
                </motion.button>
              </form>

              {message && (
                <p className="mt-4 text-center text-sm text-red-500">
                  {message}
                </p>
              )}

              <div className="mt-6 text-center text-sm text-gray-600">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-bold text-blue-600 hover:underline"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
