"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFile, FaTimes, FaFolderOpen, FaCheck, FaClock } from "react-icons/fa";

interface FileItem {
  path: string;
  lastOpened?: string;
  lastAccessed?: string;
  isActive?: boolean;
}

interface SessionRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  files: FileItem[];
  lastSession?: string;
  onRestore: (selectedFiles: string[]) => void;
}

export default function SessionRestoreDialog({
  isOpen,
  onClose,
  taskTitle,
  files,
  lastSession,
  onRestore
}: SessionRestoreDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Initialize with all files selected
  useEffect(() => {
    if (files.length > 0) {
      const allPaths = new Set(files.map(f => f.path));
      setSelectedFiles(allPaths);
      setSelectAll(true);
    }
  }, [files]);

  const toggleFile = (path: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
    setSelectAll(newSelected.size === files.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles(new Set());
      setSelectAll(false);
    } else {
      const allPaths = new Set(files.map(f => f.path));
      setSelectedFiles(allPaths);
      setSelectAll(true);
    }
  };

  const handleRestore = () => {
    onRestore(Array.from(selectedFiles));
    onClose();
  };

  const getFileName = (path: string) => {
    return path.split('\\').pop() || path.split('/').pop() || path;
  };

  const getFileDirectory = (path: string) => {
    const parts = path.split('\\').length > 1 ? path.split('\\') : path.split('/');
    return parts.slice(0, -1).join('\\') || parts.slice(0, -1).join('/');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaFolderOpen />
                  Resume Session
                </h2>
                <p className="text-blue-100 mt-1">
                  Restore files from "{taskTitle}"
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {lastSession && (
              <div className="flex items-center gap-2 mt-3 text-blue-100 text-sm">
                <FaClock />
                Last session: {formatDate(lastSession)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaFile size={48} className="mx-auto mb-4 opacity-50" />
                <p>No files found in this session.</p>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectAll 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {selectAll && <FaCheck size={12} />}
                    </button>
                    <span className="font-medium">
                      {selectAll ? 'Deselect All' : 'Select All'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedFiles.size} of {files.length} selected
                  </span>
                </div>

                {/* Files List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {files.map((file, index) => {
                    const isSelected = selectedFiles.has(file.path);
                    return (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => toggleFile(file.path)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected 
                                ? 'bg-blue-500 border-blue-500 text-white' 
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <FaCheck size={12} />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FaFile className="text-gray-400 flex-shrink-0" />
                              <span className="font-medium text-gray-900 truncate">
                                {getFileName(file.path)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {getFileDirectory(file.path)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Last opened: {formatDate(file.lastAccessed || file.lastOpened)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {files.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedFiles.size > 0 
                  ? `${selectedFiles.size} file${selectedFiles.size === 1 ? '' : 's'} will be opened`
                  : 'No files selected'
                }
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestore}
                  disabled={selectedFiles.size === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    selectedFiles.size > 0
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Open Selected Files
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
