import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import useFavorites from '../hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const { user } = useFavorites();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "messages"), {
            subject,
            content,
            sender: isAnonymous ? "Anonymous" : (user?.displayName || user?.email || "User"), 
            userId: user?.uid,
            createdAt: serverTimestamp(),
        });
        setStatus("Message sent successfully!");
        setSubject(""); setContent("");
    } catch (err) { 
        console.error(err); 
        setStatus("Error sending message."); 
    }
    };

  if (!user) {
    return (
      <div className="container mt-5 text-center text-white p-5 border border-secondary rounded bg-dark">
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
        <form onSubmit={sendMessage} className="contact-form bg-dark p-4 rounded shadow border border-secondary" style={{ width: "100%", maxWidth: "500px" }}>
          
          {/* שדה נושא */}
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

          {/* שדה תוכן ההודעה */}
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
          
          {/* בחירת אנונימיות - הריווח מנוהל ב-index.css דרך ה-Class */}
          <div className="form-check mb-4 d-flex align-items-center">
            <input 
              type="checkbox" 
              className="form-check-input" 
              id="anon" 
              checked={isAnonymous} 
              onChange={(e) => setIsAnonymous(e.target.checked)} 
            />
            <label className="form-check-label" htmlFor="anon">
              Send as Anonymous
            </label>
          </div>
          
          <button className="btn btn-danger w-100 fw-bold shadow">Send Message</button>
          
          {status && <div className="mt-3 small text-center text-info">{status}</div>}
        </form>
      </div>
    </div>
  );
}