// client/components/ImportingScreen/ImportingScreen.jsx
import React from "react";
import { motion } from "framer-motion";

const getStageText = (stage) => {
  const stages = {
    0: "Preparing...",
    1: "Analyzing your request...",
    2: "Generating code structure...",
    3: "Writing files...",
    4: "Installing dependencies...",
    5: "Finalizing project...",
  };
  return stages[stage] || "Working...";
};

const ImportingScreen = ({ stage, progress }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-md w-full space-y-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated spinner */}
          <motion.div
            className="relative w-16 h-16"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#374151" // gray-700
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0.1 }}
                animate={{ pathLength: 0.8 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatType: "reverse",
                }}
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <motion.h2
            className="text-xl font-medium text-gray-200 text-center"
            key={stage}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {getStageText(stage)}
          </motion.h2>

          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <motion.p
            className="text-sm text-gray-400 font-medium"
            key={progress}
          >
            {progress}% Complete
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default ImportingScreen;
