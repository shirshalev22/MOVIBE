import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Info from "./pages/Info";
import Header from "./components/Header";

function App() {
  return (
    <div style={{ backgroundColor: "#000", minHeight: "100vh", color: "white" }}>
      <Header />
      <div className="container py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/info/:id" element={<Info />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
