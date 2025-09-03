"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
        }
        setMessage(`Logged in as ${res.user.name} (${res.user.email})`);
        router.push('/tasks');
      } else {
        const res = await apiSignup({ name, email, password });
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
        }
        setMessage(`Registered ${res.user.name} (${res.user.email})`);
        router.push('/tasks');
      }
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${poppins.className} min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-sm p-8"
      >
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight">ContextFlow</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isLogin ? "Welcome back. Please sign in." : "Create an account to continue."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="relative">
              <FaUserAlt className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none"
              />
            </div>
          )}

          <div className="relative">
            <FaEnvelope className="absolute left-3 top-3.5 text-zinc-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none"
            />
          </div>

          <div className="relative">
            <FaLock className="absolute left-3 top-3.5 text-zinc-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition disabled:opacity-60"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </motion.button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-zinc-600">{message}</p>
        )}

        <div className="mt-8 text-center text-sm text-zinc-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-zinc-900 hover:opacity-80 transition"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
