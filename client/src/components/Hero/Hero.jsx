// src/components/Hero/Hero.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";

const Hero = () => {
  const [userInput, setUserInput] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    if (error) setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!userInput?.trim()) return;
    setLoading(true);
    setError(null);
    navigate("/builder", { state: { initialPrompt: userInput.trim() } });
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center text-center gap-3">
      <h1 className="text-gray-100 text-4xl md:text-5xl font-bold">
        What do you want to build today?
      </h1>
      <h3 className="text-lg text-gray-300">Prompt, Create, Run and Edit</h3>

      <div className="w-full max-w-2xl flex flex-col md:flex-row items-center p-3 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700">
        <textarea
          className="w-full h-32 md:h-24 bg-transparent text-white placeholder-gray-400 outline-none resize-none p-2 rounded-md"
          placeholder="How can Arrow help you today? (e.g., 'Create a todo app with React and Tailwind')"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="mt-3 md:mt-0 md:ml-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl w-12 h-12 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading || !userInput.trim()}
          aria-label="Submit prompt"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <ArrowRight className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </div>
  );
};

export default Hero;
