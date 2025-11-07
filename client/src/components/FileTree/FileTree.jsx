// client/components/FileTree/FileTree.jsx
import React, { useState, useEffect, memo, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
} from "lucide-react";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";

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

// --- TreeNode component with context menu and drag support ---
const TreeNode = memo(
  ({
    node,
    depth = 0,
    expandedFolders,
    onToggleFolder,
    onFileSelect,
    selectedFile,
    onContextMenu,
  }) => {
    const nodePath = node.path;
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/json", JSON.stringify(node));
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (node.type === "folder") {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(nodePath);
      const hasChildren =
        node.children && Object.keys(node.children).length > 0;

      return (
        <div key={nodePath}>
          <div
            className={`flex items-center gap-1.5 cursor-pointer py-1.5 text-neutral-300 hover:bg-neutral-800 transition-colors ${
              isDragOver ? "bg-neutral-700" : ""
            }`}
            onClick={() => onToggleFolder(nodePath)}
            onContextMenu={(e) => onContextMenu(e, nodePath)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            draggable
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" />
              )
            ) : (
              <div className="w-4 h-4 shrink-0" />
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
                    onContextMenu={onContextMenu}
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
        className={`flex items-center gap-1.5 cursor-pointer py-1.5 transition-colors ${
          isSelected
            ? "bg-neutral-700 text-white"
            : "text-neutral-300 hover:bg-neutral-800"
        } ${isDragOver ? "bg-neutral-700" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 28}px` }}
        onClick={() => onFileSelect(node.path)}
        onContextMenu={(e) => onContextMenu(e, node.path)}
        onDragStart={handleDragStart}
        draggable
        title={node.path}
      >
        <FileIcon fileName={node.name} />
        <span className="text-sm truncate">{node.name}</span>
      </div>
    );
  }
);
TreeNode.displayName = "TreeNode";

const ContextMenu = memo(
  ({ x, y, onNewFile, onNewFolder, onRename, onDelete, onClose }) => {
    useEffect(() => {
      const handleClickOutside = () => onClose();
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [onClose]);

    return (
      <div
        className="fixed bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
        style={{ top: y, left: x }}
      >
        <button
          onClick={onNewFile}
          className="w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New File
        </button>
        <button
          onClick={onNewFolder}
          className="w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Folder
        </button>
        <button
          onClick={onRename}
          className="w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Rename
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    );
  }
);
ContextMenu.displayName = "ContextMenu";

const filterFileTree = (tree, searchTerm) => {
  if (!searchTerm.trim()) return tree;

  const term = searchTerm.toLowerCase();
  const filtered = { ...tree, children: {} };

  const traverse = (node) => {
    if (node.type === "folder" && node.children) {
      const filteredChildren = {};
      Object.entries(node.children).forEach(([key, child]) => {
        if (child.name.toLowerCase().includes(term)) {
          filteredChildren[key] = child;
        } else if (child.type === "folder" && child.children) {
          const result = traverse(child);
          if (Object.keys(result.children).length > 0) {
            filteredChildren[key] = result;
          }
        }
      });
      return { ...node, children: filteredChildren };
    }
    return node;
  };

  if (tree.children) {
    Object.entries(tree.children).forEach(([key, child]) => {
      if (child.name.toLowerCase().includes(term)) {
        filtered.children[key] = child;
      } else if (child.type === "folder" && child.children) {
        const result = traverse(child);
        if (Object.keys(result.children).length > 0) {
          filtered.children[key] = result;
        }
      }
    });
  }

  return filtered;
};

// --- Main FileTree component with search, context menu, and confirmations ---
const FileTree = ({ onFileSelect, selectedFile, files = {} }) => {
  const [tree, setTree] = useState(() => buildFileTree(files));
  const [expandedFolders, setExpandedFolders] = useState(new Set(["src"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedFile, setDraggedFile] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    filePath: null,
  });

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

  const handleContextMenu = (e, filePath) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      filePath,
    });
  };

  const filteredTree = filterFileTree(tree, searchTerm);
  const hasFiles = tree.children && Object.keys(tree.children).length > 0;

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-neutral-800 h-14">
        <h3 className="text-sm font-medium">Files</h3>
      </div>

      <div className="flex-shrink-0 p-2 border-b border-neutral-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-800 text-white rounded px-2.5 py-1.5 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hasFiles ? (
          <div className="py-1">
            {Object.values(filteredTree.children)
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
                  onContextMenu={handleContextMenu}
                />
              ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-neutral-500 text-center">
            {searchTerm ? "No files match your search." : "No files yet."}
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onNewFile={() => {
            console.log("New file in:", contextMenu.filePath);
            setContextMenu(null);
          }}
          onNewFolder={() => {
            console.log("New folder in:", contextMenu.filePath);
            setContextMenu(null);
          }}
          onRename={() => {
            console.log("Rename:", contextMenu.filePath);
            setContextMenu(null);
          }}
          onDelete={() => {
            setConfirmDialog({
              isOpen: true,
              type: "delete",
              filePath: contextMenu.filePath,
            });
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete File?"
        message={`Are you sure you want to delete "${confirmDialog.filePath}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={() => {
          console.log("Confirmed delete:", confirmDialog.filePath);
          setConfirmDialog({ isOpen: false, type: null, filePath: null });
        }}
        onCancel={() => {
          setConfirmDialog({ isOpen: false, type: null, filePath: null });
        }}
      />
    </div>
  );
};

export default memo(FileTree);
