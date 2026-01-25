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
  query,   
  orderBy  
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function useFavorites() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  const [favs, setFavs] = useState(new Set()); // שימוש ב-Set לחיפוש מהיר (O(1))
  
  const favsUnsubRef = useRef(null); // שמירת רפרנס לניתוק המאזין

  useEffect(() => {
    // מאזין לשינויי סטטוס התחברות
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          // שליפת Metadata של המשתמש מה-DB 
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

        // --- הגדרת שאילתה ממוינת לפי זמן הוספה (מהחדש לישן) ---
        const favsCol = collection(db, "users", u.uid, "favorites");
        const q = query(favsCol, orderBy("createdAt", "desc")); 

        // האזנה בזמן אמת לשינויים באוסף המועדפים
        favsUnsubRef.current = onSnapshot(q, (snap) => {
          const newIds = new Set();
          // ה-snap חוזר ממוין מהשרת בזכות ה-query
          snap.forEach((d) => newIds.add(d.id));
          setFavs(newIds); 
        });
        
      } else {
        // איפוס נתונים וניתוק מאזינים בעת התנתקות
        setUser(null);
        setFavs(new Set());
        if (favsUnsubRef.current) {
          favsUnsubRef.current(); 
          favsUnsubRef.current = null;
        }
      }
    });

    //ניקוי מאזינים עם הסרת הרכיב 
    return () => {
      unsubAuth();
      if (favsUnsubRef.current) favsUnsubRef.current();
    };
  }, []);

  /**
   *  פונקציה להוספה/הסרה של מועדף
   */
  const toggleFav = useCallback(
    async (imdbID) => {
      if (!user) {
        navigate("/login");
        return;
      }
      
      const id = imdbID.trim();
      const ref = doc(db, "users", user.uid, "favorites", id);
      
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          // מחיקת מסמך קיים
          await deleteDoc(ref);
        } else {
          // יצירת מסמך חדש עם חותמת זמן של השרת לצורך המיון
          await setDoc(ref, { createdAt: serverTimestamp() });
        }
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    },
    [user, navigate]
  );

  return { user, favs, toggleFav };
}