import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function AdminInbox() {
  // --- State לניהול רשימת ההודעות ---
  const [messages, setMessages] = useState([]);

  // useEffect שמתחיל להאזין להודעות ברגע שהדף נטען
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "messages"), (snap) => {
      // הופכים את המסמכים מה-DB למערך של אובייקטים ב-JS
      const msgs = snap.docs.map(d => ({ 
        id: d.id,      // ה-ID הייחודי של ההודעה
        ...d.data()    // כל שאר הנתונים (sender, subject, content...)
      }));

      // מיון ההודעות: מהחדשה ביותר (למעלה) לישנה ביותר
      // משתמשים ב-createdAt.seconds כדי להשוות בין זמני ה-Timestamp של פיירבייס
      setMessages(msgs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    // פונקציית ניקוי (Cleanup): מפסיקה את ההאזנה לשרת כשהמנהל יוצא מהדף
    return () => unsub();
  }, []);

  // פונקציה למחיקת הודעה
  const deleteMsg = (id) => {
    // וידוא מול המשתמש למניעת מחיקה שגויה
    if (window.confirm("Are you sure you want to delete this message?")) {
      // מחיקה פיזית מה-Database לפי ה-ID של המסמך
      deleteDoc(doc(db, "messages", id));
    }
  };

  return (
    <div className="container mt-4 text-white">
      <h1 className="text-center mb-5" style={{ color: "#e50914", fontWeight: "bold", fontSize: "2.5rem" }}>
        Admin Inbox
      </h1>
      
      {/* תצוגת גריד רספונסיבית - משתנה לפי גודל המסך (col-md-6, col-lg-4) */}
      <div className="row g-4">
        {messages.map(m => (
          <div key={m.id} className="col-md-6 col-lg-4">
            <div className="card admin-msg-card h-100 shadow-lg">
              <div className="card-body d-flex flex-column p-4">
                
                {/* כותרת ההודעה והשולח */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="text-truncate" style={{maxWidth: '85%'}}>
                    <h5 className="msg-subject mb-1">{m.subject || "No Subject"}</h5>
                    <span className="msg-sender">From: {m.sender}</span>
                  </div>
                  {/* כפתור מחיקה מהירה (×) */}
                  <button onClick={() => deleteMsg(m.id)} className="btn-delete-msg">
                    &times;
                  </button>
                </div>

                {/* תוכן ההודעה - משתמש ב-flex-grow-1 כדי למלא את גובה הכרטיסייה */}
                <div className="msg-content flex-grow-1 my-3">
                  {m.content}
                </div>

                {/* פוטר ההודעה - המרת ה-Timestamp לתאריך ושעה קריאים */}
                <div className="msg-footer pt-3 mt-auto d-flex justify-content-between">
                  <span>
                    {/* המרת שניות */}
                    {m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleDateString('he-IL') : "---"}
                  </span>
                  <span>
                    {/* חילוץ שעה ודקות בלבד */}
                    {m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) : ""}
                  </span>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* הודעה שמוצגת רק אם האינבוקס ריק */}
      {messages.length === 0 && (
        <div className="text-center mt-5 opacity-50">
          <p className="h4">No messages found.</p>
        </div>
      )}
    </div>
  );
}