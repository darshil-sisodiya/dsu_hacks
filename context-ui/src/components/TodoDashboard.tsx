"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTasks, FaFileAlt, FaRegStickyNote } from "react-icons/fa";

// Types
type Task = {
  id: number;
  title: string;
};

type FileMap = {
  [key: number]: string[];
};

type SummaryMap = {
  [key: number]: string;
};

export default function TodoDashboard() {
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  // Mock Data
  const tasks: Task[] = [
    { id: 1, title: "Prepare Hackathon MVP" },
    { id: 2, title: "Fix Electron Integration" },
    { id: 3, title: "Design Corporate UI" },
  ];

  const files: FileMap = {
    1: ["mvp_plan.pdf", "wireframes.png", "notes.txt"],
    2: ["electron.js", "preload.js", "readme.md"],
    3: ["style-guide.pdf", "colors.sketch", "fonts.zip"],
  };

  const summaries: SummaryMap = {
    1: "Build and showcase the MVP with authentication and file management.",
    2: "Resolve integration issues between Next.js and Electron.",
    3: "Implement modern corporate design system with warm tones.",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">
          ContextFlow
        </h1>
      </header>

      {/* Content Grid */}
      <main className="flex flex-1">
        {/* Left - Tasks */}
        <div className="w-1/3 border-r border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
            <FaTasks className="text-amber-600" /> Tasks
          </h2>
          <ul className="space-y-3">
            {tasks.map((task: Task) => (
              <li
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className={`cursor-pointer px-4 py-2 rounded-lg transition ${
                  selectedTask === task.id
                    ? "bg-amber-100 text-amber-700 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                {task.title}
              </li>
            ))}
          </ul>
        </div>

        {/* Middle - Files */}
        <div className="w-1/3 border-r border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
            <FaFileAlt className="text-amber-600" /> Files
          </h2>
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.ul
                key={selectedTask}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
              >
                {files[selectedTask]?.map((file: string, idx: number) => (
                  <li
                    key={idx}
                    className="px-4 py-2 bg-gray-50 border rounded-lg hover:bg-amber-50 transition"
                  >
                    {file}
                  </li>
                ))}
              </motion.ul>
            ) : (
              <motion.p
                key="nofiles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-400"
              >
                Select a task to view files
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right - Summary */}
        <div className="w-1/3 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
            <FaRegStickyNote className="text-amber-600" /> Summary
          </h2>
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.div
                key={selectedTask}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-gray-50 p-4 rounded-lg border text-gray-700"
              >
                {summaries[selectedTask]}
              </motion.div>
            ) : (
              <motion.p
                key="nosummary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-400"
              >
                Select a task to view summary
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
