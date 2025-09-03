"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FaTasks, FaFileAlt, FaRegStickyNote, FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import { listTodos, createTodo, updateTodo, deleteTodo, type Todo, getResume } from "../lib/todos";
import { poppins } from "../fonts";


declare global {
  interface Window {
    taskAPI?: {
      start: (taskId: string, token: string) => Promise<any>;
      end: (taskId: string) => Promise<any>;
      resumeOpen: (taskId: string, files: Array<{ path: string } | string>) => Promise<any>;
      pickAndTrack: (taskId: string, token: string) => Promise<any>;
      onFileTracked: (callback: (event: any, data: { taskId: string; path: string }) => void) => void;
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
  const [newFileNotification, setNewFileNotification] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreData, setRestoreData] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [taskPosition, setTaskPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const selected = useMemo(() => todos.find(t => t._id === selectedId) || null, [todos, selectedId]);

  const panelVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeInOut" } }
  };

  const mainVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } }
  };

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
    } catch {
      setRecentFiles([]);
    }
  }

  useEffect(() => { 
    refresh(); 
    
    // Set up file tracking event listener once when component mounts
    if (window.taskAPI?.onFileTracked) {
      const handleFileTracked = (event: any, data: { taskId: string; path: string }) => {
        console.log('📁 File tracked event received:', data);
        
        // Show notification
        const fileName = data.path.split('\\').pop() || data.path;
        setNewFileNotification(`📁 Tracked: ${fileName}`);
        setTimeout(() => setNewFileNotification(null), 3000);
        
        // Always refresh recent files for the tracked task
        loadRecent(data.taskId);
        
        // Also update the recentFiles state immediately if it's the selected task
        if (selectedId === data.taskId) {
          console.log('🔄 Updating recent files for currently selected task');
          setRecentFiles(prev => {
            // Add the new file if it's not already in the list
            const exists = prev.some(f => f.path === data.path);
            if (!exists) {
              return [...prev, { path: data.path, lastOpened: new Date().toISOString() }];
            }
            return prev;
          });
        }
      };
      
      window.taskAPI.onFileTracked(handleFileTracked);
      console.log('✅ File tracking event listener set up');
    }
  }, [selectedId]); // Include selectedId as dependency
  
  useEffect(() => { if (selectedId) loadRecent(selectedId); }, [selectedId]);
  
  // Update recent files when active task changes
  useEffect(() => {
    if (activeTaskId) {
      loadRecent(activeTaskId);
    }
  }, [activeTaskId]);

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

    // Clear selection and active task if deleted
    if (selectedId === todo._id) setSelectedId(null);
    if (activeTaskId === todo._id) setActiveTaskId(null);
    if (taskPosition && selectedId === todo._id) setTaskPosition(null);

  } catch (e: any) {
    setError(e?.message || "Failed to delete");
  }
}


  // Inside your TodoDashboard component

const handleLogout = () => {
  localStorage.removeItem("auth_token"); // remove auth token
  window.location.href = "/";       // redirect to login page
};


  async function onStartTask(taskId: string) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No authentication token found. Please login again.');
      return;
    }
    
    if (window.taskAPI) {
      console.log('🎬 Starting task:', taskId);
      await window.taskAPI.start(taskId, token);
      setActiveTaskId(taskId);
      console.log('✅ Task started, activeTaskId set to:', taskId);
    }
  }

  async function onEndTask(taskId: string) {
    if (window.taskAPI) await window.taskAPI.end(taskId);
    setActiveTaskId(null);
  }

  async function onResume(taskId: string) {
    try {
      const r = await getResume(taskId);
      
      if (r.files && r.files.length > 0) {
        // Show the restore dialog
        setRestoreData({
  taskId,
  taskTitle: r.title || selected?.title || 'Unknown Task',
  files: r.files || [],
  lastSession: r.files?.length 
      ? r.files.reduce((latest, f) => {
          const fDate = f.lastOpened ? new Date(f.lastOpened) : new Date(0);
          return fDate > latest ? fDate : latest;
        }, new Date(0)).toISOString()
      : null,
  totalFiles: r.files?.length || 0
});

        // Initialize all files as selected by default
        setSelectedFiles(r.files?.map((f: any) => f.path) || []);
        setShowRestoreDialog(true);
      } else {
        setError('No files found for this task session.');
      }
      
      // Update recent files display
      setRecentFiles(r.files || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load session files.');
    }
  }

  async function onRestoreFiles(selectedFilePaths: string[]) {
    if (!restoreData || !window.taskAPI) return;
    
    try {
      console.log(`🔄 Restoring ${selectedFilePaths.length} files for task ${restoreData.taskId}`);
      
      // Open each selected file
      const filesToOpen = selectedFilePaths.map(path => ({ path }));
      await window.taskAPI.resumeOpen(restoreData.taskId, filesToOpen);
      
      console.log(`✅ Successfully opened ${selectedFilePaths.length} files`);
      
      // Close dialog after successful restore
      setShowRestoreDialog(false);
      setRestoreData(null);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error restoring files:', error);
      setError('Failed to open some files.');
    }
  }

  // File selection functions
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath) 
        ? prev.filter(path => path !== filePath)
        : [...prev, filePath]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === restoreData?.files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(restoreData?.files.map((f: any) => f.path) || []);
    }
  };

  const isAllSelected = selectedFiles.length === (restoreData?.files.length || 0);
  const isPartiallySelected = selectedFiles.length > 0 && selectedFiles.length < (restoreData?.files.length || 0);

  async function onTestFileTracking(taskId: string) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No authentication token found. Please login again.');
      return;
    }
    
    if (window.taskAPI) {
      console.log('🧪 Testing file tracking with manual picker');
      const result = await window.taskAPI.pickAndTrack(taskId, token);
      console.log('🧪 Test result:', result);
    }
  }

  const handleTaskClick = (e: React.MouseEvent<HTMLLIElement>, todo: Todo) => {
    const rect = (e.target as HTMLElement).closest("li")?.getBoundingClientRect();
    if (rect) setTaskPosition({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    setSelectedId(todo._id);
  };

  return (
    <div className={`${poppins.className} flex flex-col min-h-screen bg-gray-50 text-gray-900 relative`}>
      
      {/* Blur overlay */}
{activeTaskId && taskPosition && (
  <motion.div
    initial={{ clipPath: `circle(0px at ${taskPosition.x + taskPosition.width / 2}px ${taskPosition.y + taskPosition.height / 2}px)` }}
    animate={{ clipPath: `circle(200% at ${taskPosition.x + taskPosition.width / 2}px ${taskPosition.y + taskPosition.height / 2}px)` }}
    exit={{ clipPath: `circle(0px at ${taskPosition.x + taskPosition.width / 2}px ${taskPosition.y + taskPosition.height / 2}px)` }}
    transition={{ duration: 0.6, ease: "easeInOut" }}
    className="fixed inset-0 bg-white backdrop-blur-md z-10 pointer-events-none"
  />
)}


      <motion.header
  initial={{ y: -30, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  className="flex items-center justify-between px-6 py-4 bg-white shadow-md rounded-b-xl z-20 relative"
>
  <h1 className="text-2xl font-bold tracking-tight">Your Task Board</h1>

  <div className="flex gap-2 items-center">
    {/* Task creation form */}
    <form onSubmit={onCreate} className="flex gap-2">
      <input
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
        placeholder="Task title"
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
      />
      <input
        value={newDescription}
        onChange={e => setNewDescription(e.target.value)}
        placeholder="Description"
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
      />
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-semibold shadow-sm">
        <FaPlus /> Add
      </motion.button>
    </form>

    {/* Logout button */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 shadow-sm"
    >
      Logout
    </motion.button>
  </div>
</motion.header>


      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-2 text-sm text-red-600 z-20 relative">
          {error}
        </motion.div>
      )}
      
      {newFileNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="px-6 py-2 text-sm text-green-600 bg-green-50 border-l-4 border-green-400 z-20 relative"
        >
          {newFileNotification}
        </motion.div>
      )}

      <motion.main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 relative z-20 items-start" initial="hidden" animate="show" variants={mainVariants}>
        
        {/* Tasks */}
        <motion.div variants={panelVariants} className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all">
          <h2 className="flex items-center gap-2 text-gray-700 text-sm font-semibold mb-4"><FaTasks className="text-gray-600" /> Your Tasks</h2>
          {loading ? <p className="text-gray-400">Loading...</p> : (
          <ul className="space-y-3">
              {todos.map(todo => {
                const isActive = activeTaskId === todo._id;
                return (
                  <motion.li
                    key={todo._id}
                    layout
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-sm relative z-30
                      ${isActive ? "bg-gray-100 border-gray-400 scale-105 shadow-lg" : activeTaskId ? "opacity-30 pointer-events-none" : "hover:bg-gray-50 border-gray-200"}`}
                    onClick={(e) => handleTaskClick(e, todo)}
                    whileHover={{ scale: isActive ? 1.05 : 1.02 }}
                  >
                    <span className="truncate font-medium">{todo.title}</span>
                    <div className="flex gap-2">
                      {isActive ? (
                        <button onClick={e => { e.stopPropagation(); onEndTask(todo._id); }} className="px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200">End</button>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); onStartTask(todo._id); }} className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-800">Start</button>
                      )}
                      <button onClick={e => { e.stopPropagation(); onToggleComplete(todo); }} className={`p-2 rounded ${todo.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FaCheck /></button>
                      <button onClick={e => { e.stopPropagation(); onDelete(todo); }} className="p-2 rounded bg-red-50 text-red-500 hover:bg-red-100"><FaTrash /></button>
                    </div>
                  </motion.li>
                );
              })}
          </ul>
          )}
        </motion.div>

        {/* Details */}
        <motion.div variants={panelVariants} className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 transition-all flex flex-col">
          <h2 className="flex items-center gap-2 text-gray-700 text-sm font-semibold mb-4"><FaFileAlt className="text-gray-600" /> Details</h2>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col space-y-4 break-words">
                <div className="flex flex-col">
                  <p className="text-xs text-gray-400">Title</p>
                  <p className="text-lg font-bold break-words">{selected.title}</p>
                </div>
                {selected.description && (
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="break-words">{selected.description}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => onResume(selected._id)} className="px-4 py-2 rounded-xl bg-gray-700 text-white hover:opacity-90 shadow-sm">Resume</button>
                  {activeTaskId === selected._id && (
                    <button onClick={() => onTestFileTracking(selected._id)} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:opacity-90 shadow-sm text-sm">🧪 Test Track</button>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-gray-400 mb-2">Recent Files</p>
                  {recentFiles.length === 0 ? <p className="text-gray-400 text-sm">No files yet.</p> :
                    <ul className="text-[0.7rem] text-gray-600 space-y-1 break-words">
                      {recentFiles.map((f, i) => <li key={i} className="break-words">{f.path}</li>)}
                    </ul>
                  }
                </div>
              </motion.div>
            ) : (
              <motion.p key="no-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400">Select a task</motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Summary */}
        <motion.div variants={panelVariants} className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 max-h-[60vh] overflow-y-auto transition-all">
          <h2 className="flex items-center gap-2 text-gray-700 text-sm font-semibold mb-4"><FaRegStickyNote className="text-gray-600" /> Summary</h2>
          <AnimatePresence>
            {selected ? (
              <motion.div key={selected._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-gray-600">Created: {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}</p>
              </motion.div>
            ) : (
              <motion.p key="no-summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400">Select a task</motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.main>

      {/* Session Restore Dialog */}
      {/* Session Restore Dialog with premium minimalistic design and animations */}
<AnimatePresence>
  {showRestoreDialog && restoreData && (
    <motion.div
      key="session-restore-dialog"
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col gap-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Restore Session: {restoreData.taskTitle}
        </h3>
        {restoreData.lastSession && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last session: {new Date(restoreData.lastSession).toLocaleString()}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {restoreData.totalFiles || 0} files available
        </p>

        {/* Select All Toggle */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isPartiallySelected;
              }}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select All ({selectedFiles.length}/{restoreData.files.length})
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pt-2">
          {restoreData.files.map((file: any, index: number) => (
            <motion.label
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedFiles.includes(file.path)}
                onChange={() => toggleFileSelection(file.path)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 break-all flex-1">
                {file.path}
              </span>
            </motion.label>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {selectedFiles.length} of {restoreData.files.length} files selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowRestoreDialog(false);
                setSelectedFiles([]);
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onRestoreFiles(selectedFiles)}
              disabled={selectedFiles.length === 0}
              className={`px-4 py-2 rounded-xl transition ${
                selectedFiles.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Open Selected ({selectedFiles.length})
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}
