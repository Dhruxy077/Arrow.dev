// client/components/Chat/Chat.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  BotMessageSquare,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { generateRequest, modifyRequest } from "../../services/api";
import {
  parseInitialGeneration,
  parseModification,
} from "../../services/AIResponseParser";
import ReactMarkdown from "react-markdown";

// This is the new "Importing" message component
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
    <div className="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
      <div className="flex items-center gap-3">
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
  );
};

// This is the new Error message component
const ErrorMessage = ({ error }) => {
  return (
    <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <span className="text-sm font-medium text-red-300">
          Sorry, an error occurred:
        </span>
      </div>
      <pre className="mt-2 text-xs text-red-300/80 bg-neutral-900 p-2 rounded overflow-x-auto">
        {error}
      </pre>
    </div>
  );
};

const Chat = ({
  initialMessages = [],
  isLoading,
  setIsLoading,
  isFirstMessage,
  currentFiles = {},
  onCodeGenerated,
  onCodeModified,
  onAddMessage,
  onSetMessageContent,
  // New props for the in-line import screen
  isImporting,
  generatingStage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [initialMessages, isImporting]); // Scroll when import starts

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      type: "user",
      content: inputValue,
    };
    onAddMessage(userMessage);
    setInputValue("");
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    onAddMessage({
      id: assistantMessageId,
      type: "assistant",
      content: "...", // Placeholder
    });

    try {
      let rawXML = "";
      if (isFirstMessage) {
        rawXML = await generateRequest(userMessage.content);
      } else {
        rawXML = await modifyRequest(userMessage.content, currentFiles);
      }

      if (isFirstMessage) {
        const { projectName, files, error } = parseInitialGeneration(rawXML);
        if (error) throw new Error(error);

        // Don't set content yet, onCodeGenerated will hide this panel
        onCodeGenerated(projectName, files); // This triggers the import
      } else {
        const { projectName, updates, newFiles, error } =
          parseModification(rawXML);
        if (error) throw new Error(error);

        const updateCount = updates.length;
        const newFileCount = Object.keys(newFiles).length;
        const summary = `Project **${projectName}** updated! \nI made ${updateCount} code change(s) and added ${newFileCount} new file(s).`;
        onSetMessageContent(assistantMessageId, summary);
        onCodeModified(projectName, updates, newFiles);
      }
    } catch (error) {
      console.error("handleSendMessage error:", error);
      const errorContent = `Sorry, I encountered an error: \n\n\`\`\`\n${error.message}\n\`\`\``;
      onSetMessageContent(assistantMessageId, errorContent);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-800 overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {initialMessages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {message.type === "assistant" && (
              <div className="shrink-0 w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                <BotMessageSquare className="w-4 h-4 text-neutral-300" />
              </div>
            )}
            {message.type === "user" && (
              <div className="shrink-0 w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-neutral-300" />
              </div>
            )}

            <div
              className={`rounded-lg p-3 max-w-[80%] ${
                message.type === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-700 text-neutral-200"
              }`}
            >
              {message.content === "..." ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code: ({ inline, className, children, ...props }) => (
                        <code
                          className="bg-neutral-900 text-yellow-400 px-1 py-0.5 rounded text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* This is where the loading screen now lives */}
        {isImporting && <ImportingMessage stage={generatingStage} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-700">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Let's build..."
            className="flex-1 bg-neutral-700 text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10 max-h-[120px]"
            rows={1}
            disabled={isLoading || isImporting}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || isImporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
