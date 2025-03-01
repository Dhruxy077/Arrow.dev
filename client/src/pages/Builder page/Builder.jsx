import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { ArrowLeft, MoveRight, Link2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import axios from "axios";
import Monaco_Editor from "@/components/monaco-editor/Monaco_Editor";

function Builder() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Load chat history from localStorage
    const storedHistory = JSON.parse(
      localStorage.getItem("chatHistory") || "[]"
    );
    setChatHistory(storedHistory);
  }, []);

  const handleInputchange = (e) => {
    setUserInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid adding a new line
      if (userInput && userInput.trim() !== "") {
        handlesubmit();
      }
    }
    // Shift+Enter will work normally to create a new line (default behavior)
  };

  const handlesubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/process-request",
        {
          userInput: userInput,
        }
      );

      // Store the current message in chat history
      const chatHistory = JSON.parse(
        localStorage.getItem("chatHistory") || "[]"
      );
      const newMessage = {
        id: Date.now(),
        type: "user",
        content: userInput,
        timestamp: new Date().toISOString(),
      };

      const serverResponse = {
        id: Date.now() + 1,
        type: "server",
        content: response.data.result,
        timestamp: new Date().toISOString(),
      };

      // Add new messages to history
      const updatedHistory = [...chatHistory, newMessage, serverResponse];
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
      setChatHistory(updatedHistory);

      // Clear input after sending
      setUserInput("");
    } catch (error) {
      console.error("Error submitting request: ", error);
      setError("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" min-h-screen">
      <div className="text-white grid grid-cols-6 grid-rows-6 gap-4 m-10 pt-10">
        <div className="chat-section  col-span-2 row-span-5 flex flex-col h-[88vh]">
          <div className="flex justify-between items-center p-3 border-b">
            <h1 className="text-xl font-bold">Chat History</h1>
            <button
              onClick={() => {
                localStorage.clear();
                setChatHistory([]);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
            >
              Clear History
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
            {chatHistory.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.type === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[90%] ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  {message.type === "user" ? (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  ) : (
                    <div className="markdown-content max-w-full overflow-x-auto">
                      <div className="prose prose-invert break-words whitespace-pre-wrap">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto p-3 ">
            <div
              className="w-full rounded-3xl border-2 border-gray-600"
              style={{
                backgroundColor: "#121212",
              }}
            >
              <div className="flex items-center p-3 rounded-lg ">
                <textarea
                  className="w-full h-20  overflow-y-auto overflow-x-hidden break-words bg-transparent text-white outline-none placeholder-gray-400 resize-none p-2 box-border rounded-md scrollbar-hide"
                  placeholder="How can Arrow help you today?"
                  value={userInput}
                  onChange={handleInputchange}
                  onKeyDown={handleKeyDown}
                ></textarea>
                {userInput && userInput.trim() !== "" && (
                  <Button
                    className="bg-white -mt-10 text-black hover:bg-gray-700 hover:text-white "
                    onClick={handlesubmit}
                    disabled={loading}
                  >
                    {loading ? "processing..." : <MoveRight />}
                  </Button>
                )}
              </div>
              <div className="ml-3 mb-2 p-2">
                <Link2 className="text-white" />
              </div>
            </div>
            {error && <p className="text-red-700 mt-2">{error}</p>}
          </div>
        </div>

        <div className="Editor-section col-span-4 row-span-5 row-start-1 col-start-3 h-[85vh] overflow-auto scrollbar-hide">
          <div>
            <Monaco_Editor />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Builder;
