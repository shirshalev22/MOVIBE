import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import useFavorites from '../hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  // --- שליפת מידע על המשתמש  ---
  const { user } = useFavorites();
  const navigate = useNavigate();

  // --- States לניהול שדות הטופס ---
  const [subject, setSubject] = useState(""); // נושא הפנייה
  const [content, setContent] = useState(""); // תוכן ההודעה
  const [isAnonymous, setIsAnonymous] = useState(false); // האם המשתמש רוצה להישאר אנונימי
  const [status, setStatus] = useState(""); // הודעת סטטוס (הצלחה/שגיאה)

  // פונקציה לשליחת ההודעה ל-Firestore
  const sendMessage = async (e) => {
    e.preventDefault(); // מניעת רענון הדף בעת שליחת טופס
    try {
      // יצירת מסמך חדש בתוך אוסף ההודעות (messages)
      await addDoc(collection(db, "messages"), {
        subject,
        content,
        // לוגיקה לקביעת זהות השולח:
        sender: isAnonymous ? "Anonymous" : (user?.displayName || user?.email || "User"), 
        userId: user?.uid, // שומרים את ה-ID לצרכי מעקב של המנהל
        createdAt: serverTimestamp(), // חותמת זמן של שרתי גוגל
      });

      // הצלחה: עדכון המשתמש ואיפוס השדות
      setStatus("Message sent successfully!");
      setSubject(""); 
      setContent("");
    } catch (err) { 
      console.error(err); 
      setStatus("Error sending message."); 
    }
  };

  // --- הגנה: אם המשתמש לא מחובר, הוא לא יכול לראות את הטופס ---
  if (!user) {
    return (
      <div className="container mt-5 text-center text-white p-5 border border-secondary rounded bg-dark shadow-lg">
        <h2 className="mb-4">Want to get in touch?</h2>
        <p className="opacity-75 mb-4">Please log in to send reports, suggestions, or requests to the admin.</p>
        <button className="btn btn-danger px-4 fw-bold" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container text-white">
      <h1 className="text-center mt-5 mb-2 contact-title">Contact Us</h1>
      <p className="text-center opacity-75 mb-4">Report issues, suggest features, or request changes</p>
      
      <div className="contact-container d-flex justify-content-center">
        {/* טופס יצירת קשר */}
        <form onSubmit={sendMessage} className="contact-form bg-dark p-4 rounded shadow border border-secondary" style={{ width: "100%", maxWidth: "500px" }}>
          
          {/* שדה נושא - חובה (required) */}
          <div className="mb-3">
            <input 
              type="text"
              className="form-control" 
              placeholder="Subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              required 
            />
          </div>

          {/* שדה תוכן ההודעה - חובה */}
          <div className="mb-3">
            <textarea 
              className="form-control" 
              placeholder="Tell us more about it..." 
              rows="5" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              required 
            ></textarea>
          </div>
          
          {/* אפשרות לשליחה אנונימית */}
          <div className="form-check mb-4 d-flex align-items-center">
            <input 
              type="checkbox" 
              className="form-check-input" 
              id="anon" 
              checked={isAnonymous} 
              onChange={(e) => setIsAnonymous(e.target.checked)} 
            />
            <label className="form-check-label ms-2" htmlFor="anon">
              Send as Anonymous
            </label>
          </div>
          
          <button className="btn btn-danger w-100 fw-bold shadow">Send Message</button>
          
          {/* הודעת סטטוס שמופיעה רק אחרי ניסיון שליחה */}
          {status && <div className="mt-3 small text-center text-info">{status}</div>}
        </form>
      </div>
    </div>
  );
}