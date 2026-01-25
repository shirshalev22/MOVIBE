import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/**
 * useVotes - Hook לניהול הלייקים.
 * @param {Object} user - המשתמש המחובר (מגיע מ-useFavorites)
 * @param {Function} setMovieMeta - פונקציה לעדכון ה-State של הסרטים בדף הבית
 */
export default function useVotes(user, setMovieMeta) {
  const navigate = useNavigate();

  const handleVote = useCallback(
    async (movie, type) => {
      // 1. אבטחה: הצבעה מותרת רק למשתמשים רשומים
      if (!user) return navigate("/login");
      if (!movie?.imdbID) return;

      const imdbID = movie.imdbID;
      const movieRef = doc(db, "movies", imdbID); // קישור למסמך המונה הכללי
      const voteRef = doc(db, "movies", imdbID, "votes", user.uid); // קישור להצבעה האישית

      try {
        // 2. תחילת הטרנזקציה
        await runTransaction(db, async (tx) => {
          // קריאת המצב הקיים מה-DB לפני ביצוע שינויים
          const movieSnap = await tx.get(movieRef);
          const voteSnap = await tx.get(voteRef);

          let likes = movieSnap.exists() ? movieSnap.data().likes || 0 : 0;
          let dislikes = movieSnap.exists() ? movieSnap.data().dislikes || 0 : 0;
          const currentVoteType = voteSnap.exists() ? voteSnap.data().type : null;

          if (currentVoteType === type) {
            // מקרה א: ביטול הצבעה קיימת (לחיצה חוזרת על אותו כפתור)
            if (type === "like") likes = Math.max(0, likes - 1);
            else dislikes = Math.max(0, dislikes - 1);

            tx.set(movieRef, { likes, dislikes }, { merge: true });
            tx.delete(voteRef); // מחיקת רישום ההצבעה מה-Sub-collection
          } else {
            // מקרה ב: הצבעה חדשה או שינוי (מ-Like ל-Dislike ולהפך)
            if (type === "like") {
              likes += 1;
              // אם הוא עובר מ-Dislike, צריך להוריד מהמונה הישן
              if (currentVoteType === "dislike") dislikes = Math.max(0, dislikes - 1);
            } else {
              dislikes += 1;
              if (currentVoteType === "like") likes = Math.max(0, likes - 1);
            }

            // עדכון המונים הכלליים של הסרט
            tx.set(movieRef, { likes, dislikes }, { merge: true });
            // שמירת ההצבעה הספציפית של המשתמש כדי שלא יוכל להצביע פעמיים
            tx.set(voteRef, {
              type,
              userId: user.uid,
              updatedAt: serverTimestamp(),
            });
          }
        });

        // 3. עדכון UI אופטימי (Optimistic Update)
        // מעדכן את ה-State של דף הבית מיד כדי שהמספר בכרטיס ישתנה בלי לחכות לשרת
        if (typeof setMovieMeta === "function") {
          setMovieMeta((prev) => {
            const old = prev?.[imdbID] || { likes: 0, dislikes: 0, myVote: null, genres: [] };
            let { likes, dislikes, myVote, genres } = old;

            if (myVote === type) {
              if (type === "like") likes = Math.max(0, likes - 1);
              else dislikes = Math.max(0, dislikes - 1);
              myVote = null;
            } else {
              if (type === "like") {
                likes += 1;
                if (myVote === "dislike") dislikes = Math.max(0, dislikes - 1);
              } else {
                dislikes += 1;
                if (myVote === "like") likes = Math.max(0, likes - 1);
              }
              myVote = type;
            }
            return { ...prev, [imdbID]: { likes, dislikes, myVote, genres } };
          });
        }
      } catch (err) {
        console.error("Transaction failed: ", err);
      }
    },
    [user, navigate, setMovieMeta]
  );

  return { handleVote };
}