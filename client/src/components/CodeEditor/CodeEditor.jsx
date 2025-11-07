import React, { lazy, Suspense, useState, useRef, useEffect } from "react";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const getLanguageFromFile = (fileName) => {
  if (!fileName) return "plaintext";
  const ext = fileName.split(".").pop();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "py":
      return "python";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
};

const CommandPalette = ({ isOpen, onClose, commands }) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        Math.min(prev + 1, filtered.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-neutral-800 rounded-lg shadow-lg w-96 border border-neutral-700">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a command..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-neutral-800 text-white rounded-t-lg px-4 py-3 border-b border-neutral-700 focus:outline-none"
        />
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-neutral-500 text-center text-sm">
              No commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  idx === selectedIndex
                    ? "bg-blue-600 text-white"
                    : "text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                <div className="font-medium">{cmd.label}</div>
                {cmd.description && (
                  <div className="text-xs opacity-75">{cmd.description}</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const CodeEditor = ({ fileContent, fileName, onChange, hasUnsavedChanges }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const editorRef = useRef(null);

  const handleCodeChange = (value) => {
    if (onChange) {
      onChange(value, fileName);
    }
  };

  const commands = [
    {
      id: "format",
      label: "Format Document",
      description: "Format the current file",
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction("editor.action.formatDocument").run();
        }
      },
    },
    {
      id: "find",
      label: "Find",
      description: "Open find dialog (Ctrl+F)",
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction("actions.find").run();
        }
      },
    },
    {
      id: "replace",
      label: "Replace",
      description: "Open replace dialog (Ctrl+H)",
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction("editor.action.startFindReplaceAction").run();
        }
      },
    },
    {
      id: "fullscreen",
      label: isFullScreen ? "Exit Full Screen" : "Enter Full Screen",
      description: "Toggle full screen mode",
      action: () => setIsFullScreen(!isFullScreen),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const editorContainer = (
    <div className="flex flex-col h-full bg-neutral-900">
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-neutral-800 h-14">
        <div className="flex items-center gap-2">
          <div className="text-sm text-white font-medium" title={fileName}>
            {fileName || "No file selected"}
          </div>
          {hasUnsavedChanges && (
            <div
              className="w-2 h-2 rounded-full bg-orange-400"
              title="Unsaved changes"
            />
          )}
        </div>
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2 hover:bg-neutral-800 rounded transition-colors"
          title="Toggle Full Screen (Double-click filename or press Ctrl+Shift+P)"
        >
          {isFullScreen ? (
            <Minimize2 className="w-4 h-4 text-neutral-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-neutral-400" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading Editor...
            </div>
          }
        >
          <MonacoEditor
            height="100%"
            theme="vs-dark"
            language={getLanguageFromFile(fileName)}
            value={fileContent}
            onChange={handleCodeChange}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              fontFamily: "Menlo, Monaco, 'Courier New', monospace",
              padding: { top: 16 },
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </Suspense>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-900">
        {editorContainer}
      </div>
    );
  }

  return editorContainer;
};

export default CodeEditor;
