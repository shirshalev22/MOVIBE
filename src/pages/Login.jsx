import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth"; // הפונקציה שמבצעת את החיבור בפועל
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  // --- הגדרת המשתנים של הדף (State) ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false); // שולט על תצוגת הסיסמה
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // מונע לחיצות כפולות
  const navigate = useNavigate(); // כלי לניווט בין דפים

  // --- הפונקציה שמופעלת בלחיצה על כפתור הלוגין ---
  const onSubmit = async (e) => {
    e.preventDefault(); 
    setError(""); // איפוס שגיאות קודמות

    // בדיקת קלט בסיסית (וולידציה) צד לקוח
    if (!email.trim() || !password) {
      return setError("Please fill in all fields.");
    }

    try {
      setLoading(true); // תחילת תהליך תקשורת
      // שליחת הבקשה ל-Firebase Authentication
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // אם הצלחנו להגיע לשורה הזו - המשתמש מחובר! עוברים לדף הבית
      navigate("/");
    } catch (err) {
      // --- אלגוריתם מיפוי שגיאות: הופך קוד טכני להודעה ידידותית ---
      const map = { 
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/user-not-found": "User not found. Check your email or sign up.",
        "auth/invalid-email": "Invalid email address.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      // הצגת ההודעה מהמפה, או הודעה כללית אם הקוד לא מוכר
      setError(map[err.code] || "Login failed. Please try again.");
    } finally {
      setLoading(false); // סיום מצב טעינה (בין אם הצלחנו ובין אם נכשלנו)
    }
  };

  return (
    <div className="container page-narrow auth-compact">
      <h1 className="mb-4">Login</h1>

      <form onSubmit={onSubmit} noValidate className="vod-card">
        {/* שדה אימייל */}
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="text" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
          />
        </div>

        {/* שדה סיסמה עם כפתור עין (Toggle) */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="pwd-wrap">
            <input
              type={showPass ? "text" : "password"} // שינוי הטיפוס חושף/מסתיר את הטקסט
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {/* כפתור העין - משנה את המצב של showPass בלחיצה */}
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPass(!showPass)}
              tabIndex="-1" 
            >
              {showPass ? (
                /* אייקון עין פתוחה */
                <svg viewBox="0 0 24 24" width="20"><path fill="currentColor" d="M12 5c-4.5 0-8.4 2.6-10 7 1.6 4.4 5.5 7 10 7s8.4-2.6 10-7c-1.6-4.4-5.5-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
              ) : (
                /* אייקון עין סגורה */
                <svg viewBox="0 0 24 24" width="20"><path fill="currentColor" d="M3.3 2.3 2 3.6l3 3A12.7 12.7 0 0 0 2 12c1.6 4.4 5.5 7 10 7 2.1 0 4-.5 5.7-1.5l3.3 3.3 1.3-1.3-20-17.2zM12 17c-3.2 0-6.1-1.8-7.7-5 1-1.9 2.6-3.3 4.5-4.1l1.7 1.5A5 5 0 0 0 12 17zm9.7-5c-1.1-2.7-3-4.7-5.4-5.8A10.8 10.8 0 0 0 12 5c-.7 0-1.5.1-2.2.2l1.7 1.5c.2 0 .3 0 .5 0a5 5 0 0 1 5 5c0 .2 0 .3 0 .5L19 13c1-.5 1.9-1.1 2.7-2z"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* הצגת הודעת שגיאה אם יש כזו ב-State */}
        {error && <div className="text-danger mb-3 small">{error}</div>}

        {/* כפתור התחברות - מושבת בזמן טעינה כדי למנוע כפילויות */}
        <button type="submit" className="vod-btn" disabled={loading}>
          {loading ? "Connecting..." : "Login"}
        </button>
        
        {/* ניווט לדף הרשמה */}
        <div className="mt-4 text-center small">
          <span className="text-white">Don't have an account? </span>
          <span 
            className="ms-1" 
            style={{ color: '#e50914', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </div>
      </form>
    </div>
  );
}