// client/components/FileTree/FileTree.jsx
import React, { useState, useEffect, memo, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";

// ... (FileIcon component is unchanged) ...
const FileIcon = memo(({ fileName }) => {
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
      return <File className={`${iconClass} text-pink-400`} />;
    case "html":
      return <File className={`${iconClass} text-orange-400`} />;
    case "json":
      return <File className={`${iconClass} text-green-400`} />;
    case "md":
      return <File className={`${iconClass} text-blue-300`} />;
    default:
      return <File className={`${iconClass} text-gray-400`} />;
  }
});
FileIcon.displayName = "FileIcon";
// ... (buildFileTree function is unchanged) ...
const buildFileTree = (files) => {
  const root = { name: "root", type: "folder", children: {}, path: "" };
  if (!files || typeof files !== "object") {
    return root;
  }
  Object.keys(files).forEach((filePath) => {
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
          fullPath: filePath,
        };
      }
      current = current.children[part];
    });
  });
  return root;
};

// --- TreeNode component with updated styling ---
const TreeNode = memo(
  ({
    node,
    depth = 0,
    expandedFolders,
    onToggleFolder,
    onFileSelect,
    selectedFile,
  }) => {
    const nodePath = node.path;

    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(nodePath);
      const hasChildren =
        node.children && Object.keys(node.children).length > 0;

      return (
        <div key={nodePath}>
          <div
            className="flex items-center gap-1.5 cursor-pointer py-1.5 text-neutral-300 hover:bg-neutral-800"
            onClick={() => onToggleFolder(nodePath)}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" />
              )
            ) : (
              <div className="w-4 h-4 shrink-0" /> // spacer
            )}
            <span className="text-sm truncate">{node.name}</span>
          </div>

          {isExpanded && hasChildren && (
            <div>
              {Object.values(node.children)
                .sort((a, b) => {
                  if (a.type !== b.type) {
                    return a.type === "folder" ? -1 : 1;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((child) => (
                  <TreeNode
                    key={child.fullPath || child.path}
                    node={child}
                    depth={depth + 1}
                    expandedFolders={expandedFolders}
                    onToggleFolder={onToggleFolder}
                    onFileSelect={onFileSelect}
                    selectedFile={selectedFile}
                  />
                ))}
            </div>
          )}
        </div>
      );
    }

    // It's a file
    const isSelected = selectedFile === node.path;

    return (
      <div
        key={node.path}
        className={`flex items-center gap-1.5 cursor-pointer py-1.5 ${
          isSelected
            ? "bg-neutral-700 text-white"
            : "text-neutral-300 hover:bg-neutral-800"
        }`}
        style={{ paddingLeft: `${depth * 16 + 28}px` }} // 16*depth + 8(padding) + 16(icon)
        onClick={() => onFileSelect(node.path)}
        title={node.path}
      >
        <FileIcon fileName={node.name} />
        <span className="text-sm truncate">{node.name}</span>
      </div>
    );
  }
);
TreeNode.displayName = "TreeNode";

// --- Main FileTree component with updated styling ---
const FileTree = ({ onFileSelect, selectedFile, files = {} }) => {
  const [tree, setTree] = useState(() => buildFileTree(files));
  const [expandedFolders, setExpandedFolders] = useState(new Set(["src"]));

  useEffect(() => {
    const newTree = buildFileTree(files);
    setTree(newTree);

    // Auto-expand src and root level folders
    const autoExpand = new Set();
    if (newTree.children) {
      Object.values(newTree.children).forEach((child) => {
        if (child.type === "folder") {
          autoExpand.add(child.path);
        }
      });
    }
    setExpandedFolders(autoExpand);
  }, [files]);

  const toggleFolder = useCallback((folderPath) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  }, []);

  const hasFiles = tree.children && Object.keys(tree.children).length > 0;

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-neutral-800 h-14">
        <h3 className="text-sm font-medium">Files</h3>
        {/* Add file/folder controls here later */}
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
              .map((child) => (
                <TreeNode
                  key={child.fullPath || child.path}
                  node={child}
                  depth={0}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                />
              ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-neutral-500 text-center">
            No files yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(FileTree);
