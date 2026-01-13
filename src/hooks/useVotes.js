import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/**
 * Hook לניהול מערכת ההצבעות (Likes/Dislikes).
 * משתמש ב-Transactions כדי להבטיח אטומיות וסנכרון נכון של המונים.
 */
export default function useVotes(user, setMovieMeta) {
  const navigate = useNavigate();

  const handleVote = useCallback(
    async (movie, type) => {
      // 1. הגנה: רק משתמש מחובר יכול להצביע
      if (!user) return navigate("/login");

      if (!movie?.imdbID) return;

      const imdbID = movie.imdbID;
      const movieRef = doc(db, "movies", imdbID);
      const voteRef = doc(db, "movies", imdbID, "votes", user.uid);

      try {
        // 2. הרצת טרנזקציה: מבטיחה שקריאת הנתונים והכתיבה שלהם קורות כפעולה אחת בלתי ניתנת להפרדה
        await runTransaction(db, async (tx) => {
          const movieSnap = await tx.get(movieRef);
          const voteSnap = await tx.get(voteRef);

          let likes = movieSnap.exists() ? movieSnap.data().likes || 0 : 0;
          let dislikes = movieSnap.exists() ? movieSnap.data().dislikes || 0 : 0;
          const currentVoteType = voteSnap.exists() ? voteSnap.data().type : null;

          if (currentVoteType === type) {
            // ביטול הצבעה קיימת (לחיצה נוספת על אותו כפתור)
            if (type === "like") likes = Math.max(0, likes - 1);
            else dislikes = Math.max(0, dislikes - 1);

            tx.set(movieRef, { likes, dislikes }, { merge: true });
            tx.delete(voteRef);
          } else {
            // שינוי הצבעה או הצבעה חדשה
            if (type === "like") {
              likes += 1;
              if (currentVoteType === "dislike") dislikes = Math.max(0, dislikes - 1);
            } else {
              dislikes += 1;
              if (currentVoteType === "like") likes = Math.max(0, likes - 1);
            }

            tx.set(movieRef, { likes, dislikes }, { merge: true });
            tx.set(voteRef, {
              type,
              userId: user.uid,
              updatedAt: serverTimestamp(),
            });
          }
        });

        // 3. עדכון אופטימי של ה-UI: מעדכן את המצב המקומי מיד בלי לחכות ל-DB
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