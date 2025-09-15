import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <nav
      className="navbar mb-4"
      style={{
        backgroundColor: "#000", 
        borderBottom: "3px solid #e50914", 
      }}
    >
      <div className="container d-flex justify-content-center">
        <Link
          className="navbar-brand"
          to="/"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            color: "#e50914", 
          }}
        >
          Cinema VOD
        </Link>
      </div>
    </nav>
  );
}
