import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageSquare,
  User,
  Bot,
  Loader2,
  BotMessageSquare,
} from "lucide-react";
import { processRequest } from "../../services/api";

const Chat = ({ onCodeGenerated }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content:
        "Hello! I'm here to help you build your application. What would you like to create or modify?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageContent = inputValue) => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await processRequest(messageContent);

      // Check if the response result is an object with files and an explanation
      if (
        response.result &&
        response.result.files &&
        response.result.explanation
      ) {
        const { files, explanation } = response.result;

        // Create a clean message for the chat with just the explanation
        const assistantMessage = {
          id: Date.now() + 1,
          type: "assistant",
          content: explanation, // <-- Use the explanation here
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Notify the parent component with the files data
        if (onCodeGenerated) {
          onCodeGenerated(response.result); // Pass the whole result object
        }
      } else {
        // Fallback for unexpected response format
        const assistantMessage = {
          id: Date.now() + 1,
          type: "assistant",
          content:
            "Sorry, I received an unexpected response. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const formatMessage = (content) => {
    // Simple code block detection and formatting
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add code block
      parts.push({
        type: "code",
        language: match[1] || "javascript",
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text", content }];
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden border-r border-border">
      {/* Chat Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <MessageSquare className="w-5 h-5 text-primary" />
        <span className="text-foreground font-medium">Chat</span>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.type === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center outline-2">
                <BotMessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
            )}

            <div
              className={` rounded-lg p-3 ${
                message.type === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-600 text-muted-foreground"
              }`}
            >
              <div className="space-y-2">
                {formatMessage(message.content).map((part, index) => (
                  <div key={index}>
                    {part.type === "text" ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {part.content}
                      </p>
                    ) : (
                      <div className="bg-background rounded p-2 mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          {part.language}
                        </div>
                        <pre className="text-xs text-green-400 overflow-x-auto">
                          <code>{part.content}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {message.type === "user" && (
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted text-muted-foreground rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create or modify your code..."
            className="flex-1 bg-input text-foreground rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
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
