import React from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { FaEllipsisV, FaPlay, FaStop, FaUpload, FaCode, FaRegStickyNote, FaFolder, FaFileAlt, FaChevronRight, FaTasks } from "react-icons/fa";
import { Todo } from "../lib/todos";

interface TaskDetailsProps {
  selected: Todo | null;
  activeTaskId: string | null;
  recentFiles: Array<{ path: string; lastOpened?: string }>;
  selectedView: 'summary' | 'files';
  setSelectedView: (view: 'summary' | 'files') => void;
  onStartTask: (id: string) => void;
  onEndTask: (id: string) => void;
  onResume: (id: string) => void;
  onTestFileTracking: (id: string) => void;
  summaries: Array<{ file: string; summary: string }>;
  loadingSummary: boolean;
  loadSummary: (taskId: string) => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  selected,
  activeTaskId,
  recentFiles,
  selectedView,
  setSelectedView,
  onStartTask,
  onEndTask,
  onResume,
  onTestFileTracking,
  summaries,
  loadingSummary,
  loadSummary,
}) => {
  if (!selected) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center">
        <FaTasks className="text-6xl text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-800 mb-2">Select a task to get started</h3>
        <p className="text-slate-600 font-medium">Choose a task from the left panel to view details and manage files</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Task Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-900 mb-2">{selected.title}</h2>
          {selected.description && <p className="text-slate-700 leading-relaxed font-medium">{selected.description}</p>}
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
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onEndTask(selected._id)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all flex items-center gap-2">
            <FaStop className="text-sm" /> End Task
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onStartTask(selected._id)} className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all flex items-center gap-2">
            <FaPlay className="text-sm" /> Start Task
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onResume(selected._id)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2">
          <FaUpload className="text-sm" /> Resume
        </motion.button>
        {activeTaskId === selected._id && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onTestFileTracking(selected._id)} className="px-4 py-2.5 bg-purple-600 text-white rounded-lg font-bold shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-all flex items-center gap-2">
            <FaCode className="text-sm" /> Test
          </motion.button>
        )}
      </div>
      {/* View Toggle Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedView('summary')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${selectedView === 'summary' ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-800/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <FaRegStickyNote className="text-sm" /> Summary
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedView('files')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${selectedView === 'files' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <FaFolder className="text-sm" /> Recent Files
        </motion.button>
      </div>
      {/* Conditional Content Based on Selected View */}
      <div className="h-full overflow-hidden">
        {selectedView === 'summary' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="h-full overflow-y-auto p-6">
              {/* Task Overview Section */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FaRegStickyNote className="text-slate-600" /> Task Overview
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FaTasks className="text-slate-500" />
                    <span className="text-slate-600">Status:</span>
                    <span className={`font-medium ${selected.status === 'completed' ? 'text-green-600' : activeTaskId === selected._id ? 'text-blue-600' : 'text-slate-600'}`}>{selected.status === 'completed' ? 'Completed' : activeTaskId === selected._id ? 'Active' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPlay className="text-slate-500" />
                    <span className="text-slate-600">Priority:</span>
                    <span className="font-medium text-slate-900">{selected.priority || 'Normal'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaFileAlt className="text-slate-500" />
                    <span className="text-slate-600">Files:</span>
                    <span className="font-medium text-slate-900">{recentFiles.length} tracked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTasks className="text-slate-500" />
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium text-slate-900">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>
              </div>

              {/* Generate Summary Button */}
              <div className="mb-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => loadSummary(selected._id)}
                  disabled={loadingSummary}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loadingSummary ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaRegStickyNote className="text-xs" />
                      Generate Summary
                    </>
                  )}
                </motion.button>
              </div>

              {/* Summaries Display */}
              <div className="space-y-4">
                {summaries && summaries.length > 0 ? (
                  summaries.map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-300 pl-4 bg-blue-50 p-3 rounded-r-lg">
                      <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                        <FaFileAlt className="text-blue-600 text-xs" />
                        <span className="truncate">{item.file.split('\\').pop() || item.file}</span>
                      </h4>
                      <p className="text-slate-700 leading-relaxed text-xs">{item.summary}</p>
                    </div>
                  ))
                ) : !loadingSummary && (
                  <div className="text-center py-8">
                    <FaRegStickyNote className="text-3xl text-slate-300 mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-slate-600 mb-2">No Summary Available</h4>
                    <p className="text-slate-500 text-sm">Click "Generate Summary" to analyze tracked files</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden h-full">
            <div className="p-5 border-b border-slate-200 bg-slate-100">
              <div className="flex items-center gap-2">
                <FaFolder className="text-slate-900" />
                <h3 className="font-bold text-slate-900">Recent Files</h3>
                <span className="px-2 py-1 bg-slate-900 text-white text-xs rounded-lg font-bold">{recentFiles.length}</span>
              </div>
            </div>
            <div className="h-[calc(100%-80px)] overflow-y-auto p-5">
              {recentFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FaFileAlt className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-semibold">No files tracked yet</p>
                  <p className="text-sm text-slate-500">Start the task to begin tracking files</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentFiles.map((file, index) => (
                    <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
                      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaFileAlt className="text-white text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{file.path.split("\\").pop() || file.path.split("/").pop() || file.path}</p>
                        <p className="text-xs text-slate-500 truncate">{file.path}</p>
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
    </div>
  );
};export default TaskDetails;
