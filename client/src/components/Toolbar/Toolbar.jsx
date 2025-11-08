// client/src/components/Toolbar/Toolbar.jsx
import React from "react";
import { Eye, Code, Settings, RefreshCw, ExternalLink, Maximize2, Github, Rocket } from "lucide-react";

const Toolbar = ({
  activeView,
  onViewChange,
  selectedFile,
  files = {},
  onFileSelect,
  onRefresh,
  onOpenExternal,
  onFullscreen,
  onPublish,
  onGitHubExport,
}) => {
  const fileList = Object.keys(files);

  return (
    <div className="h-12 bg-[#1F2937] border-b border-[#374151] flex items-center justify-between px-4 gap-4">
      {/* Left Side - View Toggles & File Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewChange("preview")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            activeView === "preview"
              ? "bg-blue-600 text-white"
              : "text-[#9CA3AF] hover:bg-[#374151]"
          }`}
          title="Preview (Ctrl+2)"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          onClick={() => onViewChange("code")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            activeView === "code"
              ? "bg-blue-600 text-white"
              : "text-[#9CA3AF] hover:bg-[#374151]"
          }`}
          title="Code (Ctrl+1)"
        >
          <Code className="w-4 h-4" />
          Code
        </button>

        {activeView === "code" && fileList.length > 0 && (
          <>
            <div className="w-px h-6 bg-[#374151] mx-2" />
            <select
              value={selectedFile || ""}
              onChange={(e) => onFileSelect(e.target.value)}
              className="px-3 py-1.5 bg-[#0F1117] border border-[#374151] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fileList.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          onClick={onRefresh}
          className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#374151] rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        {activeView === "preview" && (
          <>
            <button
              onClick={onOpenExternal}
              className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#374151] rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onFullscreen}
              className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#374151] rounded transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={onGitHubExport}
          className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#374151] rounded transition-colors"
          title="Export to GitHub"
        >
          <Github className="w-4 h-4" />
        </button>
        <button
          onClick={onPublish}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors"
          title="Publish"
        >
          <Rocket className="w-4 h-4" />
          Publish
        </button>
        <button
          className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#374151] rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;

