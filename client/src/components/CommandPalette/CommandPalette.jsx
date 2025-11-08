// client/src/components/CommandPalette/CommandPalette.jsx
import React, { useState, useEffect, useRef } from "react";
import { Search, FileText, Code, Terminal, Download, Upload, Share2, Moon, Sun, FolderOpen, BookOpen } from "lucide-react";

const CommandPalette = ({ isOpen, onClose, onAction }) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    {
      id: "new-file",
      label: "New File",
      icon: FileText,
      shortcut: "Ctrl+N",
      action: () => onAction("new-file"),
    },
    {
      id: "toggle-code",
      label: "Toggle Code View",
      icon: Code,
      shortcut: "Ctrl+1",
      action: () => onAction("toggle-code"),
    },
    {
      id: "toggle-preview",
      label: "Toggle Preview",
      icon: Code,
      shortcut: "Ctrl+2",
      action: () => onAction("toggle-preview"),
    },
    {
      id: "toggle-terminal",
      label: "Toggle Terminal",
      icon: Terminal,
      shortcut: "Ctrl+`",
      action: () => onAction("toggle-terminal"),
    },
    {
      id: "export",
      label: "Export Project",
      icon: Download,
      shortcut: "Ctrl+E",
      action: () => onAction("export"),
    },
    {
      id: "import",
      label: "Import Project",
      icon: Upload,
      shortcut: "Ctrl+I",
      action: () => onAction("import"),
    },
    {
      id: "share",
      label: "Share Project",
      icon: Share2,
      shortcut: "Ctrl+S",
      action: () => onAction("share"),
    },
    {
      id: "toggle-theme",
      label: "Toggle Theme",
      icon: Moon,
      shortcut: "Ctrl+T",
      action: () => onAction("toggle-theme"),
    },
    {
      id: "toggle-projects",
      label: "Toggle Projects List",
      icon: FolderOpen,
      shortcut: "Ctrl+P",
      action: () => onAction("toggle-projects"),
    },
    {
      id: "toggle-snippets",
      label: "Toggle Code Snippets",
      icon: BookOpen,
      shortcut: "Ctrl+Shift+S",
      action: () => onAction("toggle-snippets"),
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-neutral-400 outline-none"
          />
          <kbd className="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded">
            ESC
          </kbd>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-400">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-800 transition-colors ${
                    index === selectedIndex ? "bg-neutral-800" : ""
                  }`}
                >
                  <Icon className="w-5 h-5 text-neutral-400" />
                  <span className="flex-1 text-white">{cmd.label}</span>
                  <kbd className="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded">
                    {cmd.shortcut}
                  </kbd>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

