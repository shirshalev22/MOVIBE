import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth"; //בודק האם יש משתמש מחובר
import { 
  doc, setDoc, deleteDoc, onSnapshot,
  collection, addDoc, query, orderBy, serverTimestamp 
} from "firebase/firestore";
import useVotes from "../hooks/useVotes"; 
import { useFavorites } from '../hooks/useFavorites';

export default function Info() {
  // --- שליפת פרמטרים וניווט ---
  const { id } = useParams(); // ה-ID של הסרט (למשל tt12345) מתוך הכתובת ב-URL
  const navigate = useNavigate(); // כלי למעבר בין דפים (כמו חזרה אחורה)

  // --- ניהול מצב (State) של הדף ---
  const [movie, setMovie] = useState(null); // המידע הטכני מה-API (שחקנים, עלילה...)
  const [loading, setLoading] = useState(false); // מצב טעינה למסך (ספינר)
  const [error, setError] = useState(""); // הודעות שגיאה
  const [user, setUser] = useState(null); // המשתמש המחובר כרגע
  const [isFav, setIsFav] = useState(false); // האם הסרט נמצא ברשימת המועדפים של המשתמש?

  const API_KEY = process.env.REACT_APP_OMDB_API_KEY;

  // --- ניהול לייקים (Meta) ---
  const [meta, setMeta] = useState({ likes: 0, dislikes: 0, myVote: null });
  
  // שימוש ב-Hook חיצוני לניהול ההצבעות כדי לשמור על קוד נקי
  const { handleVote } = useVotes(user, (movieId, newMeta) => {
    setMeta(prev => ({ ...prev, ...newMeta }));
  });

  // --- ניהול תגובות ---
  const [commentText, setCommentText] = useState(""); // הטקסט שהמשתמש מקליד בתיבת התגובה
  const [comments, setComments] = useState([]); // מערך של כל התגובות שנמשכו מה-DB
  const MAX_CHARS = 100; // הגבלה על אורך התגובה
  const favUnsubRef = useRef(null); // רפרנס לפונקציית הניתוק מהמאזין למועדפים (למניעת זליגת זיכרון)

  // מאזין למצב המשתמש (Auth) ולמועדפים שלו
  useEffect(() => {
    // onAuthStateChanged בודק בכל רגע אם יש משתמש מחובר
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      
      // אם היה מאזין קודם למועדפים, אנחנו מנתקים אותו (חשוב כשמשתמש מתנתק/מתחבר)
      if (favUnsubRef.current) { favUnsubRef.current(); favUnsubRef.current = null; }
      
      // אם יש משתמש, אנחנו מאזינים ספציפית למסמך המועדפים שלו לסרט הזה
      if (u?.uid) {
        const favRef = doc(db, "users", u.uid, "favorites", id);
        // onSnapshot מעדכן את המשתנה isFav ברגע שיש שינוי ב-DB (הוספה/הסרה מהלב)
        favUnsubRef.current = onSnapshot(favRef, (snap) => setIsFav(snap.exists()));
      }
    });
    // ניקוי המאזינים כשהמשתמש עוזב את הדף
    return () => { unsub(); if (favUnsubRef.current) favUnsubRef.current(); };
  }, [id]);

  //מאזין בזמן אמת לסטטיסטיקות (לייקים) ולבחירה האישית של המשתמש
  useEffect(() => {
    if (!id) return;

    // האזנה למסמך הסרט ב-Firestore כדי לעדכן מונה לייקים כללי
    const movieUnsub = onSnapshot(doc(db, "movies", id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMeta(prev => ({
          ...prev,
          likes: data.likes || 0,
          dislikes: data.dislikes || 0
        }));
      }
    });

    // האזנה להצבעה הספציפית של המשתמש הנוכחי (האם הוא סימן לייק בעבר?)
    let voteUnsub = () => {};
    if (user) {
      voteUnsub = onSnapshot(doc(db, "movies", id, "votes", user.uid), (snap) => {
        setMeta(prev => ({
          ...prev,
          myVote: snap.exists() ? snap.data().type : null
        }));
      });
    }

    return () => { movieUnsub(); voteUnsub(); };
  }, [id, user]);

  // טעינת נתוני סרט מה-API החיצוני (OMDb)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // קריאת Fetch ל-API עם ה-ID של הסרט
        const res = await fetch(`https://www.omdbapi.com/?i=${encodeURIComponent(id)}&apikey=${API_KEY}`);
        const data = await res.json();
        
        if (data.Response === "True") {
          setMovie(data);
          const genres = data.Genre ? data.Genre.split(",").map(g => g.trim()) : [];
          await setDoc(doc(db, "movies", id), { genres }, { merge: true });
        } else { setError(data.Error); }
      } catch (err) { 
        setError("Server error"); 
      }finally { 
        setLoading(false); 
      }
    };
    load();
  }, [id]);

  //מאזין לתגובות של הקהילה בזמן אמת
  useEffect(() => {
    if (!id) return;
    // יצירת שאילתה שמביאה את התגובות של הסרט ומסדרת אותן מהחדש לישן
    const q = query(collection(db, "movies", id, "comments"), orderBy("createdAt", "desc"));
    // onSnapshot דואג שכל תגובה חדשה שתתווסף תופיע מיד על המסך
    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [id]);

  // פונקציית הוספה/הסרה מהמועדפים (Favorites)
  const toggleFav = async () => {
    if (!user) return navigate("/login"); // אם לא מחובר, שלח אותו להתחבר
    const favRef = doc(db, "users", user.uid, "favorites", id);
    if (isFav) {
      await deleteDoc(favRef); // אם כבר במועדפים - תסיר
    } else {
      await setDoc(favRef, { createdAt: new Date() }); // אם לא - תוסיף מסמך חדש
    }
  };

  // פונקציית שליחת תגובה חדשה
  const handlePostComment = async (e) => {
    e.preventDefault(); // מניעת רענון דף
    if (!commentText.trim() || !user) return; // בדיקה שהתגובה לא ריקה ושמחובר משתמש
    
    // הוספת מסמך חדש לתת-אוסף (Sub-collection) של התגובות בתוך הסרט
    await addDoc(collection(db, "movies", id, "comments"), {
      text: commentText,
      userId: user.uid,
      userName: user.displayName || user.email || "User",
      createdAt: serverTimestamp() // שימוש בזמן שרת (גוגל) לדיוק מקסימלי
    });
    setCommentText(""); // ניקוי התיבה לאחר השליחה
  };

  return (
    <div className="info-page">
      <div className="container">
        {/* הצגת ספינר בזמן טעינה */}
        {loading && <div className="info-loading"><div className="spinner-border text-danger"></div></div>}

        {error && <div className="alert alert-danger text-center">{error}</div>}

        {!loading && movie && (
          <div className="info-card text-start">
            {/* כפתור סגירה - חוזר דף אחד אחורה בהיסטוריה */}
            <button onClick={() => navigate(-1)} className="info-close">×</button>
            
            {/* כפתור מועדפים (הלב) - משנה צבע אם isFav אמת */}
            <button onClick={toggleFav} className={`info-fav-btn ${isFav ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M12.1 8.64l-.1.1-.1-.1c-1.96-1.88-4.99-1.88-6.86-.02-1.86 1.86-1.86 4.9 0 6.76L12 21.5l6.96-6.62c1.86-1.86 1.86-4.9 0-6.76-1.87-1.86-4.9-1.86-6.86.02z" 
                      fill={isFav ? "red" : "none"} stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            <h2 className="info-title">{movie.Title}</h2>
            
            <div className="info-content">
              <div className="info-poster-wrap">
                <img src={movie.Poster} alt={movie.Title} className="info-poster" 
                     onError={(e) => e.target.src = "https://via.placeholder.com/300x450"} />
              </div>
              <div className="info-details">
                <p><b>Actors:</b> {movie.Actors}</p>
                <p><b>IMDB Rating:</b> {movie.imdbRating}</p>
                <p><b>Year:</b> {movie.Year}</p>
                <p><b>Genre:</b> {movie.Genre}</p>
                <p className="info-plot"><b>Plot:</b> {movie.Plot}</p>

                {/* מערכת ההצבעות (לייק/דיסלייק) */}
                <div className="vote-row mt-4 d-flex gap-3">
                  <button 
                    className={`vote-btn ${meta.myVote === "like" ? "active" : ""}`} 
                    onClick={() => handleVote(movie, "like")}
                  >
                    <img src="/like.png" alt="like" className="vote-icon" style={{ width: '22px' }} />
                    <span className="vote-count">{meta.likes}</span>
                  </button>

                  <button 
                    className={`vote-btn ${meta.myVote === "dislike" ? "active" : ""}`} 
                    onClick={() => handleVote(movie, "dislike")}
                  >
                    <img src="/dislike.png" alt="dislike" className="vote-icon" style={{ width: '22px' }} />
                    <span className="vote-count">{meta.dislikes}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* אזור התגובות */}
            <div className="internal-comments">
              <h4 className="comments-title">Community Comments ({comments.length})</h4>
              
              {/* הצגת טופס תגובה רק אם המשתמש מחובר */}
              {user ? (
                <div className="comment-form">
                  <div className="comment-input-group">
                    <textarea className="comment-textarea" placeholder="Add a comment..." 
                              value={commentText} maxLength={MAX_CHARS} onChange={(e) => setCommentText(e.target.value)} />
                    <button onClick={handlePostComment} className="comment-submit-btn">Post</button>
                  </div>
                </div>
              ) : <p className="small muted">Login to comment.</p>}

              {/* רשימת התגובות שרצות בלולאת map */}
              <div className="comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment-item text-end">
                    <div className="comment-header">
                      {/* המרה של תאריך ה-Firestore לתצוגה ידידותית בעברית */}
                      <span className="comment-date">{c.createdAt?.toDate?.()?.toLocaleDateString('he-IL')}</span>
                      <span className="comment-user">{c.userName}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}