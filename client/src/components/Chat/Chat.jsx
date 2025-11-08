import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  BotMessageSquare,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  File,
  X,
  Edit2,
  RefreshCw,
  MoreVertical,
  Download,
  Trash2,
  Search,
} from "lucide-react";
// Removed API and Parser imports -- Chat should not be responsible for this
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

// Bot Avatar Component (unchanged)
const BotAvatar = () => (
  <div className="shrink-0 w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
    <BotMessageSquare className="w-4 h-4 text-white" />
  </div>
);

// User Avatar Component (unchanged)
const UserAvatar = () => (
  <div className="shrink-0 w-8 h-8 bg-[#374151] rounded-full flex items-center justify-center">
    <User className="w-4 h-4 text-white" />
  </div>
);

// Importing/Loading Message Component (unchanged)
const ImportingMessage = ({ stage }) => {
  const stages = [
    "Analyzing your request...",
    "Generating code structure...",
    "Writing files...",
    "Installing dependencies...",
    "Starting dev server...",
    "Project is ready!",
  ];
  return (
    <div className="flex gap-3 items-start">
      <BotAvatar />
      <div className="flex-1 bg-[#1F2937] rounded-xl rounded-tl-sm p-4 border border-[#374151]">
        <div className="flex items-center gap-2">
          {stage < 5 ? (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          )}
          <span className="text-sm font-medium text-white">
            {stages[stage - 1] || "Importing your project..."}
          </span>
        </div>
      </div>
    </div>
  );
};

// Error Message Component (unchanged)
const ErrorMessage = ({ error }) => {
  return (
    <div className="flex gap-3 items-start">
      <BotAvatar />
      <div className="flex-1 bg-red-900/20 rounded-xl rounded-tl-sm p-4 border border-red-700/50">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium text-red-300">
            Sorry, an error occurred:
          </span>
        </div>
        <pre className="text-xs text-red-300/80 bg-[#0F1117] p-2 rounded overflow-x-auto">
          {error}
        </pre>
      </div>
    </div>
  );
};

// Code Block Component with Copy Button
const CodeBlock = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const handleCopy = async () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const language = className?.replace('language-', '') || '';

  return (
    <div className="relative group my-2">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-[#374151] hover:bg-[#4B5563] rounded text-[#D1D5DB] hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <pre className="bg-[#0F1117] rounded-lg p-4 overflow-x-auto">
        <code ref={codeRef} className={className}>
          {children}
        </code>
      </pre>
      {language && (
        <div className="absolute top-2 left-2 text-xs text-[#9CA3AF] uppercase">
          {language}
        </div>
      )}
    </div>
  );
};

// File Reference Component
const FileReference = ({ filename, currentFiles, onFileSelect }) => {
  const fileExists = currentFiles && filename in currentFiles;
  
  return (
    <button
      onClick={() => onFileSelect?.(filename)}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
        fileExists
          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
          : 'bg-[#374151] text-[#9CA3AF]'
      }`}
      title={fileExists ? `Click to open ${filename}` : `File not found: ${filename}`}
    >
      <File className="w-3 h-3" />
      {filename}
    </button>
  );
};

const Chat = ({
  initialMessages = [],
  isLoading,
  onAddMessage,
  onSendMessage,
  currentFiles = {},
  onFileSelect,
  isImporting,
  generatingStage,
  onCancel,
  onEditMessage,
  onRegenerateMessage,
  onClearChat,
  onExportChat,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showMenuForMessage, setShowMenuForMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [initialMessages, isImporting]);

  // Auto-scroll when streaming (only if user is near bottom)
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, initialMessages]);

  // Auto-resize textarea (unchanged)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  /**
   * REFACTORED:
   * This function is now much simpler.
   * 1. It adds the user's message to the state (via onAddMessage).
   * 2. It calls the new `onSendMessage` prop, passing the raw text up to Builder.
   * Builder.jsx will now handle ALL API logic, loading states, and "..." messages.
   */
  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    // Prevent duplicate sends
    const messageText = inputValue.trim();
    if (!messageText) return;

    if (editingMessageId && onEditMessage) {
      // Edit existing message
      onEditMessage(editingMessageId, messageText);
      setEditingMessageId(null);
      setInputValue(""); // Clear the input
    } else {
      // Send new message - only call once
      const userMessage = {
        id: crypto.randomUUID(),
        type: "user",
        content: messageText,
      };
      
      // Clear input immediately to prevent duplicate sends
      setInputValue("");
      
      // Add message and send
      onAddMessage(userMessage);
      onSendMessage(messageText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter messages based on search query
  const filteredMessages = searchQuery
    ? initialMessages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialMessages;

  // Handle export chat
  const handleExportChat = () => {
    if (!onExportChat) {
      // Default export behavior
      const chatData = {
        messages: initialMessages,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      };
      const jsonStr = JSON.stringify(chatData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      onExportChat(initialMessages);
    }
  };

  // Handle clear chat
  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear all messages? This action cannot be undone.")) {
      if (onClearChat) {
        onClearChat();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1117] overflow-hidden">
      {/* Chat Header with Actions */}
      <div className="shrink-0 flex items-center justify-between p-3 border-b border-[#1F2937] bg-[#0F1117]">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-[#1F2937] text-white text-sm px-2 py-1 rounded border border-[#374151] focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {initialMessages.length > 0 && (
            <>
              <button
                onClick={handleExportChat}
                className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] rounded transition-colors"
                title="Export chat"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearChat}
                className="p-2 text-[#9CA3AF] hover:text-red-400 hover:bg-[#1F2937] rounded transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 && searchQuery ? (
          <div className="text-center text-[#9CA3AF] py-8">
            No messages found matching "{searchQuery}"
          </div>
        ) : (
          filteredMessages.map((message) => (
          <div
            key={message.id}
            className="flex gap-3 items-start group"
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => {
              setHoveredMessageId(null);
              setShowMenuForMessage(null);
            }}
          >
            {message.type === "assistant" ? (
              <>
                <BotAvatar />
                <div className="flex-1 bg-[#1F2937] rounded-xl rounded-tl-sm p-4 max-w-[85%] relative">
                  {/* Message Actions */}
                  {hoveredMessageId === message.id && message.content && message.content !== "..." && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (onRegenerateMessage) {
                            onRegenerateMessage(message.id);
                          }
                        }}
                        className="p-1.5 bg-[#374151] hover:bg-[#4B5563] rounded text-[#D1D5DB] hover:text-white transition-colors"
                        title="Regenerate response"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const text = message.content;
                          navigator.clipboard.writeText(text);
                        }}
                        className="p-1.5 bg-[#374151] hover:bg-[#4B5563] rounded text-[#D1D5DB] hover:text-white transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {message.content === "..." || (isLoading && message.id === initialMessages[initialMessages.length - 1]?.id) ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code: ({ node, inline, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isBlock = !inline && match;
                            
                            if (isBlock) {
                              return (
                                <CodeBlock className={className} {...props}>
                                  {String(children).replace(/\n$/, '')}
                                </CodeBlock>
                              );
                            }
                            
                            return (
                              <code
                                className="bg-[#0F1117] text-yellow-400 px-1 py-0.5 rounded text-xs"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          p: ({ children }) => {
                            // Parse file references like @filename.js
                            const content = String(children);
                            const fileRefRegex = /@([\w./-]+\.\w+)/g;
                            const parts = [];
                            let lastIndex = 0;
                            let match;

                            while ((match = fileRefRegex.exec(content)) !== null) {
                              if (match.index > lastIndex) {
                                parts.push(content.slice(lastIndex, match.index));
                              }
                              parts.push(
                                <FileReference
                                  key={match.index}
                                  filename={match[1]}
                                  currentFiles={currentFiles}
                                  onFileSelect={onFileSelect}
                                />
                              );
                              lastIndex = match.index + match[0].length;
                            }
                            
                            if (lastIndex < content.length) {
                              parts.push(content.slice(lastIndex));
                            }

                            return (
                              <p className="mb-2 last:mb-0 text-[#D1D5DB] leading-relaxed">
                                {parts.length > 0 ? parts : children}
                              </p>
                            );
                          },
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-2 space-y-1 text-[#D1D5DB]">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-2 space-y-1 text-[#D1D5DB]">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-[#D1D5DB] leading-relaxed">
                              {children}
                            </li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 my-2 italic text-[#D1D5DB]">
                              {children}
                            </blockquote>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline"
                            >
                              {children}
                            </a>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold text-white mb-2 mt-4 first:mt-0">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-bold text-white mb-2 mt-4 first:mt-0">
                              {children}
                            </h3>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-white font-semibold">
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex-1" />
                <div className="bg-[#1F2937] rounded-xl rounded-tr-sm p-4 max-w-[85%] relative">
                  {/* User Message Actions */}
                  {hoveredMessageId === message.id && onEditMessage && (
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingMessageId(message.id);
                          setInputValue(message.content);
                          textareaRef.current?.focus();
                        }}
                        className="p-1.5 bg-[#374151] hover:bg-[#4B5563] rounded text-[#D1D5DB] hover:text-white transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-[#D1D5DB] text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <UserAvatar />
              </>
            )}
          </div>
          ))
        )}

        {isImporting && <ImportingMessage stage={generatingStage} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (unchanged) */}
      <div className="shrink-0 p-4">
        <div className="relative bg-[#1F2937] rounded-xl border border-[#374151] focus-within:border-white transition-colors">
          {editingMessageId && (
            <div className="px-4 pt-2 pb-1 text-xs text-blue-400 flex items-center gap-2">
              <Edit2 className="w-3 h-3" />
              Editing message
              <button
                onClick={() => {
                  setEditingMessageId(null);
                  setInputValue("");
                }}
                className="ml-auto text-[#9CA3AF] hover:text-[#D1D5DB]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={editingMessageId ? "Edit your message..." : "Ask me..."}
            className="w-full bg-transparent text-white rounded-xl px-4 py-3 pr-16 text-sm resize-none focus:outline-none min-h-12 max-h-[120px]"
            rows={1}
            disabled={isLoading || isImporting}
          />

          <div className="absolute right-3 bottom-2 flex items-center gap-2">
            {isLoading && onCancel && (
              <button
                onClick={onCancel}
                className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                title="Cancel generation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || isImporting}
              className="p-2 bg-white text-[#0F1117] hover:bg-gray-200 disabled:bg-[#374151] disabled:text-[#9CA3AF] disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-[#9CA3AF] text-center mt-2">
          Arrow can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default Chat;
