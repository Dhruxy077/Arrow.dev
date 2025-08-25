// src/components/WebContainer/TerminalPanel.jsx

import React, { useState } from "react";
import { Plus } from "lucide-react";
import TerminalInstance from "./TerminalInstance";

// 1. ACCEPT THE PROP
const TerminalPanel = ({ webcontainerInstance, isContainerReady }) => {
  const [terminals, setTerminals] = useState([{ id: 1, name: "Terminal" }]);
  const [activeTerminalId, setActiveTerminalId] = useState(1);
  const [nextId, setNextId] = useState(2);

  const addTerminal = () => {
    const newTerminal = { id: nextId, name: `Terminal ${nextId}` };
    setTerminals([...terminals, newTerminal]);
    setActiveTerminalId(nextId);
    setNextId(nextId + 1);
  };

  if (!webcontainerInstance) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-gray-400">
        Waiting for WebContainer...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-shrink-0 flex items-center gap-2 p-2 border-b border-gray-700">
        {terminals.map((term) => (
          <button
            key={term.id}
            onClick={() => setActiveTerminalId(term.id)}
            className={`px-4 py-1 text-sm rounded ${
              activeTerminalId === term.id ? "bg-gray-700" : "hover:bg-gray-800"
            }`}
          >
            {term.name}
          </button>
        ))}
        <button
          onClick={addTerminal}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-grow relative">
        {terminals.map((term) => (
          <div
            key={term.id}
            className="w-full h-full"
            style={{ display: activeTerminalId === term.id ? "block" : "none" }}
          >
            {/* 2. PASS THE PROP DOWN */}
            <TerminalInstance
              webcontainerInstance={webcontainerInstance}
              isContainerReady={isContainerReady}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalPanel;
