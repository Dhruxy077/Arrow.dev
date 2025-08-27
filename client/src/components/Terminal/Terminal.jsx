import React, { useState } from "react";
import { Plus, X, Terminal as TerminalIcon } from "lucide-react";
import TerminalInstance from "../WebContainer/TerminalInstance";

const Terminal = ({ webcontainerInstance, isContainerReady }) => {
  const [terminals, setTerminals] = useState([
    { id: 1, name: "Terminal 1", active: true },
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState(1);
  const [nextId, setNextId] = useState(2);

  const addTerminal = () => {
    const newTerminal = {
      id: nextId,
      name: `Terminal ${nextId}`,
      active: false,
    };
    setTerminals((prev) => [...prev, newTerminal]);
    setActiveTerminalId(nextId);
    setNextId(nextId + 1);
  };

  const closeTerminal = (terminalId) => {
    if (terminals.length === 1) return; // Don't close the last terminal

    setTerminals((prev) => prev.filter((t) => t.id !== terminalId));
    if (activeTerminalId === terminalId) {
      const remainingTerminals = terminals.filter((t) => t.id !== terminalId);
      setActiveTerminalId(remainingTerminals[0]?.id || 1);
    }
  };

  const switchTerminal = (terminalId) => {
    setActiveTerminalId(terminalId);
  };

  if (!isContainerReady) {
    return (
      <div className="flex flex-col h-full bg-black">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 bg-gray-900">
          <TerminalIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Terminal</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
            <div>Starting WebContainer...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-700 bg-gray-900">
        <TerminalIcon className="w-4 h-4 text-gray-400 mr-2" />
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {terminals.map((terminal) => (
            <div
              key={terminal.id}
              className={`flex items-center gap-2 px-3 py-1 text-sm rounded-t cursor-pointer whitespace-nowrap ${
                activeTerminalId === terminal.id
                  ? "bg-black text-white border-t border-l border-r border-gray-600"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
              onClick={() => switchTerminal(terminal.id)}
            >
              <span>{terminal.name}</span>
              {terminals.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTerminal(terminal.id);
                  }}
                  className="hover:text-red-400 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addTerminal}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white flex-shrink-0"
          title="New Terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className="absolute inset-0"
            style={{
              display: activeTerminalId === terminal.id ? "block" : "none",
            }}
          >
            <TerminalInstance
              key={`terminal-${terminal.id}`}
              webcontainerInstance={webcontainerInstance}
              isContainerReady={isContainerReady}
              terminalId={terminal.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal;
