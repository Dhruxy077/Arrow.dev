// src/pages/HomePage/Home.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Figma, Github, Loader2 } from "lucide-react";

const Home = () => {
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const prompt = userInput.trim();
    if (!prompt) return;

    setLoading(true);
    sessionStorage.setItem("initialPrompt", prompt);
    navigate("/builder");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-white overflow-hidden relative flex flex-col">
      {/* Header Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[70px] border-b border-[#1F2937] bg-[#0F1117]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <div className="text-white font-bold text-xl">Arrow.dev</div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors text-sm">
                Community
              </a>
              <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors text-sm">
                Enterprise
              </a>
              <div className="relative group">
                <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors text-sm flex items-center gap-1">
                  Resources
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>
              <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors text-sm">
                Careers
              </a>
              <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors text-sm">
                Pricing
              </a>
            </nav>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="text-[#A1A1AA] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-[70px] min-h-screen flex flex-col items-center justify-center px-6 pb-32 relative z-10">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] text-blue-400 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          Introducing Arrow V2
        </div>

        {/* Main Heading */}
        <h1 className="text-6xl md:text-7xl font-bold text-center mb-6 leading-[1.1] tracking-tight">
          What will you{" "}
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            build
          </span>{" "}
          today?
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-[#9CA3AF] mb-8 text-center max-w-2xl">
          Create stunning apps & websites by chatting with AI.
        </p>

        {/* Input Box */}
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-[rgba(31,41,55,0.5)] backdrop-blur-sm border border-[#374151] rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:border-[#3B82F6] transition-colors min-h-[120px] flex flex-col">
            <textarea
              className="flex-1 bg-transparent text-white placeholder-[#9CA3AF] outline-none resize-none text-lg"
              placeholder="Let's build a professional portfolio website..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#374151]">
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Sparkles className="w-4 h-4" />
                <span>Claude Agent</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-[#9CA3AF] hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !userInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-semibold text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      Build now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Buttons */}
        <div className="flex items-center gap-4 text-sm text-[#9CA3AF] mb-16">
          <span>or import from</span>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#374151] rounded-lg hover:border-[#4B5563] hover:bg-[rgba(59,130,246,0.05)] transition-colors">
            <Figma className="w-4 h-4" />
            Figma
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#374151] rounded-lg hover:border-[#4B5563] hover:bg-[rgba(59,130,246,0.05)] transition-colors">
            <Github className="w-4 h-4" />
            GitHub
          </button>
        </div>
      </div>

      {/* Earth Horizon Effect */}
      <div className="fixed bottom-0 left-0 right-0 h-64 pointer-events-none z-0">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-transparent via-blue-500/20 to-blue-400/30 blur-[2px]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-black rounded-t-[50%]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-[3px]"></div>
      </div>
    </div>
  );
};

export default Home;
