import React, { useState } from "react";
import "./Hero.css";
import { Button } from "../ui/button";
import { MoveRight } from "lucide-react";
import { Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
function Hero() {
  const [userInput, setuserInput] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleInputchange = (e) => {
    setuserInput(e.target.value);
  };
  // Add this to your Hero.jsx component
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

      console.log("Server Response: ", response.data);

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
      chatHistory.push(newMessage, serverResponse);
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

      // Navigate to builder with the current response
      navigate(`/builder`, {
        state: {
          currentMessage: userInput,
          currentResponse: response.data.result,
        },
      });

      // Clear input after sending
      setuserInput("");
    } catch (error) {
      console.error("Error submitting request: ", error);
      setError("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <h1 className="text-gray-100 text-5xl font-bold">
        What do you want to build today?
      </h1>
      <h3 className="text-lg text-gray-300">Prompt, Create, run and Edit</h3>
      <div
        className="w-full max-w-lg rounded-3xl border-1 border-gray-600"
        style={{
          backgroundColor: "#121212",
        }}
      >
        <div className="flex items-center p-3 rounded-lg ">
          <textarea
            className="w-full h-32 overflow-y-auto overflow-x-hidden break-words bg-transparent text-white outline-none placeholder-gray-400 resize-none p-2 box-border rounded-md scrollbar-hide"
            placeholder="How can Arrow help you today?"
            value={userInput}
            onChange={handleInputchange}
            onKeyDown={handleKeyDown}
          ></textarea>
          {userInput && userInput.trim() !== "" && (
            <Button
              className="bg-white -mt-20 text-black hover:bg-gray-700 hover:text-white "
              onClick={handlesubmit}
              disabled={loading}
            >
              {loading ? "processing..." : <MoveRight />}
            </Button>
          )}
        </div>
        <div className=" ml-3 mb-2 p-2">
          <Link2 className="text-white" />
        </div>
      </div>
      {error && <p className="text-red-700">{error}</p>}
    </div>
  );
}

export default Hero;
