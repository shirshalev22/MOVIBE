import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * Hook לניהול משתמש ומועדפים.
 */
export default function useFavorites() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favs, setFavs] = useState(new Set()); 
  const favsUnsubRef = useRef(null);

  // מאזין בזמן אמת למצב המשתמש ולרשימת המועדפים שלו מול Firebase ומעדכן את האפליקציה בהתאם.
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userDocRef = doc(db, "users", u.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUser({ ...u, role: userData.role || "user" });
          } else {
            setUser(u); 
          }
        } catch (error) {
          setUser(u);
        }

        const favsCol = collection(db, "users", u.uid, "favorites");
        favsUnsubRef.current = onSnapshot(
          favsCol,
          (snap) => {
            const newIds = new Set();
            snap.forEach((d) => newIds.add(d.id));
            setFavs(newIds);
          },
          (err) => {
            setFavs(new Set());
          }
        );
      } else {
        // התנתקות: איפוס כל המצבים
        setUser(null);
        setFavs(new Set());
        if (favsUnsubRef.current) {
          favsUnsubRef.current();
          favsUnsubRef.current = null;
        }
      }
    });

    // ניקוי המאזינים ביציאה מהקומפוננטה
    return () => {
      unsubAuth();
      if (favsUnsubRef.current) favsUnsubRef.current();
    };
  }, []);

  /**
   * הוספה או הסרה של סרט מהמועדפים (Toggle)
   */
  const toggleFav = useCallback(
    async (imdbID) => {
      if (!user) {
        navigate("/login"); // אם לא מחובר, שלח לדף התחברות
        return;
      }
      const id = imdbID.trim();
      const ref = doc(db, "users", user.uid, "favorites", id);
      
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await deleteDoc(ref); // אם כבר קיים - הסר
        } else {
          await setDoc(ref, { createdAt: serverTimestamp() }); // אם לא קיים - הוסף
        }
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    },
    [user, navigate]
  );

  return { user, favs, toggleFav };
}