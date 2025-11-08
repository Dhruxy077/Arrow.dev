// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage/Home";
import Builder from "./pages/BuilderPage/Builder";
import SharedProject from "./pages/SharedProjectPage/SharedProject";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="/share/:token" element={<SharedProject />} />
    </Routes>
  );
}

export default App;
