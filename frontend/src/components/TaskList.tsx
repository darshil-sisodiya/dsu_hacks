import React from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { FaCheck, FaTrash } from "react-icons/fa";
import { Todo } from "../lib/todos";

interface TaskListProps {
  todos: Todo[];
  filteredTodos: Todo[];
  selectedId: string | null;
  activeTaskId: string | null;
  onToggleComplete: (todo: Todo) => void;
  onDeleteTodo: (id: string) => void;
  onTaskSelect: (id: string) => void;
  slideVariants: Variants;
}

const TaskList: React.FC<TaskListProps> = ({
  todos,
  filteredTodos,
  selectedId,
  activeTaskId,
  onToggleComplete,
  onDeleteTodo,
  onTaskSelect,
  slideVariants,
}) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 shadow-2xl shadow-slate-900/10 overflow-hidden h-[calc(100vh-160px)]">
    <div className="p-5 border-b border-slate-200/70">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Tasks</h2>
        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">
          {filteredTodos.length}
        </span>
      </div>
    </div>
    <div className="h-[calc(100%-80px)] overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {filteredTodos.map((todo, index) => (
          <motion.div
            key={todo._id}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              onTaskSelect(todo._id);
            }}
            className={`p-4 border-b border-slate-200/30 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
              selectedId === todo._id ? "bg-blue-50 border-l-4 border-l-blue-500 text-slate-900" : "text-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onToggleComplete(todo);
                }}
                className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  todo.status === "completed"
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-slate-300 hover:border-green-400"
                }`}
              >
                {todo.status === "completed" && <FaCheck className="text-xs" />}
              </button>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${
                  todo.status === "completed"
                    ? "line-through" + (selectedId === todo._id ? " text-slate-500" : " text-slate-400")
                    : "text-slate-900"
                }`}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className={`text-sm mt-1 line-clamp-2 ${selectedId === todo._id ? "text-slate-600" : "text-slate-600"}`}>{todo.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {activeTaskId === todo._id && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Active
                    </span>
                  )}
                  <span className={`text-xs ${selectedId === todo._id ? "text-slate-500" : "text-slate-500"}`}>
                    {todo.createdAt ? new Date(todo.createdAt).toLocaleDateString() : "No date"}
                  </span>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteTodo(todo._id);
                }}
                className={`transition-colors p-1 ${selectedId === todo._id ? "text-slate-500 hover:text-red-500" : "text-slate-400 hover:text-red-500"}`}
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  </div>
);

export default TaskList;
