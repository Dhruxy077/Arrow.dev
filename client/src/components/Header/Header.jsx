// client/components/Header/Header.jsx
import React from "react";
import { Upload, GitBranch } from "lucide-react";

const Header = ({ onPublish, serverUrl, isServerRunning }) => {
  return (
    <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 bg-neutral-900 border-b border-neutral-800">
      <div className="flex items-center gap-4">
        {/* You can add your logo here */}
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-neutral-400" />
          <span className="text-white font-medium">Arrow.dev</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <div
            className={`w-2 h-2 rounded-full ${
              isServerRunning ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span>{isServerRunning ? "Server Ready" : "Server Stopped"}</span>
        </div>
        <button
          onClick={onPublish}
          disabled={!isServerRunning}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white text-black rounded-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          Publish
        </button>
      </div>
    </header>
  );
};

export default Header;
