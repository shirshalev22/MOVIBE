import { useSearchParams } from "react-router-dom";

/**
 * Hook מותאם אישית לניהול פרמטרי הסינון ב-URL.
 * מסנכרן בין ה-UI (פאנל הסינונים) לבין כתובת הדפדפן.
 */
export default function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. קריאת הנתונים מה-URL (מצב התחלתי)
  const selectedGenres = searchParams.get("genres") ? searchParams.get("genres").split(",") : [];
  const yearMin = Number(searchParams.get("yMin")) || 1950;
  const yearMax = Number(searchParams.get("yMax")) || 2025;
  const likesSort = searchParams.get("sort") || "none";

  /**
   * פונקציה מרכזית לעדכון ה-URLSearchParams.
   * מבטיחה שכל שינוי קטן שומר על שאר הפילטרים הקיימים.
   */
  const updateFilters = (newFilters) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      
      // טיפול בז'אנרים: הופך מערך למחרוזת המופרדת בפסיקים 
      if (Array.isArray(newFilters.genres) && newFilters.genres.length > 0) {
        p.set("genres", newFilters.genres.join(","));
      } else {
        p.delete("genres"); // אם אין ז'אנרים נבחרים, מוחק את הפרמטר מה-URL
      }

      // עדכון שאר הפרמטרים
      p.set("yMin", newFilters.yearMin || 1950);
      p.set("yMax", newFilters.yearMax || 2025);
      p.set("sort", newFilters.likesSort || "none");
      
      return p;
    });
  };

  // 2. חשיפת פונקציות עזר לקומפוננטות ה-UI (כמו ה-FilterPanel)
  return {
    selectedGenres,
    yearMin,
    yearMax,
    likesSort,
    
    // מעדכן רק את הז'אנרים ושומר על השאר
    setSelectedGenres: (g) => {
        const nextGenres = Array.isArray(g) ? g : [g];
        updateFilters({ genres: nextGenres, yearMin, yearMax, likesSort });
    },
    // מעדכן רק את טווח השנים
    setYearMin: (y) => updateFilters({ genres: selectedGenres, yearMin: y, yearMax, likesSort }),
    setYearMax: (y) => updateFilters({ genres: selectedGenres, yearMin, yearMax: y, likesSort }),
    
    // מעדכן את סדר המיון
    setLikesSort: (s) => updateFilters({ genres: selectedGenres, yearMin, yearMax, likesSort: s }),
  };
}