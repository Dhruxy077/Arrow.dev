import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Search
} from 'lucide-react';

const FileTree = ({ onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'client', 'server']));
  const [searchTerm, setSearchTerm] = useState('');

  const fileStructure = {
    name: 'root',
    type: 'folder',
    children: [
      {
        name: 'client',
        type: 'folder',
        children: [
          { name: 'App.jsx', type: 'file', path: 'client/src/App.jsx' },
          { name: 'index.css', type: 'file', path: 'client/src/index.css' },
          { name: 'main.jsx', type: 'file', path: 'client/src/main.jsx' },
          { name: '.env', type: 'file', path: 'client/.env' },
          { name: '.gitignore', type: 'file', path: 'client/.gitignore' },
          { name: 'eslint.config.js', type: 'file', path: 'client/eslint.config.js' },
          { name: 'index.html', type: 'file', path: 'client/index.html' },
          { name: 'package-lock.json', type: 'file', path: 'client/package-lock.json' },
          { name: 'package.json', type: 'file', path: 'client/package.json' },
          { name: 'vite.config.js', type: 'file', path: 'client/vite.config.js' }
        ]
      },
      {
        name: 'server',
        type: 'folder',
        children: [
          {
            name: 'routes',
            type: 'folder',
            children: [
              { name: 'GeminiAPI.js', type: 'file', path: 'server/routes/GeminiAPI.js' }
            ]
          },
          { name: '.env', type: 'file', path: 'server/.env' },
          { name: '.env.example', type: 'file', path: 'server/.env.example' },
          { name: '.gitignore', type: 'file', path: 'server/.gitignore' },
          { name: 'package-lock.json', type: 'file', path: 'server/package-lock.json' },
          { name: 'package.json', type: 'file', path: 'server/package.json' },
          { name: 'server.js', type: 'file', path: 'server/server.js' }
        ]
      },
      { name: '.gitignore', type: 'file', path: '.gitignore' },
      { name: 'package-lock.json', type: 'file', path: 'package-lock.json' },
      { name: 'package.json', type: 'file', path: 'package.json' },
      { name: 'README.md', type: 'file', path: 'README.md' }
    ]
  };

  const toggleFolder = (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop();
    switch (ext) {
      case 'js':
      case 'jsx':
        return '📄';
      case 'json':
        return '⚙️';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'md':
        return '📝';
      case 'env':
        return '🔐';
      default:
        return '📄';
    }
  };

  const renderFileTree = (node, path = '', level = 0) => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    
    if (node.type === 'folder') {
      return (
        <div key={currentPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer text-gray-300"
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => toggleFolder(currentPath)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-sm">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderFileTree(child, currentPath, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={currentPath}
          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer text-gray-300 ${
            selectedFile === node.path ? 'bg-gray-700' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 24}px` }}
          onClick={() => onFileSelect && onFileSelect(node.path)}
        >
          <File className="w-4 h-4 text-gray-400" />
          <span className="text-sm flex items-center gap-1">
            <span>{getFileIcon(node.name)}</span>
            {node.name}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-800 h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <File className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium text-sm">Files</span>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white text-sm pl-8 pr-3 py-1 rounded border-none outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderFileTree(fileStructure)}
      </div>
    </div>
  );
};

export default FileTree;