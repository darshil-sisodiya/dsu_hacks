"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTasks, FaFileAlt, FaRegStickyNote, FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import { listTodos, createTodo, updateTodo, deleteTodo, type Todo, trackFile, getResume } from "../lib/todos";

declare global {
  interface Window {
    taskAPI?: {
      start: (taskId: string) => Promise<any>;
      end: (taskId: string) => Promise<any>;
      openFile: (taskId: string, filePath: string) => Promise<any>;
      resumeOpen: (taskId: string, files: Array<{ path: string } | string>) => Promise<any>;
      pickFiles: () => Promise<{ paths: string[] } | null>;
    };
  }
}

export default function TodoDashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<Array<{ path: string; lastOpened?: string }>>([]);

  const selected = useMemo(() => todos.find(t => t._id === selectedId) || null, [todos, selectedId]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listTodos();
      setTodos(data);
      if (selectedId) await loadRecent(selectedId);
    } catch (e: any) {
      setError(e?.message || "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }

  async function loadRecent(taskId: string) {
    try {
      const r = await getResume(taskId);
      setRecentFiles(r.files || []);
    } catch (e) {
      setRecentFiles([]);
    }
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (selectedId) loadRecent(selectedId); }, [selectedId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const created = await createTodo({ title: newTitle, description: newDescription });
      setTodos(prev => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
    } catch (e: any) {
      setError(e?.message || "Failed to create");
    }
  }

  async function onToggleComplete(todo: Todo) {
    try {
      const updated = await updateTodo(todo._id, { status: todo.status === 'completed' ? 'pending' : 'completed' });
      setTodos(prev => prev.map(t => t._id === todo._id ? updated : t));
    } catch (e: any) {
      setError(e?.message || "Failed to update");
    }
  }

  async function onDelete(todo: Todo) {
    try {
      await deleteTodo(todo._id);
      setTodos(prev => prev.filter(t => t._id !== todo._id));
      if (selectedId === todo._id) setSelectedId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    }
  }

  async function onStartTask(taskId: string) {
    setActiveTaskId(taskId);
    if (window.taskAPI) await window.taskAPI.start(taskId);
  }

  async function onEndTask(taskId: string) {
    if (window.taskAPI) await window.taskAPI.end(taskId);
    setActiveTaskId(null);
  }

  async function onPickAndOpenFile(taskId: string) {
    // Prefer Electron's native picker for absolute paths
    if (window.taskAPI?.pickFiles) {
      const res = await window.taskAPI.pickFiles();
      const paths: string[] = (res && res.paths) || [];
      for (const p of paths) {
        if (p) {
          if (window.taskAPI) await window.taskAPI.openFile(taskId, p);
          try { await trackFile(taskId, p); } catch {}
          await new Promise(r => setTimeout(r, 200));
        }
      }
      await loadRecent(taskId);
      return;
    }

    // Fallback to browser input (may lack absolute path)
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      for (const f of files) {
        const filepath = (f as any).path || f.name;
        if (window.taskAPI && filepath) {
          await window.taskAPI.openFile(taskId, filepath);
          try { await trackFile(taskId, filepath); } catch {}
          await new Promise(r => setTimeout(r, 200));
        }
      }
      await loadRecent(taskId);
    };
    input.click();
  }

  async function onResume(taskId: string) {
    try {
      const r = await getResume(taskId);
      setRecentFiles(r.files || []);
      if (window.taskAPI) await window.taskAPI.resumeOpen(taskId, r.files || []);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
        <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
        <form onSubmit={onCreate} className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task title"
            className="px-3 py-2 rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            className="px-3 py-2 rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800">
            <FaPlus /> Add
          </button>
        </form>
      </header>

      {error && (
        <div className="px-6 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* Content Grid */}
      <main className="flex flex-1">
        {/* Left - Tasks */}
        <div className="w-1/3 border-r border-zinc-200 p-6 bg-white">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-600 mb-3">
            <FaTasks /> Tasks
          </h2>
          {loading ? (
            <p className="text-zinc-400">Loading...</p>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li
                  key={todo._id}
                  onClick={() => setSelectedId(todo._id)}
                  className={`cursor-pointer px-4 py-3 rounded-lg border transition flex items-center justify-between ${
                    selectedId === todo._id ? "bg-zinc-100 border-zinc-300" : "hover:bg-zinc-50 border-zinc-200"
                  }`}
                >
                  <span className="truncate mr-3">{todo.title}</span>
                  <div className="flex items-center gap-2">
                    {activeTaskId === todo._id ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEndTask(todo._id); }}
                        className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-100"
                      >
                        End Task
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartTask(todo._id); }}
                        className="px-3 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800"
                      >
                        Start Task
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleComplete(todo); }}
                      title="Toggle complete"
                      className={`p-2 rounded-md border ${todo.status === 'completed' ? 'bg-green-100 border-green-300 text-green-700' : 'hover:bg-zinc-100 border-zinc-300'}`}
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(todo); }}
                      title="Delete"
                      className="p-2 rounded-md border hover:bg-red-50 text-red-600 border-red-200"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Middle - Details */}
        <div className="w-1/3 border-r border-zinc-200 p-6 bg-white">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-600 mb-3">
            <FaFileAlt /> Details
          </h2>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                  <div className="text-xs text-zinc-500">Title</div>
                  <div className="font-medium">{selected.title}</div>
                </div>
                {selected.description && (
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="text-xs text-zinc-500">Description</div>
                    <div className="font-medium">{selected.description}</div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {activeTaskId === selected._id ? (
                    <button onClick={() => onPickAndOpenFile(selected._id)} className="px-3 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800">Open & Track File</button>
                  ) : (
                    <button onClick={() => onResume(selected._id)} className="px-3 py-2 rounded-md border border-zinc-300 hover:bg-zinc-100">Resume (open recent)</button>
                  )}
                </div>

                {/* Recent Files */}
                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                  <div className="text-xs text-zinc-500 mb-2">Recent Files</div>
                  {recentFiles.length === 0 ? (
                    <div className="text-zinc-400 text-sm">No files tracked yet.</div>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {recentFiles.map((f, idx) => (
                        <li key={idx} className="truncate">{f.path}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.p key="nodetail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-zinc-400">Select a task</motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right - Summary */}
        <div className="w-1/3 p-6 bg-white">
          <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-600 mb-3">
            <FaRegStickyNote /> Summary
          </h2>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-zinc-700">
                Created {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}
              </motion.div>
            ) : (
              <motion.p key="nosummary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-zinc-400">Select a task to view summary</motion.p>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
