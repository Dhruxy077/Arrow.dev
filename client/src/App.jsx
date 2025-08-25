// src/App.jsx

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/HomePage/Home";
import Builder from "./pages/BuilderPage/Builder"; // Make sure this path is correct

function App() {
  return (
    <Routes>
      {/* Home page with Hero component */}
      <Route path="/" element={<Home />} />

      {/* This tells the app to render your Builder component at the '/builder' URL */}
      <Route path="/builder" element={<Builder />} />
    </Routes>
  );
}

export default App;
