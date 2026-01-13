
import { auth, db, ts } from "../config/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  onSnapshot
} from "firebase/firestore";

/** * פונקציית עזר פנימית שמוודאת שהמשתמש מחובר.
 * מונעת קריסות ומבטיחה שיש UID תקין לפני גישה ל-DB.
 */
function requireUid() {
  const user = auth.currentUser;
  if (!user) throw new Error("User is not signed in");
  return user.uid;
}

/** * יוצר את נתיב המסמך ב-DB: 
 * users -> [User ID] -> favorites -> [Movie ID]
 */
function favDocRef(imdbID) {
  const uid = requireUid();
  return doc(db, "users", uid, "favorites", imdbID);
}

/** * הוספת סרט למועדפים. 
 * שימי לב: את שומרת כאן מידע בסיסי (Title, Poster) כדי שבדף המועדפים 
 * לא תצטרכי לעשות שוב fetch ל-API של OMDB. זה חוסך זמן טעינה יקר!
 */
export async function addFavorite(movie) {
  const ref = favDocRef(movie.imdbID);
  await setDoc(ref, {
    title: movie.Title ?? "",
    year: movie.Year ?? "",
    poster: movie.Poster ?? "N/A",
    updatedAt: ts()
  }, { merge: true }); // merge מונע דריסת שדות אחרים אם קיימים
}

/** הסרה ממועדפים */
export async function removeFavorite(imdbID) {
  const ref = favDocRef(imdbID);
  await deleteDoc(ref);
}

/** בדיקה חד-פעמית (למשל בזמן טעינת דף ה-Info) */
export async function isFavorite(imdbID) {
  try {
    const ref = favDocRef(imdbID);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * פונקציית Real-time:
 * מאפשרת לדף ה"מועדפים" להתעדכן מיד ברגע שהמשתמש מסיר סרט, 
 * בלי צורך לרענן את הדף.
 */
export function subscribeFavorites(callback) {
  const uid = requireUid();
  const coll = collection(db, "users", uid, "favorites");
  
  // onSnapshot הוא ה"קסם" של Firebase שמאזין לשינויים
  const unsubscribe = onSnapshot(coll, (qs) => {
    const list = qs.docs.map(d => ({
      imdbID: d.id,
      ...(d.data() || {})
    }));
    callback(list);
  });
  
  return unsubscribe; // מחזירים את הפונקציה כדי שנוכל להפסיק להאזין כשהקומפוננטה נסגרת
}

/** * פונקציית נוחות (Toggle): 
 * מטפלת גם בהוספה וגם בהסרה בלחיצה אחת.
 */
export async function toggleFavorite(movie) {
  const exists = await isFavorite(movie.imdbID);
  if (exists) {
    await removeFavorite(movie.imdbID);
    return { added: false };
  } else {
    await addFavorite(movie);
    return { added: true };
  }
}