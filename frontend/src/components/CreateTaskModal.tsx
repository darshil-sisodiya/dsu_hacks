import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateTaskModalProps {
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  newDescription: string;
  setNewDescription: (desc: string) => void;
  onCreateTodo: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  showCreateForm,
  setShowCreateForm,
  newTitle,
  setNewTitle,
  newDescription,
  setNewDescription,
  onCreateTodo,
}) => (
  <AnimatePresence>
    {showCreateForm && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowCreateForm(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800">Create New Task</h3>
            <p className="text-slate-500 text-sm mt-1">Add a new task to your workflow</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Task Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter task title..."
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-black placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add task description..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none text-black placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateTodo}
              disabled={!newTitle.trim()}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                newTitle.trim()
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Create Task
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default CreateTaskModal;
