import React, {
  lazy,
  Suspense,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Loader2, Maximize2, Minimize2, X } from "lucide-react";
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
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
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
      <div className="bg-[#1F2937] rounded-lg shadow-lg w-96 border border-[#374151]">
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
          className="w-full bg-[#1F2937] text-white rounded-t-lg px-4 py-3 border-b border-[#374151] focus:outline-none"
        />
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-[#9CA3AF] text-center text-sm">
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
                    : "text-[#D1D5DB] hover:bg-[#374151]"
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

const CodeEditor = ({
  fileContent,
  fileName,
  onChange,
  hasUnsavedChanges,
  files = {},
  onFileSelect,
  selectedFile,
  onFileClose,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [openTabs, setOpenTabs] = useState(() => {
    // Initialize with current file if available
    return fileName ? [fileName] : [];
  });
  const [editorContent, setEditorContent] = useState({}); // Track content per tab
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Update tabs when selectedFile changes
  useEffect(() => {
    if (selectedFile && !openTabs.includes(selectedFile)) {
      setOpenTabs((prev) => [...prev, selectedFile]);
      // Initialize content for new tab
      if (files[selectedFile] !== undefined) {
        setEditorContent((prev) => ({
          ...prev,
          [selectedFile]: files[selectedFile] || "",
        }));
      }
    }
  }, [selectedFile, files, openTabs]);

  // Sync editor content with files prop
  useEffect(() => {
    if (fileName && files[fileName] !== undefined) {
      setEditorContent((prev) => ({
        ...prev,
        [fileName]: files[fileName] || "",
      }));
    }
  }, [fileName, files]);

  const handleTabClose = (e, tabFile) => {
    e.stopPropagation();
    if (openTabs.length === 1) {
      // Don't close the last tab
      return;
    }
    setOpenTabs((prev) => prev.filter((f) => f !== tabFile));
    if (tabFile === selectedFile) {
      // Switch to another tab
      const remainingTabs = openTabs.filter((f) => f !== tabFile);
      if (onFileSelect && remainingTabs.length > 0) {
        onFileSelect(remainingTabs[remainingTabs.length - 1]);
      }
    }
    if (onFileClose) {
      onFileClose(tabFile);
    }
  };

  // Memoize code change handler for performance
  const handleCodeChange = useCallback(
    (value) => {
      if (onChange && fileName) {
        // Update local content state
        setEditorContent((prev) => ({
          ...prev,
          [fileName]: value || "",
        }));
        // Call parent onChange
        onChange(value, fileName);
      }
    },
    [fileName, onChange]
  );

  // Get current file content (from state or files prop)
  const getCurrentContent = () => {
    if (fileName && editorContent[fileName] !== undefined) {
      return editorContent[fileName];
    }
    return fileContent || "";
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
          editorRef.current
            .getAction("editor.action.startFindReplaceAction")
            .run();
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
    <div className="flex flex-col h-full bg-[#0F1117]">
      {/* Tabs */}
      {openTabs.length > 0 && (
        <div className="shrink-0 flex items-center gap-1 px-2 pt-2 border-b border-[#1F2937] overflow-x-auto">
          {openTabs.map((tabFile) => {
            const isActive = tabFile === selectedFile;
            const tabHasUnsaved = hasUnsavedChanges && isActive;
            return (
              <div
                key={tabFile}
                onClick={() => onFileSelect && onFileSelect(tabFile)}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors border-b-2 ${
                  isActive
                    ? "bg-[#1F2937] border-blue-500 text-white"
                    : "border-transparent text-[#9CA3AF] hover:text-[#D1D5DB] hover:bg-[#1F2937]/50"
                }`}
              >
                <span className="truncate max-w-[200px]" title={tabFile}>
                  {tabFile.split("/").pop()}
                </span>
                {tabHasUnsaved && (
                  <div
                    className="w-2 h-2 rounded-full bg-orange-400 shrink-0"
                    title="Unsaved changes"
                  />
                )}
                {openTabs.length > 1 && (
                  <button
                    onClick={(e) => handleTabClose(e, tabFile)}
                    className="p-0.5 hover:bg-[#374151] rounded shrink-0"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Header */}
      <div className="shrink-0 flex items-center justify-between p-3 border-b border-[#1F2937] h-14">
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
          className="p-2 hover:bg-[#1F2937] rounded transition-colors"
          title="Toggle Full Screen (Double-click filename or press Ctrl+Shift+P)"
        >
          {isFullScreen ? (
            <Minimize2 className="w-4 h-4 text-[#9CA3AF]" />
          ) : (
            <Maximize2 className="w-4 h-4 text-[#9CA3AF]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-[#9CA3AF]">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading Editor...
            </div>
          }
        >
          <MonacoEditor
            height="100%"
            theme="vs-dark"
            language={getLanguageFromFile(fileName)}
            value={getCurrentContent()}
            onChange={handleCodeChange}
            key={fileName} // Force remount when file changes
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;

              // Configure IntelliSense for JavaScript/TypeScript
              const compilerOptions = {
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                allowNonTsExtensions: true,
                moduleResolution:
                  monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                module: monaco.languages.typescript.ModuleKind.ESNext,
                noEmit: true,
                esModuleInterop: true,
                jsx: monaco.languages.typescript.JsxEmit.React,
                reactNamespace: "React",
                allowJs: true,
                checkJs: false,
                typeRoots: ["node_modules/@types"],
                lib: ["ES2020", "DOM", "DOM.Iterable"],
              };

              monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
                compilerOptions
              );
              monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
                {
                  ...compilerOptions,
                  jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
                }
              );

              // Add React types for better IntelliSense
              monaco.languages.typescript.javascriptDefaults.setExtraLibs([
                {
                  filePath: "node_modules/@types/react/index.d.ts",
                  content: `
                    declare namespace React {
                      export = React;
                      export as namespace React;
                    }
                    declare var React: any;
                  `,
                },
                {
                  filePath: "node_modules/@types/react-dom/index.d.ts",
                  content: `declare var ReactDOM: any;`,
                },
              ]);

              // Configure editor shortcuts
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                () => {
                  // Format document on save (save is handled by onChange)
                  editor.getAction("editor.action.formatDocument").run();
                }
              );

              // Toggle comment (Ctrl+/ or Cmd+/)
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
                () => {
                  editor.getAction("editor.action.commentLine").run();
                }
              );

              // Go to line (Ctrl+G or Cmd+G)
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
                () => {
                  editor.getAction("editor.action.gotoLine").run();
                }
              );

              // Word wrap toggle
              editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
                const current = editor.getOption(
                  monaco.editor.EditorOption.wordWrap
                );
                editor.updateOptions({
                  wordWrap: current === "off" ? "on" : "off",
                });
              });

              // Line numbers toggle
              editor.addCommand(
                monaco.KeyMod.CtrlCmd |
                  monaco.KeyMod.Shift |
                  monaco.KeyCode.KeyL,
                () => {
                  const current = editor.getOption(
                    monaco.editor.EditorOption.lineNumbers
                  );
                  editor.updateOptions({
                    lineNumbers: current === "off" ? "on" : "off",
                  });
                }
              );
            }}
            options={{
              fontSize: 14,
              lineHeight: 22,
              minimap: { enabled: true, side: "right", size: "fit" },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
              fontLigatures: true,
              fontWeight: "400",
              padding: { top: 16, bottom: 16 },
              formatOnPaste: true,
              formatOnType: true,
              wordWrap: "off",
              wrappingIndent: "indent",
              lineNumbers: "on",
              lineNumbersMinChars: 3,
              renderLineHighlight: "all",
              cursorStyle: "line",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              mouseWheelZoom: true,
              multiCursorModifier: "ctrlCmd",
              quickSuggestions: {
                other: true,
                comments: false,
                strings: true,
              },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              wordBasedSuggestions: "matchingDocuments",
              suggestSelection: "first",
              snippetSuggestions: "top",
              parameterHints: {
                enabled: true,
                cycle: true,
              },
              hover: {
                enabled: true,
                delay: 300,
              },
              colorDecorators: true,
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                bracketPairs: true,
                indentation: true,
                highlightActiveIndentation: true,
              },
              folding: true,
              foldingStrategy: "auto",
              showFoldingControls: "always",
              unfoldOnClickAfterEndOfLine: true,
              matchBrackets: "always",
              renderWhitespace: "selection",
              renderControlCharacters: false,
              renderIndentGuides: true,
              highlightActiveIndentGuide: true,
              links: true,
              // colorDecorators: true,
              codeLens: true,
              codeActionsOnSave: {
                "source.fixAll": "explicit",
                "source.organizeImports": "explicit",
                "source.removeUnusedImports": "explicit",
              },
              // Better bracket matching

              autoClosingBrackets: "always",
              autoClosingQuotes: "always",
              autoIndent: "full",
              // Better suggestions
              accessibilitySupport: "auto",
              accessibilityPageSize: 10,
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 12,
                horizontalScrollbarSize: 12,
              },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
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
      <div className="fixed inset-0 z-50 bg-[#0F1117]">{editorContainer}</div>
    );
  }

  return editorContainer;
};

export default CodeEditor;
