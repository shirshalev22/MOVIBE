import { useSearchParams } from "react-router-dom";

/**
 * Custom Hook: useFilters
 * המטרה: לנהל את כל מצב הסינון והמיון דרך ה-URL.
 */
export default function useFilters() {
  // useSearchParams מחזיר אובייקט שמאפשר לקרוא ולכתוב לכתובת ה-URL (אחרי ה-?)
  const [searchParams, setSearchParams] = useSearchParams();

  // --- 1. שליפת הנתונים מה-URL ותרגומם לערכים ש-React מבין ---
  
  // ז'אנרים: מושך את המחרוזת "Action,Drama" והופך אותה חזרה למערך ['Action', 'Drama']
  const selectedGenres = searchParams.get("genres") ? searchParams.get("genres").split(",") : [];
  
  // שנים: ה-URL תמיד מחזיר String, לכן אנחנו חייבים להמיר ל-Number
  const yearMin = Number(searchParams.get("yMin")) || 1950;
  const yearMax = Number(searchParams.get("yMax")) || 2025;
  
  // מיון: מקבל את המצב הנוכחי (asc/desc/none)
  const likesSort = searchParams.get("sort") || "none";

  /**
   * updateFilters: הפונקציה שמעדכנת את הכתובת.
   * היא מקבלת אובייקט עם השינויים החדשים וממזגת אותם עם הישנים.
   */
  const updateFilters = (newFilters) => {
    setSearchParams((prev) => {
      // יצירת עותק חדש של הפרמטרים הקיימים כדי לא לדרוס אותם
      const p = new URLSearchParams(prev);
      
      // טיפול במערך הז'אנרים
      if (Array.isArray(newFilters.genres) && newFilters.genres.length > 0) {
        // הופך מערך למחרוזת עם פסיקים עבור ה-URL
        p.set("genres", newFilters.genres.join(","));
      } else {
        p.delete("genres"); // אם אין בחירה - מנקים את ה-URL
      }

      // עדכון שאר הערכים - אם אין ערך חדש, משתמשים בברירת המחדל
      p.set("yMin", newFilters.yearMin || 1950);
      p.set("yMax", newFilters.yearMax || 2025);
      p.set("sort", newFilters.likesSort || "none");
      
      return p; // ה-URL מתעדכן והדף "מרנדר מחדש" את התוצאות
    });
  };

  // --- 2. חשיפת הממשק החוצה ---
  return {
    selectedGenres,
    yearMin,
    yearMax,
    likesSort,
    
    // פונקציות עזר שמשתמשות ב-Closure כדי לשמור על שאר הפילטרים בזמן שמעדכנים אחד ספציפי
    setSelectedGenres: (g) => {
        const nextGenres = Array.isArray(g) ? g : [g];
        updateFilters({ genres: nextGenres, yearMin, yearMax, likesSort });
    },
    setYearMin: (y) => updateFilters({ genres: selectedGenres, yearMin: y, yearMax, likesSort }),
    setYearMax: (y) => updateFilters({ genres: selectedGenres, yearMin, yearMax: y, likesSort }),
    setLikesSort: (s) => updateFilters({ genres: selectedGenres, yearMin, yearMax, likesSort: s }),
  };
}