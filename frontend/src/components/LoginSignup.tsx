"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaUserAlt, FaLock, FaEnvelope } from "react-icons/fa";
import { poppins } from "../fonts"; 

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className={`${poppins.className} flex min-h-screen bg-white`}>

      {/* Left Side - Branding */}
      <div className="w-1/2 flex items-center justify-center border-r ">
        <h1 className="text-6xl font-extrabold text-gray-800 tracking-tight">
          Context Flow
        </h1>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-1/2 flex items-center justify-center bg-white ">
        <motion.div
          key={isLogin ? "login" : "signup"}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full max-w-md bg-white rounded-2xl shadow-lg border  p-10"
        >
          {/* Header */}
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            {isLogin ? "Login to your account" : "Create your account"}
          </h2>

          {/* Form */}
          <form className="space-y-5">
            {/* Signup → Username */}
            {!isLogin && (
              <div className="relative">
                <FaUserAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
            >
              {isLogin ? "Login" : "Sign Up"}
            </motion.button>
          </form>

          {/* Toggle Auth Mode */}
          <p className="mt-8 text-center text-gray-600 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-700 transition"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
