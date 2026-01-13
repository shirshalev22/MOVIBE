import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import useFavorites from "../hooks/useFavorites";

export default function Header() {
  // שליפת המשתמש הנוכחי והתפקיד שלו (User/Admin) מתוך ה-Hook
  const { user } = useFavorites(); 
  const navigate = useNavigate();

  /**
   * פונקציה לביצוע התנתקות מהמערכת
   * משתמשת בשירות ה-Auth של פיירבייס ומפנה לדף ההתחברות
   */
  const doLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      alert("Logout failed, try again.");
    }
  };

  return (
    <header className="navbar">
      <div className="header-inner container">
        
        {/* צד שמאל: לוגו ותפריט ניווט ראשי */}
        <div className="left-group">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      
            {/* הלוגו עצמו */}
            <Link to="/" className="brand" style={{ marginBottom: '0', paddingBottom: '0' }}>
              <span>MOVIBE</span>
            </Link>

            <small style={{ 
              fontSize: '10px', 
              color: '#cfd3d7', 
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginTop: '-5px', 
              paddingLeft: '2px' 
            }}>
              The movie to your vibe
            </small>
      
          </div>

          <nav>
            <ul className="nav-list">
              <li>
                <NavLink to="/" end>Home</NavLink>
              </li>
              <li>
                <NavLink to="/favorites">Favorites</NavLink>
              </li>
              <li>
                <NavLink to="/map">Map</NavLink>
              </li>
              
              {/* אבטחת ממשק: כפתור ניהול שמוצג רק למשתמש עם הרשאת אדמין */}
              {user?.role === "admin" && (
                <li>
                  <NavLink to="/admin">
                    Admin Panel
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* צד ימין: פרטי משתמש מחובר או כפתורי התחברות */}
        <div className="right-group">
          {user ? (
            <>
              <div className="greeting">
                Hello, <strong>{user.displayName || user.email || "User"}</strong>
                {user.role === "admin" && (
                  <span style={{ fontSize: "10px", display: "block", color: "#e50914" }}>
                    Admin Account
                  </span>
                )}
              </div>
              <button className="vod-btn logout-inline" onClick={doLogout}>
                Logout
              </button>
            </>
          ) : (
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