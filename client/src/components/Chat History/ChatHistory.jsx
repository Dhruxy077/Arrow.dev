// client/components/ChatHistory/ChatHistory.jsx
import React from "react";
import { Plus, MessageSquare, Trash2, Folder } from "lucide-react";

const ChatHistory = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) => {
  const sortedChats = [...chats].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="flex flex-col h-full bg-neutral-800 text-white w-64">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-700 h-14">
        <h2 className="text-sm font-medium text-neutral-300">My Projects</h2>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded text-neutral-400 hover:bg-neutral-700 hover:text-white"
          title="New Project"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {sortedChats.length === 0 && (
          <div className="p-4 text-center text-neutral-500 text-sm">
            Start a new project.
          </div>
        )}
        <nav className="p-2 space-y-1">
          {sortedChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && onSelectChat(chat.id)
              }
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded transition-colors cursor-pointer ${
                chat.id === activeChatId
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-300 hover:bg-neutral-700/50"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder className="w-4 h-4 shrink-0" />
                <span className="truncate text-sm font-medium">
                  {chat.title}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="p-1 rounded text-neutral-400 hover:bg-neutral-600 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100"
                title="Delete Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-700 text-xs text-neutral-500">
        All projects are saved in your browser.
      </div>
    </div>
  );
};

export default ChatHistory;
