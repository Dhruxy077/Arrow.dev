// src/pages/HomePage/Home.jsx
import React from "react";
import Hero from "../../components/Hero/Hero";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Arrow.dev
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Build full-stack applications directly in your browser with AI
            assistance
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <Hero />
        </div>
      </div>
    </div>
  );
};

export default Home;
