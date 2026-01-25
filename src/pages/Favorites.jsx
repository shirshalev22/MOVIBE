import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import useFavorites from "../hooks/useFavorites";

export default function Favorites() {
  // --- שליפת נתונים מה-Hook הגלובלי ---
  // user: המשתמש המחובר
  // favs: Set שמכיל את כל ה-IDs של הסרטים המועדפים (מגיע בזמן אמת מ-Firestore)
  // toggleFav: פונקציה שמוסיפה/מסירה סרט מה-DB
  const { user, favs, toggleFav } = useFavorites();

  // --- State מקומי לדף המועדפים ---
  const [movies, setMovies] = useState([]); // כאן נשמור את האובייקטים המלאים של הסרטים מה-API
  const [fetching, setFetching] = useState(false); // מצב טעינה (ספינר)
  const [error, setError] = useState(""); // טיפול בשגיאות תקשורת

  useEffect(() => {
    const fetchAll = async () => {
      // 1. הופכים את ה-Set של ה-IDs למערך כדי שנוכל לעבוד איתו
      const idsArray = Array.from(favs);
      
      // אם הרשימה ריקה, אין טעם לפנות ל-API, פשוט מאפסים את התצוגה
      if (idsArray.length === 0) {
        setMovies([]);
        return;
      }

      try {
        setError("");
        setFetching(true);
        const apiKey = process.env.REACT_APP_OMDB_API_KEY;

        // 2. שימוש ב-Promise.all: מפעילים את כל בקשות ה-Fetch במקביל
        // אנחנו עוברים על כל ID ושולחים בקשה ל-OMDb לקבלת פרטי הסרט המלאים
        const results = await Promise.all(
          idsArray.map(async (id) => {
            const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${apiKey}`);
            const data = await res.json();
            // אם הסרט נמצא ב-API, מחזירים אותו, אם לא - מחזירים null
            return data.Response === "True" ? data : null;
          })
        );
        
        // 3. עדכון ה-State עם הסרטים שמצאנו (מסננים החוצה ערכי null במידה והיו)
        setMovies(results.filter(m => m !== null));
      } catch (e) {
        setError("API Connection Error.");
      } finally {
        setFetching(false);
      }
    };

    // מפעילים את הפונקציה רק אם יש משתמש מחובר
    if (user) fetchAll();
    
    // ה-Effect ירוץ בכל פעם שרשימת המועדפים (favs) משתנה ב-Firestore
  }, [favs, user]);

  // --- הגנה: אם המשתמש לא מחובר, לא מציגים את הדף ---
  if (!user) {
    return (
      <div className="container text-center text-white mt-5">
        <h1>My Favorites</h1>
        <p>Please log in to view your saved movies.</p>
      </div>
    );
  }

  return (
    <div className="container favorites-page pb-5">
      <h1 className="text-center my-4">My Favorites</h1>

      {/* מצב טעינה: מציג ספינר רק בטעינה הראשונית */}
      {fetching && movies.length === 0 ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-danger" role="status"></div>
        </div>
      ) : movies.length === 0 ? (
        // הודעה במידה והרשימה ריקה
        <div className="text-center mt-5">Your favorites list is empty.</div>
      ) : (
        // הגריד שבו מוצגים הסרטים
        <div className="favorites-grid">
          {error && <p className="text-danger text-center w-100">{error}</p>}
          
          {movies.map((m) => (
            <div key={m.imdbID} className="hide-card-elements">
              {/* שימוש חוזר ברכיב ה-MovieCard */}
              <MovieCard 
                movie={m} 
                isFav={true} // בגלל שאנחנו בדף מועדפים, הלב תמיד יהיה מלא בהתחלה
                onToggleFav={() => toggleFav(m.imdbID)} // מאפשר להסיר מהמועדפים ישירות מהדף הזה
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}