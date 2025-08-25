// src/App.jsx

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Builder from "./pages/BuilderPage/Builder"; // Make sure this path is correct

function App() {
  return (
    <Routes>
      {/* This will make the builder page the default page */}
      <Route path="/" element={<Navigate to="/builder" />} />

      {/* This tells the app to render your Builder component at the '/builder' URL */}
      <Route path="/builder" element={<Builder />} />

      {/* You can add other pages here later, e.g., a homepage */}
      {/* <Route path="/home" element={<HomePage />} /> */}
    </Routes>
  );
}

export default App;
