import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const developmentTips = [
  "Did you know? Arrow.dev runs entirely in your browser!",
  "Tip: You can edit the generated code in real-time!",
  "Fun fact: WebContainer uses Node.js in the browser!",
  "Pro tip: Use the terminal to run npm commands!",
  "Remember: All your code stays in your browser!",
  "Cool feature: The preview updates as you code!",
  "Did you know? You can create full-stack apps!",
  "Tip: Ask the AI to modify existing code!",
  "Fun fact: No server setup required!",
  "Pro tip: Use Ctrl+T to open a new terminal!",
];

const getStageText = (stage) => {
  const stages = {
    0: "Preparing...",
    1: "Analyzing your request...",
    2: "Generating code structure...",
    3: "Creating components...",
    4: "Setting up configuration...",
    5: "Finalizing project...",
  };
  return stages[stage] || "Working...";
};

const GeneratingScreen = ({ stage, progress, onCancel }) => {
  const [currentTip, setCurrentTip] = useState("");

  useEffect(() => {
    const randomTip =
      developmentTips[Math.floor(Math.random() * developmentTips.length)];
    setCurrentTip(randomTip);

    const interval = setInterval(() => {
      const newTip =
        developmentTips[Math.floor(Math.random() * developmentTips.length)];
      setCurrentTip(newTip);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated spinner */}
          <motion.div
            className="relative w-20 h-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#374151"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
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

          {/* Status text */}
          <motion.h2
            className="text-2xl font-bold text-white text-center"
            key={stage}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {getStageText(stage)}
          </motion.h2>

          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Progress percentage */}
          <motion.p
            className="text-slate-300 font-medium"
            key={progress}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {progress}% Complete
          </motion.p>

          {/* Development tip */}
          <motion.p
            className="text-sm text-slate-400 text-center italic"
            key={currentTip}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            "{currentTip}"
          </motion.p>

          {/* Cancel button */}
          <motion.button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default GeneratingScreen;
