// client/src/components/MultiTerminal/MultiTerminal.jsx
import React, { useState, useCallback } from "react";
import { Plus, X } from "lucide-react";
import TerminalInstance from "../WebContainer/TerminalInstance";

const MultiTerminal = ({ webcontainerInstance, isContainerReady }) => {
  const [terminals, setTerminals] = useState([
    { id: "bolt-1", name: "⚡ Bolt", active: true },
  ]);

  const addTerminal = useCallback(() => {
    const newTerminal = {
      id: `terminal-${Date.now()}`,
      name: `Terminal ${terminals.length}`,
      active: false,
    };
    setTerminals((prev) => prev.map((t) => ({ ...t, active: false })).concat(newTerminal));
  }, [terminals.length]);

  const switchTerminal = useCallback((id) => {
    setTerminals((prev) =>
      prev.map((t) => ({
        ...t,
        active: t.id === id,
      }))
    );
  }, []);

  const closeTerminal = useCallback(
    (id) => {
      if (terminals.length === 1) return; // Don't close the last terminal
      setTerminals((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        // If we closed the active terminal, activate the first one
        if (prev.find((t) => t.id === id)?.active && filtered.length > 0) {
          filtered[0].active = true;
        }
        return filtered;
      });
    },
    [terminals.length]
  );

  const renameTerminal = useCallback((id, newName) => {
    setTerminals((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t))
    );
  }, []);

  const activeTerminal = terminals.find((t) => t.active) || terminals[0];

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F] border-t border-[#1F2937]">
      {/* Terminal Tabs */}
      <div className="flex items-center gap-1 px-2 bg-[#1F2937] border-b border-[#374151] overflow-x-auto scrollbar-hide">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={`group flex items-center gap-2 px-3 py-2 text-sm font-medium cursor-pointer border-b-2 transition-colors ${
              terminal.active
                ? "border-blue-500 text-white bg-[#0F1117]"
                : "border-transparent text-[#9CA3AF] hover:text-white hover:bg-[#374151]"
            }`}
            onClick={() => switchTerminal(terminal.id)}
          >
            <span className="whitespace-nowrap">{terminal.name}</span>
            {terminals.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(terminal.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#374151] rounded transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTerminal}
          className="ml-auto px-3 py-2 text-[#9CA3AF] hover:text-white hover:bg-[#374151] transition-colors rounded"
          title="New Terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Active Terminal */}
      {activeTerminal && (
        <div className="flex-1 overflow-hidden">
          <TerminalInstance
            webcontainerInstance={webcontainerInstance}
            isContainerReady={isContainerReady}
            terminalId={activeTerminal.id}
            cwd="~/project"
          />
        </div>
      )}
    </div>
  );
};

export default MultiTerminal;

