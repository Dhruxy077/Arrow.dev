// client/src/components/CodeSnippets/CodeSnippetsPanel.jsx
import React, { useState } from "react";
import { Code, Search, Copy, Check, X } from "lucide-react";
import { codeSnippets, snippetCategories } from "../../services/codeSnippets";

const CodeSnippetsPanel = ({ onInsertSnippet, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState(null);

  const filteredSnippets = codeSnippets.filter((snippet) => {
    const matchesSearch =
      snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || snippet.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = async (snippet) => {
    await navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (snippet) => {
    if (onInsertSnippet) {
      onInsertSnippet(snippet.code);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Code Snippets</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="w-full bg-neutral-800 text-white text-sm px-3 pl-9 py-2 rounded border border-neutral-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedCategory === "All"
                ? "bg-blue-600 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            All
          </button>
          {snippetCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredSnippets.length === 0 ? (
          <div className="text-center text-neutral-400 py-8">
            No snippets found
          </div>
        ) : (
          filteredSnippets.map((snippet) => (
            <div
              key={snippet.id}
              className="bg-neutral-800 rounded-lg p-3 border border-neutral-700 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {snippet.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mb-2">
                    {snippet.description}
                  </p>
                  <span className="inline-block px-2 py-0.5 text-xs bg-neutral-700 text-neutral-300 rounded">
                    {snippet.language}
                  </span>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleCopy(snippet)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                    title="Copy snippet"
                  >
                    {copiedId === snippet.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {onInsertSnippet && (
                    <button
                      onClick={() => handleInsert(snippet)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                    >
                      Insert
                    </button>
                  )}
                </div>
              </div>
              <pre className="text-xs bg-neutral-900 p-2 rounded overflow-x-auto text-neutral-300 mt-2">
                <code>{snippet.code.substring(0, 150)}...</code>
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CodeSnippetsPanel;

