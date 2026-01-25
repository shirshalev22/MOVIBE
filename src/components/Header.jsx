import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import useFavorites from "../hooks/useFavorites";

export default function Header() {
  // שליפת המשתמש והתפקיד (role) מתוך ה-Hook הגלובלי (context)
  const { user } = useFavorites(); 
  const navigate = useNavigate();

  // פונקציית התנתקות
  const doLogout = async () => {
    try {
      await signOut(auth); // קריאה לפיירבייס לסיים את ה-Session
      navigate("/login"); // העברה לדף התחברות לאחר הצלחה
    } catch (e) {
      alert("Logout failed, try again.");
    }
  };

  return (
    <header className="navbar">
      <div className="header-inner container">
        
        {/* צד שמאל: לוגו וניווט */}
        <div className="left-group">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Link to="/" className="brand">
              <span>MOVIBE</span>
            </Link>
            <small className="slogan">The movie to your vibe</small>
          </div>

          <nav>
            <ul className="nav-list">
              <li><NavLink to="/" end>Home</NavLink></li>
              <li><NavLink to="/favorites">Favorites</NavLink></li>
              <li><NavLink to="/map">Map</NavLink></li>
              
              {/* רנדור מותנה: הצגת לינק מנהל רק אם המשתמש הוא admin */}
              {user?.role === "admin" && (
                <li><NavLink to="/admin">Admin Panel</NavLink></li>
              )}
              
              {/* שינוי שם הכפתור לפי תפקיד */}
              <li>
                <NavLink to="/contact">
                  {user?.role === 'admin' ? "Inbox" : "Contact Us"}
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* צד ימין: פרטי המשתמש או כפתורי כניסה */}
        <div className="right-group">
          {user ? (
            // אם יש משתמש - הצג ברכה וכפתור התנתקות
            <>
              <div className="greeting">
                Hello, <strong>{user.displayName || user.email || "User"}</strong>
                {user.role === "admin" && (
                  <span style={{ fontSize: "10px", display: "block", color: "#e50914" }}>
                    Admin Account
                  </span>
                )}
              </div>
              <button className="vod-btn logout-inline" onClick={doLogout}>Logout</button>
            </>
          ) : (
            // אם אין משתמש - הצג כפתורי הרשמה וכניסה
            <>
              <NavLink to="/login" className="vod-btn logout-inline">Login</NavLink>
              <NavLink to="/signup" className="vod-btn logout-inline">Sign Up</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}