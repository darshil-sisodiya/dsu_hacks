"use client";

import { motion, AnimatePresence } from "framer-motion";
import { poppins } from "@/fonts";
import { useEffect, useState } from "react";

const chaosWords = [
  "Context",
  "Tasks",
  "Files",
  "Slack",
  "Meetings",
  "Docs",
  "Focus",
  "Summaries",
  "Notes",
  "Workflow",
];

export default function GoalSection() {
  const [settle, setSettle] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSettle(true), 6000); // Chaos lasts 6s
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
      {/* CHAOS PHASE */}
      {!settle &&
        chaosWords.map((word, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth - window.innerWidth / 2,
              y: Math.random() * window.innerHeight - window.innerHeight / 2,
              opacity: 0,
              scale: 0.6,
            }}
            animate={{
              x: Math.random() * window.innerWidth - window.innerWidth / 2,
              y: Math.random() * window.innerHeight - window.innerHeight / 2,
              opacity: 0.3,
              scale: 1,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
            className={`absolute text-gray-700 text-4xl font-semibold select-none ${poppins.className}`}
          >
            {word}
          </motion.div>
        ))}

      {/* SETTLED PHASE */}
      <AnimatePresence>
        {settle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center px-6"
          >
            {/* App Name */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className={`text-6xl md:text-7xl font-bold text-gray-900 ${poppins.className}`}
            >
              Context<span className="text-blue-600">Flow</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed"
            >
              ContextFlow is designed to fetch your previous task context, summarize files and conversations, and prepare your workspace automatically—so you can focus on what matters.
            </motion.p>

            {/* Subtle Glow Accent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="mt-10 w-40 h-1 bg-gradient-to-r from-indigo-500 to-blue-400 mx-auto rounded-full shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
