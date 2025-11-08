// client/src/components/Sidebar/Sidebar.jsx
import React, { useState, useMemo } from "react";
import { 
  Plus, Search, ChevronDown, Gift, Settings, HelpCircle, 
  CreditCard, User, LogOut, Menu, X 
} from "lucide-react";

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  chats = [], 
  activeChatId, 
  onSelectChat, 
  onNewChat 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    yesterday: true,
    last30Days: true,
    thisMonth: true,
  });

  // Auto-collapse on desktop when not hovered (if collapsed state is true)
  const shouldShowFull = isOpen && (!isCollapsed || isHovered);

  // Group chats by date
  const groupedChats = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    const groups = {
      yesterday: [],
      last30Days: [],
      thisMonth: [],
      older: [],
    };

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    chats.forEach((chat) => {
      const chatDate = new Date(chat.timestamp);
      const chatDateOnly = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      if (chatDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(chat);
      } else if (chatDate >= last30Days) {
        groups.last30Days.push(chat);
      } else if (chatDate.getMonth() === now.getMonth() && chatDate.getFullYear() === now.getFullYear()) {
        groups.thisMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    // Group older chats by month
    const olderByMonth = {};
    groups.older.forEach((chat) => {
      const chatDate = new Date(chat.timestamp);
      const monthKey = `${monthNames[chatDate.getMonth()]} ${chatDate.getFullYear()}`;
      if (!olderByMonth[monthKey]) {
        olderByMonth[monthKey] = [];
      }
      olderByMonth[monthKey].push(chat);
    });

    return { ...groups, olderByMonth };
  }, [chats]);

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return groupedChats;

    const query = searchQuery.toLowerCase();
    const filtered = {
      yesterday: groupedChats.yesterday.filter(chat => 
        chat.title?.toLowerCase().includes(query)
      ),
      last30Days: groupedChats.last30Days.filter(chat => 
        chat.title?.toLowerCase().includes(query)
      ),
      thisMonth: groupedChats.thisMonth.filter(chat => 
        chat.title?.toLowerCase().includes(query)
      ),
      older: groupedChats.older.filter(chat => 
        chat.title?.toLowerCase().includes(query)
      ),
      olderByMonth: {},
    };

    // Filter older chats by month
    Object.keys(groupedChats.olderByMonth || {}).forEach((monthKey) => {
      filtered.olderByMonth[monthKey] = groupedChats.olderByMonth[monthKey].filter(chat =>
        chat.title?.toLowerCase().includes(query)
      );
    });

    return filtered;
  }, [groupedChats, searchQuery]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const CollapsibleGroup = ({ title, chats, groupKey, defaultOpen = true }) => {
    const isOpen = expandedGroups[groupKey] ?? defaultOpen;
    const hasChats = chats.length > 0;

    if (!hasChats && !searchQuery) return null;

    return (
      <div className="mb-2">
        <div
          onClick={() => toggleGroup(groupKey)}
          className="flex items-center justify-between px-4 py-2 text-[#9CA3AF] text-sm font-semibold cursor-pointer hover:bg-[#1F2937] transition-colors"
        >
          <span>{title}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
        {isOpen && (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`px-4 py-2.5 text-sm text-[#D1D5DB] cursor-pointer hover:bg-[#1F2937] transition-colors truncate ${
                  activeChatId === chat.id
                    ? "bg-[#374151] border-l-[3px] border-blue-500"
                    : ""
                }`}
                title={chat.title}
              >
                {chat.title || "Untitled Project"}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen bg-[#0F1117] border-r border-[#1F2937] flex flex-col z-30 transition-all duration-300 ${
          isOpen 
            ? (shouldShowFull ? "w-[280px] translate-x-0" : "w-[60px] translate-x-0") 
            : "-translate-x-full lg:translate-x-0 lg:w-[60px]"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapse Toggle Button (Desktop) */}
        <div className="hidden lg:flex absolute top-4 -right-3 z-40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="w-6 h-6 bg-[#1F2937] border border-[#374151] rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#374151] transition-colors shadow-lg"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
            ) : (
              <ChevronDown className="w-3 h-3 rotate-90" />
            )}
          </button>
        </div>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#1F2937]">
          <span className="text-white font-bold text-lg">Arrow.dev</span>
          <button
            onClick={onToggle}
            className="text-[#A1A1AA] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Start New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center justify-center gap-2 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white font-semibold py-3 rounded-lg transition-colors ${
              shouldShowFull ? "px-4" : "px-2"
            }`}
            title={!shouldShowFull ? "Start new chat" : ""}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {shouldShowFull && <span>Start new chat</span>}
          </button>
        </div>

        {/* Search Bar */}
        {shouldShowFull && (
          <div className="px-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1F2937] border-none rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {shouldShowFull && (
            <div className="px-2 mb-2">
              <div className="px-2 py-2 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Your Chats
              </div>
            </div>
          )}

          {shouldShowFull ? (
            <>
              <CollapsibleGroup
                title="Yesterday"
                chats={filteredChats.yesterday}
                groupKey="yesterday"
              />
              <CollapsibleGroup
                title="Last 30 Days"
                chats={filteredChats.last30Days}
                groupKey="last30Days"
              />
              <CollapsibleGroup
                title={new Date().toLocaleString('default', { month: 'long' })}
                chats={filteredChats.thisMonth}
                groupKey="thisMonth"
              />
              {Object.keys(filteredChats.olderByMonth || {}).map((monthKey) => (
                <CollapsibleGroup
                  key={monthKey}
                  title={monthKey}
                  chats={filteredChats.olderByMonth[monthKey]}
                  groupKey={`older-${monthKey}`}
                  defaultOpen={false}
                />
              ))}
            </>
          ) : (
            // Collapsed view - show only icons
            <div className="px-2 py-2 space-y-2">
              {chats.slice(0, 10).map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full p-2 rounded-lg transition-colors ${
                    activeChatId === chat.id
                      ? "bg-[#374151] border-l-[3px] border-blue-500"
                      : "hover:bg-[#1F2937]"
                  }`}
                  title={chat.title || "Untitled Project"}
                >
                  <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-semibold mx-auto">
                    {(chat.title || "N")[0].toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-[#1F2937] pt-2 pb-4">
          {shouldShowFull ? (
            <>
              <div className="space-y-1 px-2">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors">
                  <Gift className="w-4 h-4 shrink-0" />
                  Get free tokens
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors">
                  <Settings className="w-4 h-4 shrink-0" />
                  Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  Help Center
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  My Subscription
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors">
                  <User className="w-4 h-4 shrink-0" />
                  Select Account
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors">
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sign Out
                </button>
              </div>

              {/* User Profile */}
              <div className="mt-4 px-4 py-3 bg-[#1F2937] rounded-lg mx-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    D
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      Dhruxy
                    </div>
                    <div className="text-[#9CA3AF] text-xs truncate">
                      Personal
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Collapsed view - icons only
            <div className="space-y-2 px-2">
              <button className="w-full p-2 flex items-center justify-center text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors" title="Get free tokens">
                <Gift className="w-4 h-4" />
              </button>
              <button className="w-full p-2 flex items-center justify-center text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
              <button className="w-full p-2 flex items-center justify-center text-[#D1D5DB] hover:bg-[#1F2937] rounded-lg transition-colors" title="Help Center">
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="mt-4 p-2 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm" title="Dhruxy - Personal">
                  D
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

