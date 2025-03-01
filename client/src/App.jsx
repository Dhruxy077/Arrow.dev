import React from "react";
import Home from "./pages/Home page/Home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Builder from "./pages/Builder page/Builder";
function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
