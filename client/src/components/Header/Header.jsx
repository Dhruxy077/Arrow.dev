// client/components/Header/Header.jsx
import React, { useState } from "react";
import { Upload, GitBranch, Share2, Check, Loader2, AlertCircle, Download, Menu } from "lucide-react";
import { projectService } from "../../services/projectService";
import { exportProjectAsZip } from "../../utils/projectExport";
import { showSuccessNotification, showErrorNotification } from "../../services/api";

const Header = ({ projectId, projectName, saveStatus, files = {}, onToggleSidebar }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!projectId) {
      showErrorNotification("Project must be saved before sharing");
      return;
    }

    setIsSharing(true);
    try {
      const { shareToken, error } = await projectService.shareProject(projectId);
      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      showSuccessNotification("Share link copied to clipboard!");
    } catch (error) {
      console.error("Share error:", error);
      showErrorNotification("Failed to create share link", [error.message]);
    } finally {
      setIsSharing(false);
    }
  };

  const handleExport = async () => {
    if (Object.keys(files).length === 0) {
      showErrorNotification("No files to export");
      return;
    }

    try {
      // Export as JSON for easy import
      const projectData = {
        name: projectName || "Untitled Project",
        files,
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
      };
      
      const jsonStr = JSON.stringify(projectData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName || "project"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccessNotification("Project exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      showErrorNotification("Failed to export project", [error.message]);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const projectData = JSON.parse(text);
        
        if (!projectData.files || typeof projectData.files !== "object") {
          throw new Error("Invalid project file format");
        }

        // Trigger import via custom event
        window.dispatchEvent(
          new CustomEvent("importProject", { detail: projectData })
        );
        
        showSuccessNotification("Project imported successfully!");
      } catch (error) {
        console.error("Import error:", error);
        showErrorNotification("Failed to import project", [error.message]);
      }
    };
    input.click();
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case "saving":
        return <Loader2 className="w-3 h-3 animate-spin text-blue-400" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      case "saved":
        return <Check className="w-3 h-3 text-green-400" />;
      default:
        return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "error":
        return "Save failed";
      case "saved":
        return "Saved";
      default:
        return "";
    }
  };

  return (
    <header className="shrink-0 h-14 flex items-center justify-between px-4 bg-[#0F1117] border-b border-[#1F2937] relative z-20">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-[#A1A1AA] hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-[#A1A1AA]" />
          <span className="text-white font-medium">Arrow.dev</span>
        </div>
        {projectName && (
          <div className="text-sm text-[#A1A1AA] truncate max-w-xs">
            {projectName}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {saveStatus && (
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
            {getSaveStatusIcon()}
            <span>{getSaveStatusText()}</span>
          </div>
        )}
        <button
          onClick={handleImport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#1F2937] text-[#D1D5DB] rounded-md hover:bg-[#374151] transition-colors"
          title="Import project from JSON"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        {Object.keys(files).length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#1F2937] text-[#D1D5DB] rounded-md hover:bg-[#374151] transition-colors"
            title="Export project as JSON"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
        {projectId && (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Share project"
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Share
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
