import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, setDoc, deleteDoc, onSnapshot, getDoc,
  collection, addDoc, query, orderBy, serverTimestamp 
} from "firebase/firestore";
import useVotes from "../hooks/useVotes"; 

export default function Info() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [isFav, setIsFav] = useState(false);

  const API_KEY = process.env.REACT_APP_OMDB_API_KEY;

  // States ללייקים
  const [meta, setMeta] = useState({ likes: 0, dislikes: 0, myVote: null });
  
  const { handleVote } = useVotes(user, (movieId, newMeta) => {
    setMeta(prev => ({ ...prev, ...newMeta }));
  });

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const MAX_CHARS = 100;
  const favUnsubRef = useRef(null);

  // 1. מאזין למשתמש ומועדפים
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (favUnsubRef.current) { favUnsubRef.current(); favUnsubRef.current = null; }
      if (u?.uid) {
        const favRef = doc(db, "users", u.uid, "favorites", id);
        favUnsubRef.current = onSnapshot(favRef, (snap) => setIsFav(snap.exists()));
      }
    });
    return () => { unsub(); if (favUnsubRef.current) favUnsubRef.current(); };
  }, [id]);

  // 2. מאזין בזמן אמת ללייקים
  useEffect(() => {
    if (!id) return;

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

  // 3. טעינת נתוני סרט
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://www.omdbapi.com/?i=${encodeURIComponent(id)}&apikey=${API_KEY}`);
        const data = await res.json();
        if (data.Response === "True") {
          setMovie(data);
          const genres = data.Genre ? data.Genre.split(",").map(g => g.trim()) : [];
          await setDoc(doc(db, "movies", id), { genres }, { merge: true });
        } else { setError(data.Error); }
      } catch (err) { setError("Server error"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  // 4. מאזין לתגובות
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "movies", id, "comments"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [id]);

  const toggleFav = async () => {
    if (!user) return navigate("/login");
    const favRef = doc(db, "users", user.uid, "favorites", id);
    if (isFav) await deleteDoc(favRef);
    else await setDoc(favRef, { createdAt: new Date() });
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    await addDoc(collection(db, "movies", id, "comments"), {
      text: commentText, userId: user.uid,
      userName: user.displayName || user.email || "User",
      createdAt: serverTimestamp()
    });
    setCommentText("");
  };

  return (
    <div className="info-page">
      <div className="container">
        {loading && <div className="info-loading"><div className="spinner-border text-danger"></div></div>}

        {!loading && movie && (
          <div className="info-card text-start">
            <button onClick={() => navigate(-1)} className="info-close">×</button>
            
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

                {/* שורת לייקים בגודל סטנדרטי (דומה לדף הבית) */}
                <div className="vote-row mt-4 d-flex gap-3">
                  <button 
                    className={`vote-btn ${meta.myVote === "like" ? "active" : ""}`} 
                    onClick={() => handleVote(movie, "like")}
                  >
                    <img src="/like.png" alt="like" className="vote-icon" style={{ width: '22px' }} />
                    <span className="vote-count" style={{ fontSize: '1.1rem' }}>{meta.likes}</span>
                  </button>

                  <button 
                    className={`vote-btn ${meta.myVote === "dislike" ? "active" : ""}`} 
                    onClick={() => handleVote(movie, "dislike")}
                  >
                    <img src="/dislike.png" alt="dislike" className="vote-icon" style={{ width: '22px' }} />
                    <span className="vote-count" style={{ fontSize: '1.1rem' }}>{meta.dislikes}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="internal-comments">
              <h4 className="comments-title">Community Comments ({comments.length})</h4>
              {user ? (
                <div className="comment-form">
                  <div className="comment-input-group">
                    <textarea className="comment-textarea" placeholder="Add a comment..." 
                              value={commentText} maxLength={MAX_CHARS} onChange={(e) => setCommentText(e.target.value)} />
                    <button onClick={handlePostComment} className="comment-submit-btn">Post</button>
                  </div>
                </div>
              ) : <p className="small muted">Login to comment.</p>}

              <div className="comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment-item text-end">
                    <div className="comment-header">
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