import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  // --- ניהול ה-State של השדות בטופס ---
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false); // מצב תצוגת סיסמה (גלוי/חבוי)
  const [showConfirm, setShowConfirm] = useState(false); // מצב תצוגת אימות סיסמה
  const [error, setError] = useState(""); // אחסון הודעות שגיאה לתצוגה
  const [loading, setLoading] = useState(false); // מניעת לחיצות כפולות בזמן שליחה
  const navigate = useNavigate();

  // פונקציית עזר לבדיקת תקינות אימייל באמצעות Regex
  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  // --- הפונקציה המרכזית שרצה בעת שליחת הטופס ---
  const onSubmit = async (e) => {
    e.preventDefault(); // מניעת רענון הדף האוטומטי של הדפדפן
    setError("");

    // וולידציה (בדיקות תקינות) מקומית לפני הפנייה לשרת
    const nameTrim = displayName.trim();
    const emailTrim = email.trim();

    if (!emailTrim || !password) {
      setError("Please fill in email and password.");
      return;
    }
    if (!isValidEmail(emailTrim)) {
      setError("Invalid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // 1. יצירת חשבון ב-Firebase Authentication (מייל וסיסמה)
      const cred = await createUserWithEmailAndPassword(auth, emailTrim, password);

      // 2. עדכון שם המשתמש בפרופיל ה-Auth (כיוון ש-Firebase לא עושה זאת בשלב הרישום)
      if (nameTrim) {
        await updateProfile(cred.user, { displayName: nameTrim });
      }

      // 3. יצירת מסמך משתמש ב-Firestore (באוסף users) לשמירת מידע נוסף כמו תאריך ותפקיד
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: nameTrim || null,
        createdAt: serverTimestamp(), // חותמת זמן של השרת
      });

      // ניווט לדף הבית לאחר הצלחה
      navigate("/");
    } catch (err) {
      // 4. מנגנון תרגום שגיאות - הופכת קודים טכניים למשפטים ברורים למשתמש
      const map = { 
        "auth/email-already-in-use": "This email is already in use.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/invalid-email": "Invalid email address.",
        "auth/network-request-failed": "Network error. Check your connection.",
      };
      setError(map[err.code] || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-narrow auth-compact">
      <h1 className="mb-4">Sign Up</h1>

      <form onSubmit={onSubmit} noValidate className="vod-card">
        {/* שדה שם מלא */}
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>

        {/* שדה אימייל */}
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            required
          />
        </div>

        {/* שדה סיסמה עם לוגיקת הצגה/הסתרה (Type Toggle) */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="pwd-wrap">
            <input
              type={showPass ? "text" : "password"} // שינוי הטיפוס חושף/מסתיר את הטקסט
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              required
            />
            <button type="button" className="pwd-toggle" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeIconOpen /> : <EyeIconClosed />}
            </button>
          </div>
        </div>

        {/* שדה אימות סיסמה */}
        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <div className="pwd-wrap">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
            <button type="button" className="pwd-toggle" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeIconOpen /> : <EyeIconClosed />}
            </button>
          </div>
        </div>

        {/* הצגת הודעת שגיאה אם קיימת ב-State */}
        {error && <div className="text-danger mb-3 small">{error}</div>}

        {/* כפתור שליחה: הופך למושבת (Disabled) בזמן טעינה כדי למנוע כפילויות */}
        <button type="submit" className="vod-btn" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {/* קישור למעבר מהיר לדף התחברות */}
        <div className="mt-4 text-center small">
          <span className="text-white">Already have an account? </span>
          <span 
            className="ms-1" 
            style={{ color: '#e50914', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => navigate("/login")}
          >
            Login here
          </span>
        </div>
      </form>
    </div>
  );
}

// --- רכיבי SVG קטנים לאייקונים של העין ---
const EyeIconOpen = () => (
  <svg viewBox="0 0 24 24" width="20"><path fill="currentColor" d="M12 5c-4.5 0-8.4 2.6-10 7 1.6 4.4 5.5 7 10 7s8.4-2.6 10-7c-1.6-4.4-5.5-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
);
const EyeIconClosed = () => (
  <svg viewBox="0 0 24 24" width="20"><path fill="currentColor" d="M3.3 2.3 2 3.6l3 3A12.7 12.7 0 0 0 2 12c1.6 4.4 5.5 7 10 7 2.1 0 4-.5 5.7-1.5l3.3 3.3 1.3-1.3-20-17.2zM12 17c-3.2 0-6.1-1.8-7.7-5 1-1.9 2.6-3.3 4.5-4.1l1.7 1.5A5 5 0 0 0 12 17zm9.7-5c-1.1-2.7-3-4.7-5.4-5.8A10.8 10.8 0 0 0 12 5c-.7 0-1.5.1-2.2.2l1.7 1.5c.2 0 .3 0 .5 0a5 5 0 0 1 5 5c0 .2 0 .3 0 .5L19 13c1-.5 1.9-1.1 2.7-2z"/></svg>
);