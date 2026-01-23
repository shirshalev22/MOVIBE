import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDoc } from "firebase/firestore";

/**
 * כרטיס סרט בודד - משמש בדף הבית.
 * מציג פרטי סרט, אפשרות ללייק/מועדפים, ותצוגה מקדימה של תגובות.
 */
export default function MovieCard({
  movie,
  meta = { likes: 0, dislikes: 0, myVote: null },
  isFav,
  onToggleFav,
  onVote,
  filters,
}) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [userRole, setUserRole] = useState("user");

  // 1. בדיקת תפקיד המשתמש כדי לאפשר הרשאות ניהול (כמו מחיקת תגובות)
  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || "user");
          }
        } catch (err) {
          // שגיאה שקטה בטעינת תפקיד
        }
      }
    };
    fetchUserRole();
  }, [auth.currentUser]); 

  // 2. האזנה לתגובות בזמן אמת (Real-time) עבור הסרט הספציפי
  useEffect(() => {
    if (!movie?.imdbID) return;

    const q = query(
      collection(db, "movies", movie.imdbID, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [movie.imdbID]);

  /**
   * מחיקת תגובה - מורשה לבעל התגובה או למנהל מערכת
   */
  const handleDeleteComment = async (e, commentId) => {
    e.stopPropagation(); // מונע מעבר לדף המידע בלחיצה על ה-X
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteDoc(doc(db, "movies", movie.imdbID, "comments", commentId));
      } catch (err) {
        alert("Could not delete comment.");
      }
    }
  };

  const handleCardClick = () => {
    const params = new URLSearchParams(filters || {});
    navigate(`/info/${movie.imdbID}?${params.toString()}`);
  };

  return (
    <div className="movie-card" onClick={handleCardClick}>
      {/* תמונת הסרט עם טיפול במקרה של תמונה חסרה */}
      <div className="poster-box">
        {movie?.Poster && movie.Poster !== "N/A" ? (
          <img
            src={movie.Poster}
            onError={(e) => { 
              e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
            }} 
          />
        ) : (
          <div className="no-poster">No Image Available</div>
        )}
      </div>

      <div className="card-body-eq">
        {/* פרטי הסרט */}
        <h5 className="card-title text-start">{movie?.Title}</h5>
        <p className="movie-year text-start">Year: {movie?.Year}</p>

        {/* שורת אינטראקציה: מועדפים והצבעות */}
        <div className="interaction-row">
          <div className="actions">
            <button
              type="button"
              className={`fav-btn ${isFav ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav(movie.imdbID);
              }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12.1 8.64l-.1.1-.1-.1c-1.96-1.88-4.99-1.88-6.86-.02-1.86 1.86-1.86 4.9 0 6.76L12 21.5l6.96-6.62c1.86-1.86 1.86-4.9 0-6.76-1.87-1.86-4.9-1.86-6.86.02z" 
                      fill={isFav ? "currentColor" : "none"} 
                      stroke="currentColor" strokeWidth="2.2" />
              </svg>
            </button>
          </div>

          <div className="vote-row">
            <button 
              className={`vote-btn ${meta?.myVote === "like" ? "active" : ""}`} 
              onClick={(e) => { e.stopPropagation(); onVote?.("like"); }}
            >
              <img src="/like.png" className="vote-icon" alt="like" />
              <span className="vote-count">{meta?.likes || 0}</span>
            </button>
            <button 
              className={`vote-btn ${meta?.myVote === "dislike" ? "active" : ""}`} 
              onClick={(e) => { e.stopPropagation(); onVote?.("dislike"); }}
            >
              <img src="/dislike.png" className="vote-icon" alt="dislike" />
              <span className="vote-count">{meta?.dislikes || 0}</span>
            </button>
          </div>
        </div>

        {/* בועות תגובות - מציג את התגובות האחרונות */}
        <div className="home-comments-list">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="home-comment-bubble">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="home-comment-user text-truncate">
                    {c.userName?.split(' ')[0]}
                    {c.userId === auth.currentUser?.uid && <small className="my-tag"> (me)</small>}
                  </span>
                  
                  {/* הרשאות מחיקה: רק ליוצר התגובה או למנהל */}
                  {(c.userId === auth.currentUser?.uid || userRole === "admin") && (
                    <button className="delete-comment-x" onClick={(e) => handleDeleteComment(e, c.id)}>×</button>
                  )}
                </div>
                <p className="home-comment-text">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="no-comments-text">No comments yet...</p>
          )}
        </div>
      </div>
    </div>
  );
}