"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaComments, FaSpinner, FaExclamationTriangle, FaRegLightbulb, FaTimes } from "react-icons/fa";
import { searchSlackMessagesByKeywords } from "../lib/slackKeywordSearch";

interface SlackSummaryResult {
  success: boolean;
  keyword: string;
  messageCount: number;
  channelName: string;
  aiSummary: string;
  messages: Array<{
    text: string;
    user: string;
    timestamp: string;
    channel: string;
  }>;
  timestamp: string;
}

interface SlackKeywordSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const SlackKeywordSearch: React.FC<SlackKeywordSearchProps> = ({ isOpen, onClose }) => {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SlackSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setSearching(true);
    setError(null);
    setResults(null);

    try {
      const searchResults = await searchSlackMessagesByKeywords(keyword.trim());
      setResults(searchResults);
    } catch (err: any) {
      setError(err.message || 'Failed to search Slack messages');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !searching) {
      handleSearch();
    }
  };

  const handleClose = () => {
    setKeyword("");
    setResults(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FaComments className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Slack Keyword Search</h2>
                <p className="text-slate-300 text-sm">Get AI summaries of Slack messages by keywords</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-300 hover:text-white transition-colors p-2"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Enter keywords like 'pandas', 'python file', 'database update'..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={searching}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-500 disabled:opacity-50"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={searching || !keyword.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch />
                  Search
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
              >
                <FaExclamationTriangle className="text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-900">Search Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {!searching && !results && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FaRegLightbulb className="text-5xl text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Search Slack Messages</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Enter keywords to find and get AI summaries of relevant Slack messages. 
                  For example, try "pandas", "python file", or "deadline".
                </p>
              </motion.div>
            )}

            {searching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FaSpinner className="text-4xl text-blue-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Searching...</h3>
                <p className="text-slate-600">
                  Analyzing Slack messages for keyword: "{keyword}"
                </p>
              </motion.div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Search Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <FaComments className="text-blue-600" />
                    Search Results for "{results.keyword}"
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Messages found:</span>
                      <span className="font-medium text-blue-900 ml-2">{results.messageCount}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Channel:</span>
                      <span className="font-medium text-blue-900 ml-2">{results.channelName}</span>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <FaRegLightbulb className="text-slate-600" />
                    AI Summary
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {results.aiSummary}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                {results.messages && results.messages.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <h4 className="font-medium text-slate-900">Related Messages</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {results.messages.map((message, index) => (
                        <div
                          key={index}
                          className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-medium">
                                {message.user.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900 text-sm">
                                  {message.user}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(message.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {message.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SlackKeywordSearch;
