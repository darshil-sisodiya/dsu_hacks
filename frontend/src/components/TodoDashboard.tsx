"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FaTasks, FaPlus, FaSearch, FaSignOutAlt, FaUser, FaCheck, FaComments, FaArrowLeft } from "react-icons/fa";
import { listTodos, createTodo, updateTodo, deleteTodo, type Todo, getResume, getSummary } from "../lib/todos";
import { poppins } from "../fonts";
import TaskList from "./TaskList";
import TaskDetails from "./TaskDetails";
import CreateTaskModal from "./CreateTaskModal";
import SessionRestoreDialog from "./SessionRestoreDialog";
import SlackKeywordSearch from "./SlackKeywordSearch";

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
  const [summaries, setSummaries] = useState<Array<{ file: string; summary: string }>>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSlackSearch, setShowSlackSearch] = useState(false);

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

  async function loadSummary(taskId: string) {
    try {
      setLoadingSummary(true);
      const summaryData = await getSummary(taskId);
      setSummaries(summaryData.summaries || []);
    } catch (e) {
      console.error('Failed to load summary:', e);
      setSummaries([]);
    } finally {
      setLoadingSummary(false);
    }
  }

  function handleTaskSelection(taskId: string) {
    setSelectedId(taskId);
    setSummaries([]); // Clear summaries when switching tasks
    loadRecent(taskId);
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
  {/* Back Button */}
  <button
    onClick={() => window.history.back()}
    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center"
  >
    <FaArrowLeft className="text-slate-700 text-lg" />
  </button>

  {/* App Icon & Name */}
  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
    <FaTasks className="text-white text-lg" />
  </div>
  <div>
    <h1 className="text-xl font-black text-slate-900">Context<span className="text-blue-600">Flow</span></h1>
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

              {/* Slack Search Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSlackSearch(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <FaComments className="text-sm" />
                Slack Search
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
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]">
          {/* Task List */}
          <motion.div 
            variants={cardVariants}
            className="col-span-12 lg:col-span-4"
          >
            <TaskList
              todos={todos}
              filteredTodos={filteredTodos}
              selectedId={selectedId}
              activeTaskId={activeTaskId}
              onToggleComplete={onToggleComplete}
              onDeleteTodo={onDeleteTodo}
              onTaskSelect={handleTaskSelection}
              slideVariants={slideVariants}
            />
          </motion.div>

          {/* Task Details */}
          <motion.div 
            variants={cardVariants}
            className="col-span-12 lg:col-span-8"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/50 shadow-2xl shadow-slate-900/10 overflow-hidden h-[calc(100vh-160px)]">
              <TaskDetails
                selected={selected}
                activeTaskId={activeTaskId}
                recentFiles={recentFiles}
                selectedView={selectedView}
                setSelectedView={setSelectedView}
                onStartTask={onStartTask}
                onEndTask={onEndTask}
                onResume={onResume}
                onTestFileTracking={onTestFileTracking}
                summaries={summaries}
                loadingSummary={loadingSummary}
                loadSummary={loadSummary}
              />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Create Task Modal */}
      <CreateTaskModal
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newDescription={newDescription}
        setNewDescription={setNewDescription}
        onCreateTodo={onCreateTodo}
      />

      {/* Session Restore Dialog */}
      <SessionRestoreDialog
        isOpen={showRestoreDialog}
        onClose={() => { setShowRestoreDialog(false); setSelectedFiles([]); }}
        taskTitle={restoreData?.taskTitle || selected?.title || ''}
        files={restoreData?.files || []}
        lastSession={restoreData?.lastSession}
        onRestore={onRestoreFiles}
      />

      {/* Slack Keyword Search Modal */}
      <SlackKeywordSearch
        isOpen={showSlackSearch}
        onClose={() => setShowSlackSearch(false)}
      />
    </motion.div>
  );
}





