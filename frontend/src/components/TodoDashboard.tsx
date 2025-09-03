"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  FaTasks, FaFileAlt, FaRegStickyNote, FaPlus, FaTrash, FaCheck, 
  FaPlay, FaStop, FaClock, FaFolder, FaCode, FaChevronRight,
  FaEllipsisV, FaDownload, FaUpload, FaSearch, FaSignOutAlt, FaUser
} from "react-icons/fa";
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
     const [searchQuery, setSearchQuery] = useState("");
   const [showCreateForm, setShowCreateForm] = useState(false);
   const [userEmail, setUserEmail] = useState<string | null>(null);
       const [selectedView, setSelectedView] = useState<'summary' | 'files'>('files');

  const selected = useMemo(() => todos.find(t => t._id === selectedId) || null, [todos, selectedId]);

  const filteredTodos = useMemo(() => {
    if (!searchQuery) return todos;
    return todos.filter(todo => 
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [todos, searchQuery]);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const slideVariants: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 }
  };

  useEffect(() => {
    loadTodos();
    
    // Get user email from token
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email);
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
    }
    
    // Set up file tracking listener
    if (window.taskAPI) {
      window.taskAPI.onFileTracked(handleFileTracked);
    }
  }, []);

  const handleFileTracked = (_event: any, data: { taskId: string; path: string }) => {
    console.log('📁 File tracked:', data.path, 'for task:', data.taskId);
    
    // Always refresh the recent files for the tracked task
    loadRecent(data.taskId);
    
    // If this is the currently selected task, update the display immediately
    if (selectedId === data.taskId) {
      setRecentFiles(prev => {
        const exists = prev.some(f => f.path === data.path);
        if (!exists) {
          return [{ path: data.path, lastOpened: new Date().toISOString() }, ...prev];
        }
        return prev;
      });
    }
    
    // Show notification
    setNewFileNotification(`📁 ${data.path.split('\\').pop() || data.path}`);
    setTimeout(() => setNewFileNotification(null), 3000);
  };

  async function loadTodos() {
    try {
      setLoading(true);
      const data = await listTodos();
      setTodos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecent(taskId: string) {
    try {
      const r = await getResume(taskId);
      const allFiles = [
        ...(r.files || [])
      ];
      setRecentFiles(allFiles.sort((a, b) => 
        new Date(b.lastOpened || 0).getTime() - 
        new Date(a.lastOpened || 0).getTime()
      ));
    } catch (e) {
      console.error('Failed to load recent files:', e);
      setRecentFiles([]);
    }
  }

  async function onCreateTodo() {
    if (!newTitle.trim()) return;
    
    try {
      const newTodo = await createTodo({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        status: 'pending'
      });
      setTodos(prev => [newTodo, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function onToggleComplete(todo: Todo) {
    try {
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      const updated = await updateTodo(todo._id, { status: newStatus });
      setTodos(prev => prev.map(t => t._id === todo._id ? updated : t));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function onDeleteTodo(id: string) {
    try {
      await deleteTodo(id);
      setTodos(prev => prev.filter(t => t._id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function onStartTask(taskId: string) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No authentication token found. Please login again.');
      return;
    }

    if (window.taskAPI) {
      await window.taskAPI.start(taskId, token);
      setActiveTaskId(taskId);
      loadRecent(taskId);
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

        setSelectedFiles(r.files?.map((f: any) => f.path) || []);
        setShowRestoreDialog(true);
      } else {
        setError('No files found for this task session.');
      }
      
      loadRecent(taskId);
    } catch (e) {
      console.error(e);
      setError('Failed to load session files.');
    }
  }

  async function onRestoreFiles(selectedFilePaths: string[]) {
    if (!restoreData || !window.taskAPI) return;
    
    try {
      const filesToOpen = selectedFilePaths.map(path => ({ path }));
      await window.taskAPI.resumeOpen(restoreData.taskId, filesToOpen);
      
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
      await window.taskAPI.pickAndTrack(taskId, token);
    }
  }

  function onLogout() {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your workspace...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${poppins.className}`}
    >
      {/* Header */}
      <motion.header 
        variants={cardVariants}
        className="bg-white/90 backdrop-blur-xl border-b border-slate-300 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <FaTasks className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">Task Manager</h1>
                <p className="text-sm text-slate-600 font-medium">Organize your workflow</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all w-64 font-medium placeholder:text-slate-600"
                />
              </div>
              
              {/* User Info */}
              {userEmail && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                  <FaUser className="text-slate-600 text-sm" />
                  <span className="text-sm font-medium text-slate-700">{userEmail}</span>
                </div>
              )}
              
              {/* Create Task Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateForm(true)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold shadow-lg shadow-slate-900/30 hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <FaPlus className="text-sm" />
                New Task
              </motion.button>
              
              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLogout}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <FaSignOutAlt className="text-sm" />
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Notification */}
      <AnimatePresence>
        {newFileNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-500/25 flex items-center gap-2"
          >
            <FaCheck className="text-sm" />
            <span className="font-medium">File tracked: {newFileNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-6 z-50 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-red-500/25 flex items-center gap-2"
          >
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-white/80 hover:text-white">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Task List */}
          <motion.div 
            variants={cardVariants}
            className="col-span-12 lg:col-span-4"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 shadow-2xl shadow-slate-900/10 overflow-hidden">
              <div className="p-5 border-b border-slate-200/70">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Tasks</h2>
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">
                    {filteredTodos.length}
                  </span>
                </div>
              </div>
              
              <div className="h-[calc(100vh-200px)] overflow-y-auto">
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
                        setSelectedId(todo._id);
                        loadRecent(todo._id);
                      }}
                      className={`p-4 border-b border-slate-200/30 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                        selectedId === todo._id ? 'bg-blue-50 border-l-4 border-l-blue-500 text-slate-900' : 'text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(todo);
                          }}
                          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            todo.status === 'completed'
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-slate-300 hover:border-green-400'
                          }`}
                        >
                          {todo.status === 'completed' && <FaCheck className="text-xs" />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${
                            todo.status === 'completed' 
                              ? 'line-through' + (selectedId === todo._id ? ' text-slate-500' : ' text-slate-400')
                              : 'text-slate-900'
                          }`}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className={`text-sm mt-1 line-clamp-2 ${
                              selectedId === todo._id ? 'text-slate-600' : 'text-slate-600'
                            }`}>
                              {todo.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {activeTaskId === todo._id && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Active
                              </span>
                            )}
                            <span className={`text-xs ${
                              selectedId === todo._id ? 'text-slate-500' : 'text-slate-500'
                            }`}>
                              {todo.createdAt ? new Date(todo.createdAt).toLocaleDateString() : 'No date'}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTodo(todo._id);
                          }}
                          className={`transition-colors p-1 ${
                            selectedId === todo._id 
                              ? 'text-slate-500 hover:text-red-500' 
                              : 'text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Task Details */}
          <motion.div 
            variants={cardVariants}
            className="col-span-12 lg:col-span-8"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 shadow-2xl shadow-slate-900/10 overflow-hidden h-[calc(100vh-150px)]">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected._id}
                    variants={slideVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="p-6 h-full flex flex-col"
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">
                          {selected.title}
                        </h2>
                        {selected.description && (
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {selected.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
                          <FaEllipsisV />
                        </button>
                      </div>
                    </div>

                                         {/* Action Buttons */}
                     <div className="flex items-center gap-3 mb-6">
                       {activeTaskId === selected._id ? (
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => onEndTask(selected._id)}
                           className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all flex items-center gap-2"
                         >
                           <FaStop className="text-sm" />
                           End Task
                         </motion.button>
                       ) : (
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => onStartTask(selected._id)}
                           className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all flex items-center gap-2"
                         >
                           <FaPlay className="text-sm" />
                           Start Task
                         </motion.button>
                       )}
                       
                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={() => onResume(selected._id)}
                         className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2"
                       >
                         <FaUpload className="text-sm" />
                         Resume
                       </motion.button>
                       
                       {activeTaskId === selected._id && (
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => onTestFileTracking(selected._id)}
                           className="px-4 py-2.5 bg-purple-600 text-white rounded-lg font-bold shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-all flex items-center gap-2"
                         >
                           <FaCode className="text-sm" />
                           Test
                         </motion.button>
                       )}
                     </div>

                                           {/* View Toggle Buttons */}
                      <div className="flex items-center gap-3 mb-6">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedView('summary')}
                          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                            selectedView === 'summary'
                              ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-800/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <FaRegStickyNote className="text-sm" />
                          Summary
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedView('files')}
                          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                            selectedView === 'files'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <FaFolder className="text-sm" />
                          Recent Files
                        </motion.button>
                      </div>

                      {/* Conditional Content Based on Selected View */}
                      <div className="flex-1 overflow-hidden">
                        {selectedView === 'summary' ? (
                          /* Full Summary View - No Header, Maximum Space */
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
                            {/* Summary Content - Full Height, No Header */}
                            <div className="p-8 overflow-y-auto h-full">
                              {/* Task Overview Section */}
                              <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                  <FaRegStickyNote className="text-slate-600" />
                                  Task Overview
                                </h4>
                                <div className="grid grid-cols-2 gap-6 text-sm">
                                  <div className="flex items-center gap-3">
                                    <FaClock className="text-slate-500" />
                                    <span className="text-slate-600">Created:</span>
                                    <span className="font-medium text-slate-900">
                                      {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'No date'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <FaFileAlt className="text-slate-500" />
                                    <span className="text-slate-600">Files:</span>
                                    <span className="font-medium text-slate-900">{recentFiles.length} tracked</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <FaTasks className="text-slate-500" />
                                    <span className="text-slate-600">Status:</span>
                                    <span className={`font-medium ${
                                      selected.status === 'completed' ? 'text-green-600' : 
                                      activeTaskId === selected._id ? 'text-blue-600' : 'text-slate-600'
                                    }`}>
                                      {selected.status === 'completed' ? 'Completed' : 
                                       activeTaskId === selected._id ? 'Active' : 'Pending'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <FaPlay className="text-slate-500" />
                                    <span className="text-slate-600">Priority:</span>
                                    <span className="font-medium text-slate-900">{selected.priority || 'Normal'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Project Details */}
                              <div className="space-y-8">
                                {/* Project Overview */}
                                <div className="border-l-4 border-slate-300 pl-6">
                                  <h4 className="font-semibold text-slate-900 mb-4 text-xl">Project Overview</h4>
                                  <p className="text-slate-700 leading-relaxed text-lg">
                                    This task involves developing a sophisticated file tracking system that monitors user activity across multiple applications and platforms. The system provides comprehensive workflow management and session restoration capabilities.
                                  </p>
                                </div>

                                {/* System Architecture */}
                                <div className="border-l-4 border-slate-300 pl-6">
                                  <h4 className="font-semibold text-slate-900 mb-4 text-xl">System Architecture</h4>
                                  <p className="text-slate-700 leading-relaxed text-lg">
                                    The system includes real-time monitoring capabilities, automatic file detection through Windows Recent Items, process monitoring for executable files, and intelligent session restoration. Users can start and stop tracking sessions seamlessly.
                                  </p>
                                </div>

                                {/* Key Features */}
                                <div className="border-l-4 border-slate-300 pl-6">
                                  <h4 className="font-semibold text-slate-900 mb-4 text-xl">Key Features</h4>
                                  <p className="text-slate-700 leading-relaxed text-lg">
                                    Automatic detection of files opened in VS Code, Notepad++, Microsoft Office applications, and other common development tools. The system maintains comprehensive logs with timestamps and session information.
                                  </p>
                                </div>

                                {/* Technology Stack */}
                                <div className="border-l-4 border-slate-300 pl-6">
                                  <h4 className="font-semibold text-slate-900 mb-4 text-xl">Technology Stack</h4>
                                  <p className="text-slate-700 leading-relaxed text-lg">
                                    MongoDB Atlas for persistent storage, JWT authentication for secure access, and Electron application providing a native desktop experience with real-time updates and professional-grade UI components.
                                  </p>
                                </div>

                                {/* Current Status */}
                                <div className="border-l-4 border-slate-300 pl-6">
                                  <h4 className="font-semibold text-slate-900 mb-4 text-xl">Current Development Phase</h4>
                                  <p className="text-slate-700 leading-relaxed text-lg">
                                    Focus on optimizing file detection algorithms, improving user experience through enhanced UI components, and implementing advanced session management features. The system handles large numbers of files and complex workflow scenarios.
                                  </p>
                                </div>

                                {/* Future Plans */}
                                <div className="border-l-4 border-slate-300 pl-6">
                                  <h4 className="font-semibold text-slate-900 mb-4 text-xl">Future Enhancements</h4>
                                  <p className="text-slate-700 leading-relaxed text-lg">
                                    Cloud synchronization, collaborative workspace features, integration with popular project management tools, advanced analytics, and role-based access control for team environments.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Recent Files View */
                          <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden h-full">
                            <div className="p-5 border-b border-slate-200 bg-slate-100">
                              <div className="flex items-center gap-2">
                                <FaFolder className="text-slate-900" />
                                <h3 className="font-bold text-slate-900">Recent Files</h3>
                                <span className="px-2 py-1 bg-slate-900 text-white text-xs rounded-lg font-bold">
                                  {recentFiles.length}
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-5 h-[calc(100%-80px)] overflow-y-auto">
                              {recentFiles.length === 0 ? (
                                <div className="text-center py-8">
                                  <FaFileAlt className="text-4xl text-slate-300 mx-auto mb-3" />
                                  <p className="text-slate-600 font-semibold">No files tracked yet</p>
                                  <p className="text-sm text-slate-500">Start the task to begin tracking files</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {recentFiles.map((file, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
                                    >
                                      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FaFileAlt className="text-white text-sm" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                          {file.path.split('\\').pop() || file.path.split('/').pop() || file.path}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                          {file.path}
                                        </p>
                                      </div>
                                      <FaChevronRight className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-selection"
                    variants={slideVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-12 text-center h-full flex flex-col items-center justify-center"
                  >
                    <FaTasks className="text-6xl text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-800 mb-2">
                      Select a task to get started
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Choose a task from the left panel to view details and manage files
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Create Task Modal */}
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter task title..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-600"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Add task description..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none placeholder:text-slate-600"
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
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Create Task
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Restore Dialog */}
      <AnimatePresence>
        {showRestoreDialog && restoreData && (
          <motion.div
            key="session-restore-dialog"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <FaDownload className="text-white" />
                  </div>
                  Restore Session: {restoreData.taskTitle}
                </h3>
                {restoreData.lastSession && (
                  <p className="text-sm text-slate-500 mt-2">
                    Last session: {new Date(restoreData.lastSession).toLocaleString()}
                  </p>
                )}
                <p className="text-sm text-slate-600 mt-1">
                  {restoreData.totalFiles || 0} files available for restoration
                </p>
              </div>

              <div className="p-6">
                {/* Select All Toggle */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isPartiallySelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="font-medium text-slate-700">
                      Select All ({selectedFiles.length}/{restoreData.files.length})
                    </span>
                  </label>
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pt-4">
                  {restoreData.files.map((file: any, index: number) => (
                    <motion.label
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaFileAlt className="text-white text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {file.path.split('\\').pop() || file.path.split('/').pop() || file.path}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {file.path}
                        </p>
                      </div>
                      <FaChevronRight className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                    </motion.label>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  {selectedFiles.length} of {restoreData.files.length} files selected
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRestoreDialog(false);
                      setSelectedFiles([]);
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onRestoreFiles(selectedFiles)}
                    disabled={selectedFiles.length === 0}
                    className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      selectedFiles.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                    }`}
                  >
                    <FaDownload className="text-sm" />
                    Open Selected ({selectedFiles.length})
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}