// client/src/components/ProjectsList/ProjectsList.jsx
import React, { useState, useMemo } from "react";
import { Search, Clock, FileText, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectsList = ({ chats = [], activeChatId, onSelectChat, onNewChat }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Filter and sort chats
  const filteredChats = useMemo(() => {
    let filtered = chats;
    
    if (searchQuery) {
      filtered = chats.filter((chat) =>
        chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages?.some((msg) =>
          msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Sort by last accessed (timestamp)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0);
      const timeB = new Date(b.timestamp || 0);
      return timeB - timeA;
    });
  }, [chats, searchQuery]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <button
            onClick={onNewChat}
            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="New Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-neutral-800 text-white text-sm px-2.5 py-1.5 pl-8 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-neutral-400">
            {searchQuery ? (
              <div>
                <p className="text-sm mb-2">No projects found</p>
                <button
                  onClick={onNewChat}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Create new project
                </button>
              </div>
            ) : (
              <div>
                <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                <p className="text-sm mb-2">No projects yet</p>
                <button
                  onClick={onNewChat}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const fileCount = Object.keys(chat.generatedCode?.files || {}).length;
              
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm truncate flex-1">
                      {chat.title || "Untitled Project"}
                    </h3>
                    {fileCount > 0 && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-blue-700 text-blue-100"
                            : "bg-neutral-700 text-neutral-400"
                        }`}
                      >
                        {fileCount} files
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(chat.timestamp)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;

