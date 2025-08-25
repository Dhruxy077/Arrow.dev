import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Eye, Play, Square } from 'lucide-react';

const CodeEditor = ({ code, onChange, serverUrl, isServerRunning, selectedFile, files = {} }) => {
  const [activeTab, setActiveTab] = useState('code');
  const [currentCode, setCurrentCode] = useState(code);

  // Update code when selectedFile changes
  useEffect(() => {
    if (selectedFile && files[selectedFile]) {
      setCurrentCode(files[selectedFile].content || '');
    } else {
      setCurrentCode(code);
    }
  }, [selectedFile, files, code]);

  const handleCodeChange = (value) => {
    setCurrentCode(value || '');
    if (onChange) {
      onChange(value, selectedFile);
    }
  };

  const getLanguageFromFile = (fileName) => {
    if (!fileName) return 'javascript';
    const ext = fileName.split('.').pop();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'cpp';
      default:
        return 'javascript';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2 bg-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded ${
              activeTab === 'code' 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            <Code className="w-4 h-4" />
            Code
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded ${
              activeTab === 'preview' 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
        
        <div className="text-sm text-gray-400">
          {selectedFile && (
            <span>{selectedFile}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${isServerRunning ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isServerRunning ? 'Server running' : 'Server stopped'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        {activeTab === 'code' && (
          <Editor
            height="100%"
            theme="vs-dark"
            language={getLanguageFromFile(selectedFile)}
            value={currentCode}
            onChange={handleCodeChange}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
            }}
          />
        )}
        
        {activeTab === 'preview' && (
          <div className="w-full h-full bg-white">
            {serverUrl ? (
              <iframe
                src={serverUrl}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <p>Waiting for server to start...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;