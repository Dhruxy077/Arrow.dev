// client/src/components/Hero/Hero.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { templates, categories } from "../../services/templates";

const Hero = () => {
  const [userInput, setUserInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const navigate = useNavigate();
  const [loading] = useState(false);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (prompt = null) => {
    const finalPrompt = prompt || userInput?.trim();
    if (!finalPrompt) return;
    // Persist to sessionStorage to survive refresh
    sessionStorage.setItem("initialPrompt", finalPrompt);
    navigate("/builder");
  };

  const handleTemplateClick = (template) => {
    handleSubmit(template.prompt);
  };

  return (
    <div className="flex flex-col items-center text-center gap-6">
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
          className="mt-3 md:mt-0 md:ml-3 bg-blue-50 rounded-xl w-12 h-12 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          onClick={() => handleSubmit()}
          disabled={loading || !userInput.trim()}
          aria-label="Submit prompt"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-black" />
          ) : (
            <ArrowRight className="w-5 h-5 text-black" />
          )}
        </button>
      </div>

      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>{showTemplates ? "Hide" : "Show"} Templates</span>
      </button>

      {showTemplates && (
        <div className="w-full max-w-4xl mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500 hover:bg-gray-700/50 transition-all text-left group"
              >
                <div className="text-2xl mb-2">{template.icon}</div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                <span className="text-xs text-gray-500">{template.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;
