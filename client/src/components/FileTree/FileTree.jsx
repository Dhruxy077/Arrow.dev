import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Search
} from 'lucide-react';

const FileTree = ({ onFileSelect, selectedFile, files = {} }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'client', 'server']));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileStructure, setFileStructure] = useState(null);

  // Convert files object to tree structure
  useEffect(() => {
    if (Object.keys(files).length > 0) {
      const structure = {
        name: 'project',
        type: 'folder',
        children: Object.keys(files).map(fileName => ({
          name: fileName,
          type: 'file',
          path: fileName
        }))
      };
      setFileStructure(structure);
      setExpandedFolders(new Set(['project']));
    } else {
      // Default structure when no files
      setFileStructure({
        name: 'project',
        type: 'folder',
        children: [
          { name: 'index.html', type: 'file', path: 'index.html' },
          { name: 'style.css', type: 'file', path: 'style.css' },
          { name: 'script.js', type: 'file', path: 'script.js' }
        ]
      });
      setExpandedFolders(new Set(['project']));
    }
  }, [files]);

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
        return '🟨';
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'json':
        return '🔧';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'md':
        return '📝';
      case 'env':
        return '🔐';
      case 'py':
        return '🐍';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c':
        return '⚡';
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
        {fileStructure && renderFileTree(fileStructure)}
      </div>
    </div>
  );
};

export default FileTree;