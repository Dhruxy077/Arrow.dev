import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const iconClass = "w-4 h-4";

  switch (extension) {
    case "jsx":
    case "tsx":
      return <File className={`${iconClass} text-blue-400`} />;
    case "js":
    case "ts":
      return <File className={`${iconClass} text-yellow-400`} />;
    case "css":
    case "scss":
    case "sass":
      return <File className={`${iconClass} text-pink-400`} />;
    case "html":
      return <File className={`${iconClass} text-orange-400`} />;
    case "json":
      return <File className={`${iconClass} text-green-400`} />;
    case "md":
      return <File className={`${iconClass} text-blue-300`} />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return <File className={`${iconClass} text-purple-400`} />;
    default:
      return <File className={`${iconClass} text-gray-400`} />;
  }
};

const buildFileTree = (files) => {
  const root = { name: "root", type: "folder", children: {}, path: "" };

  if (!files || typeof files !== "object") {
    return root;
  }

  Object.keys(files).forEach((filePath) => {
    // Skip empty paths
    if (!filePath || filePath.trim() === "") return;

    let current = root;
    const pathParts = filePath.split("/").filter((part) => part.trim() !== "");

    pathParts.forEach((part, index) => {
      if (!current.children) {
        current.children = {};
      }

      const isFile = index === pathParts.length - 1;
      const currentPath = pathParts.slice(0, index + 1).join("/");

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          type: isFile ? "file" : "folder",
          path: isFile ? filePath : currentPath,
          children: isFile ? undefined : {},
          fullPath: filePath, // Keep original full path for files
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

const FileTree = ({ onFileSelect, selectedFile, files = {} }) => {
  const [tree, setTree] = useState(() => buildFileTree(files));
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root"]));

  useEffect(() => {
    const newTree = buildFileTree(files);
    setTree(newTree);

    // Auto-expand common directories
    const commonDirs = ["root", "src", "public", "components"];
    const autoExpand = new Set();

    // Add root
    autoExpand.add("root");

    // Auto-expand first level directories
    if (newTree.children) {
      Object.keys(newTree.children).forEach((key) => {
        if (newTree.children[key].type === "folder") {
          autoExpand.add(key);
          // Also expand common subdirectories
          if (commonDirs.includes(key) || key === "src") {
            const childPath = key;
            autoExpand.add(childPath);

            // Auto-expand src subdirectories
            if (newTree.children[key].children) {
              Object.keys(newTree.children[key].children).forEach((subKey) => {
                if (newTree.children[key].children[subKey].type === "folder") {
                  autoExpand.add(`${childPath}/${subKey}`);
                }
              });
            }
          }
        }
      });
    }

    setExpandedFolders(autoExpand);
  }, [files]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const renderNode = (node, currentPath = "", depth = 0) => {
    const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;

    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(nodePath);
      const hasChildren =
        node.children && Object.keys(node.children).length > 0;

      return (
        <div key={nodePath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer text-gray-300 select-none"
            onClick={() => toggleFolder(nodePath)}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren && (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
              </>
            )}
            {!hasChildren && <div className="w-4 h-4 flex-shrink-0" />}

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
            )}
            <span className="text-sm truncate">{node.name}</span>
          </div>

          {isExpanded && hasChildren && (
            <div>
              {Object.values(node.children)
                .sort((a, b) => {
                  // Folders first, then files, then alphabetical
                  if (a.type !== b.type) {
                    return a.type === "folder" ? -1 : 1;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((child) => renderNode(child, nodePath, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // It's a file
    const isSelected =
      selectedFile === node.fullPath || selectedFile === node.path;

    return (
      <div
        key={node.fullPath || node.path}
        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer text-gray-300 select-none ${
          isSelected ? "bg-gray-600" : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 32}px` }}
        onClick={() => onFileSelect(node.fullPath || node.path)}
        title={node.fullPath || node.path}
      >
        {getFileIcon(node.name)}
        <span className="text-sm truncate">{node.name}</span>
      </div>
    );
  };

  const hasFiles = tree.children && Object.keys(tree.children).length > 0;

  return (
    <div className="bg-gray-800 h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 text-white text-sm font-medium">
        Files
      </div>
      <div className="flex-1 overflow-y-auto">
        {hasFiles ? (
          <div className="py-1">
            {Object.values(tree.children)
              .sort((a, b) => {
                if (a.type !== b.type) {
                  return a.type === "folder" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
              })
              .map((child) => renderNode(child, "", 0))}
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-400 text-center">
            <div className="mb-2">No files yet</div>
            <div className="text-xs text-gray-500">
              Ask the AI to build something!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileTree;
