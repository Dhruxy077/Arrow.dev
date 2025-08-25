import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Eye, Play, Square } from 'lucide-react';

const CodeEditor = ({ code, onChange, serverUrl, isServerRunning }) => {
  const [activeTab, setActiveTab] = useState('code');

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded ${
              activeTab === 'code' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Code className="w-4 h-4" />
            Code
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded ${
              activeTab === 'preview' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
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
            defaultLanguage="javascript"
            value={code}
            onChange={onChange}
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