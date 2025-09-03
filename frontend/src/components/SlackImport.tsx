"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSlack, FaSpinner, FaCheck, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import { importSlackTasks, validateSlackChannelId, extractChannelIdFromUrl, previewSlackTasks, type SlackImportResult, type SlackTask } from "../lib/slack";

interface SlackImportProps {
  onImportComplete: (result: SlackImportResult) => void;
  onImportStart?: () => void;
}

export default function SlackImport({ onImportComplete, onImportStart }: SlackImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<SlackImportResult | null>(null);
  const [previewTasks, setPreviewTasks] = useState<SlackTask[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = async () => {
    if (!channelId.trim()) {
      setResult({
        success: false,
        importedCount: 0,
        errors: ["Please enter a Slack channel ID"],
        tasks: []
      });
      return;
    }

    // Validate channel ID
    if (!validateSlackChannelId(channelId)) {
      setResult({
        success: false,
        importedCount: 0,
        errors: ["Invalid Slack channel ID format. Channel IDs should start with 'C' or 'G' followed by 8+ characters."],
        tasks: []
      });
      return;
    }

    setIsLoading(true);
    setProgress("Fetching and parsing tasks...");
    setResult(null);

    try {
      const tasks = await previewSlackTasks(channelId);
      setPreviewTasks(tasks);
      setShowPreview(true);
      setProgress(`Found ${tasks.length} task-related messages`);
    } catch (error) {
      const errorResult: SlackImportResult = {
        success: false,
        importedCount: 0,
        errors: [`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        tasks: []
      };
      setResult(errorResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!channelId.trim()) {
      setResult({
        success: false,
        importedCount: 0,
        errors: ["Please enter a Slack channel ID"],
        tasks: []
      });
      return;
    }

    // Validate channel ID
    if (!validateSlackChannelId(channelId)) {
      setResult({
        success: false,
        importedCount: 0,
        errors: ["Invalid Slack channel ID format. Channel IDs should start with 'C' or 'G' followed by 8+ characters."],
        tasks: []
      });
      return;
    }

    setIsLoading(true);
    setProgress("");
    setResult(null);
    onImportStart?.();

    try {
      const importResult = await importSlackTasks(channelId, setProgress);
      setResult(importResult);
      onImportComplete(importResult);
    } catch (error) {
      const errorResult: SlackImportResult = {
        success: false,
        importedCount: 0,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        tasks: []
      };
      setResult(errorResult);
      onImportComplete(errorResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelIdChange = (value: string) => {
    setChannelId(value);
    setResult(null);
  };

  const handleUrlPaste = (url: string) => {
    const extractedId = extractChannelIdFromUrl(url);
    if (extractedId) {
      setChannelId(extractedId);
      setResult(null);
    }
  };

  const resetForm = () => {
    setChannelId("");
    setResult(null);
    setProgress("");
    setIsLoading(false);
    setPreviewTasks([]);
    setShowPreview(false);
  };

  return (
    <>
      {/* Import Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 shadow-sm flex items-center gap-2"
      >
        <FaSlack />
        Import from Slack
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
            onClick={() => !isLoading && setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FaSlack className="text-purple-600 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Import from Slack
                  </h3>
                </div>
                {!isLoading && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Channel ID Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slack Channel ID
                  </label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => handleChannelIdChange(e.target.value)}
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData('text');
                      if (pastedText.includes('slack.com')) {
                        handleUrlPaste(pastedText);
                      }
                    }}
                    placeholder="e.g., C1234567890 or paste Slack URL"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a Slack channel ID (starts with C or G) or paste a Slack channel URL
                  </p>
                </div>

                                 {/* Progress */}
                 {isLoading && progress && (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                   >
                     <FaSpinner className="text-blue-600 animate-spin" />
                     <span className="text-sm text-blue-700">{progress}</span>
                   </motion.div>
                 )}

                 {/* Preview Tasks */}
                 {showPreview && previewTasks.length > 0 && (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="p-4 bg-gray-50 rounded-lg border"
                   >
                     <h4 className="font-medium text-gray-800 mb-3">Found Tasks:</h4>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                       {previewTasks.map((task, index) => (
                         <div key={index} className="p-2 bg-white rounded border text-sm">
                           <div className="font-medium text-gray-800">{task.title}</div>
                           {task.extractedInfo?.fileName && (
                             <div className="text-blue-600">File: {task.extractedInfo.fileName}</div>
                           )}
                           {task.extractedInfo?.deadline && (
                             <div className="text-red-600">Deadline: {task.extractedInfo.deadline}</div>
                           )}
                           <div className="text-gray-600 text-xs mt-1">{task.summary}</div>
                         </div>
                       ))}
                     </div>
                   </motion.div>
                 )}

                {/* Results */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      result.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaExclamationTriangle className="text-red-600" />
                      )}
                      <span className={`font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success
                          ? `Successfully imported ${result.importedCount} tasks`
                          : 'Import failed'
                        }
                      </span>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {result.errors.map((error, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}

                                 {/* Actions */}
                 <div className="flex gap-3 pt-4">
                   <button
                     onClick={() => setIsOpen(false)}
                     disabled={isLoading}
                     className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     {result ? 'Close' : 'Cancel'}
                   </button>
                   
                   {!result && !showPreview && (
                     <button
                       onClick={handlePreview}
                       disabled={isLoading || !channelId.trim()}
                       className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                     >
                       {isLoading ? (
                         <>
                           <FaSpinner className="animate-spin" />
                           Previewing...
                         </>
                       ) : (
                         <>
                           <FaSlack />
                           Preview Tasks
                         </>
                       )}
                     </button>
                   )}
                   
                   {showPreview && !result && (
                     <button
                       onClick={handleImport}
                       disabled={isLoading || !channelId.trim()}
                       className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                     >
                       {isLoading ? (
                         <>
                           <FaSpinner className="animate-spin" />
                           Importing...
                         </>
                       ) : (
                         <>
                           <FaSlack />
                           Import Tasks
                         </>
                       )}
                     </button>
                   )}
                   
                   {result && (
                     <button
                       onClick={resetForm}
                       className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                     >
                       Import More
                     </button>
                   )}
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
