// client/components/MainTabs/MainTabs.jsx
import React, { useState } from "react";
import { Bot, Terminal as TerminalIcon, Shield } from "lucide-react";
import Chat from "../Chat/Chat";
import Terminal from "../Terminal/Terminal";

const MainTabs = (props) => {
  const [activeTab, setActiveTab] = useState("bot");

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Tab Headers */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 border-t border-neutral-800">
        <button
          onClick={() => setActiveTab("bot")}
          className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 ${
            activeTab === "bot"
              ? "border-white text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Bot className="w-4 h-4" />
          Bot
        </button>
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 ${
            activeTab === "terminal"
              ? "border-white text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
          Terminal
        </button>
        <button
          disabled
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 border-transparent text-neutral-600 cursor-not-allowed"
        >
          <Shield className="w-4 h-4" />
          Publish Output
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "bot" && <Chat {...props} />}
        {activeTab === "terminal" && <Terminal />}
      </div>
    </div>
  );
};

export default MainTabs;
