// client/components/CodeEditor.jsx
import React, { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
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

const CodeEditor = ({ fileContent, fileName, onChange }) => {
  const handleCodeChange = (value) => {
    if (onChange) {
      onChange(value, fileName);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-neutral-800 h-14">
        <div className="text-sm text-white font-medium" title={fileName}>
          {fileName || "No file selected"}
        </div>
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
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              fontFamily: "Menlo, Monaco, 'Courier New', monospace",
              padding: { top: 16 },
            }}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default CodeEditor;
