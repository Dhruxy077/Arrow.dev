// client/src/components/FileTree/FileTree.jsx
import React, { useState, useEffect, memo, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
} from "lucide-react";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";

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
      return <File className={`${iconClass} text-[#9CA3AF]`} />;
  }
});
FileIcon.displayName = "FileIcon";

const buildFileTree = (files) => {
  const root = { name: "root", type: "folder", children: {}, path: "" };
  if (!files || typeof files !== "object") return root;
  Object.keys(files).forEach((filePath) => {
    if (!filePath?.trim()) return;
    let current = root;
    const pathParts = filePath.split("/").filter(Boolean);
    pathParts.forEach((part, index) => {
      if (!current.children) current.children = {};
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

    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(nodePath);
      const hasChildren =
        node.children && Object.keys(node.children).length > 0;

      return (
        <div key={nodePath}>
          <div
            className="flex items-center gap-1.5 cursor-pointer py-1.5 text-[#D1D5DB] hover:bg-[#1F2937] transition-colors"
            onClick={() => onToggleFolder(nodePath)}
            onContextMenu={(e) => onContextMenu(e, nodePath)}
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
                .sort((a, b) =>
                  a.type !== b.type
                    ? a.type === "folder"
                      ? -1
                      : 1
                    : a.name.localeCompare(b.name)
                )
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

    const isSelected = selectedFile === node.path;
    return (
      <div
        key={node.path}
        className={`flex items-center gap-1.5 cursor-pointer py-1.5 transition-colors ${
          isSelected
            ? "bg-[#374151] text-white"
            : "text-[#D1D5DB] hover:bg-[#1F2937]"
        }`}
        style={{ paddingLeft: `${depth * 16 + 28}px` }}
        onClick={() => onFileSelect(node.path)}
        onContextMenu={(e) => onContextMenu(e, node.path)}
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
        className="fixed bg-[#1F2937] border border-[#374151] rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
        style={{ top: y, left: x }}
      >
        <button
          onClick={onNewFile}
          className="w-full px-4 py-2 text-sm text-[#D1D5DB] hover:bg-[#374151] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New File
        </button>
        <button
          onClick={onNewFolder}
          className="w-full px-4 py-2 text-sm text-[#D1D5DB] hover:bg-[#374151] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Folder
        </button>
        <button
          onClick={onRename}
          className="w-full px-4 py-2 text-sm text-[#D1D5DB] hover:bg-[#374151] flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Rename
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-[#374151] flex items-center gap-2"
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

const FileTree = ({ 
  onFileSelect, 
  selectedFile, 
  files = {},
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
}) => {
  const [tree, setTree] = useState(() => buildFileTree(files));
  const [expandedFolders, setExpandedFolders] = useState(new Set(["src"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [renameInput, setRenameInput] = useState({ isOpen: false, path: "", name: "" });
  const [newItemInput, setNewItemInput] = useState({ isOpen: false, type: null, parentPath: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    filePath: null,
  });

  useEffect(() => {
    const newTree = buildFileTree(files);
    setTree(newTree);
    
    // Auto-expand common folders and parent of selected file
    const autoExpand = new Set();
    if (newTree.children) {
      Object.values(newTree.children).forEach((child) => {
        if (child.type === "folder") {
          // Always expand root-level folders
          autoExpand.add(child.path);
        }
      });
    }
    
    // Expand parent folders of selected file
    if (selectedFile) {
      const parts = selectedFile.split("/").filter(Boolean);
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join("/");
        autoExpand.add(parentPath);
      }
    }
    
    setExpandedFolders((prev) => {
      // Merge with existing expanded folders to preserve user's manual expansions
      const merged = new Set([...prev, ...autoExpand]);
      return merged;
    });
  }, [files, selectedFile]);

  const toggleFolder = useCallback((folderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(folderPath) ? next.delete(folderPath) : next.add(folderPath);
      return next;
    });
  }, []);

  const handleContextMenu = (e, filePath) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, filePath });
  };

  const filteredTree = filterFileTree(tree, searchTerm);
  const hasFiles = tree.children && Object.keys(tree.children).length > 0;

  return (
    <div className="flex flex-col h-full bg-[#0F1117] text-white">
      <div className="shrink-0 flex items-center justify-between p-3 border-b border-[#1F2937] h-14">
        <h3 className="text-sm font-medium">Files</h3>
      </div>

      <div className="shrink-0 p-2 border-b border-[#1F2937]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1F2937] text-white rounded px-2.5 py-1.5 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-[#9CA3AF] hover:text-[#D1D5DB]"
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
              .sort((a, b) =>
                a.type !== b.type
                  ? a.type === "folder"
                    ? -1
                    : 1
                  : a.name.localeCompare(b.name)
              )
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
          <div className="p-4 text-sm text-[#9CA3AF] text-center">
            {searchTerm ? "No files match your search." : "No files yet."}
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onNewFile={() => {
            const parentPath = contextMenu.filePath || "";
            setNewItemInput({ isOpen: true, type: "file", parentPath });
            setContextMenu(null);
          }}
          onNewFolder={() => {
            const parentPath = contextMenu.filePath || "";
            setNewItemInput({ isOpen: true, type: "folder", parentPath });
            setContextMenu(null);
          }}
          onRename={() => {
            const path = contextMenu.filePath;
            const name = path.split("/").pop();
            setRenameInput({ isOpen: true, path, name });
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

      {/* Rename Input */}
      {renameInput.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F2937] rounded-lg p-4 w-96 border border-[#374151]">
            <h3 className="text-white font-medium mb-3">Rename</h3>
            <input
              type="text"
              value={renameInput.name}
              onChange={(e) => setRenameInput({ ...renameInput, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (renameInput.name.trim() && onRenameFile) {
                    onRenameFile(renameInput.path, renameInput.name.trim());
                    setRenameInput({ isOpen: false, path: "", name: "" });
                  }
                } else if (e.key === "Escape") {
                  setRenameInput({ isOpen: false, path: "", name: "" });
                }
              }}
              autoFocus
              className="w-full bg-[#0F1117] text-white rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRenameInput({ isOpen: false, path: "", name: "" })}
                className="px-3 py-1.5 text-sm text-[#D1D5DB] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (renameInput.name.trim() && onRenameFile) {
                    onRenameFile(renameInput.path, renameInput.name.trim());
                    setRenameInput({ isOpen: false, path: "", name: "" });
                  }
                }}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Item Input */}
      {newItemInput.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F2937] rounded-lg p-4 w-96 border border-[#374151]">
            <h3 className="text-white font-medium mb-3">
              New {newItemInput.type === "file" ? "File" : "Folder"}
            </h3>
            <input
              type="text"
              placeholder={`Enter ${newItemInput.type === "file" ? "file" : "folder"} name`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const name = e.target.value.trim();
                  if (name) {
                    if (newItemInput.type === "file" && onCreateFile) {
                      const filePath = newItemInput.parentPath
                        ? `${newItemInput.parentPath}/${name}`
                        : name;
                      onCreateFile(filePath);
                    } else if (newItemInput.type === "folder" && onCreateFolder) {
                      const folderPath = newItemInput.parentPath
                        ? `${newItemInput.parentPath}/${name}`
                        : name;
                      onCreateFolder(folderPath);
                    }
                    setNewItemInput({ isOpen: false, type: null, parentPath: "" });
                  }
                } else if (e.key === "Escape") {
                  setNewItemInput({ isOpen: false, type: null, parentPath: "" });
                }
              }}
              autoFocus
              className="w-full bg-[#0F1117] text-white rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setNewItemInput({ isOpen: false, type: null, parentPath: "" })}
                className="px-3 py-1.5 text-sm text-[#D1D5DB] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete File?"
        message={`Are you sure you want to delete "${confirmDialog.filePath}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={() => {
          if (onDeleteFile && confirmDialog.filePath) {
            onDeleteFile(confirmDialog.filePath);
          }
          setConfirmDialog({ isOpen: false, type: null, filePath: null });
        }}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, type: null, filePath: null })
        }
      />
    </div>
  );
};

export default memo(FileTree);
