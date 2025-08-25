import React from 'react';
import { Settings, Github, Zap, ChevronDown } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-orange-500" />
          <span className="text-white font-bold text-lg">bolt</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <span>Dhruxy077/Arrow.dev (imported from GitHub)</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-white">
          <Settings className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-white">
          <Github className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <Zap className="w-4 h-4" />
          <span>Integrations</span>
          <ChevronDown className="w-4 h-4" />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">
          Publish
        </button>
      </div>
    </header>
  );
};

export default Header;