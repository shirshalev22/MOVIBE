import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const API_KEY = process.env.REACT_APP_OMDB_API_KEY;
const INITIAL_TERM = "way"; // מילת חיפוש ברירת מחדל 

/**
 * Hook מותאם אישית לניהול שליפת סרטים ותהליך הסינון.
 * תומך בטעינה אינסופית (Load More) ובחיפוש דרך ה-URL.
 */
export default function useMovies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]); // הסרטים המוצגים (אחרי סינון)
  const [rawMovies, setRawMovies] = useState([]); // כל הסרטים הגולמיים שהגיעו מה-API
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  // שליפת פרמטרים מה-URL
  const search = searchParams.get("q") || "";
  const yMin = Number(searchParams.get("yMin")) || 1950;
  const yMax = Number(searchParams.get("yMax")) || 2025;

  /**
   * פונקציית השליפה המרכזית מה-API
   * @param {string} term - מילת החיפוש
   * @param {number} pageNum - מספר הדף לטעינה
   * @param {boolean} append - האם להוסיף לרשימה הקיימת או להחליף אותה
   */
  const fetchMovies = useCallback(async (term, pageNum = 1, append = false) => {
    if (!term.trim()) return;
    
    if (append) setLoadingMore(true); else setLoading(true);
    
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?s=${encodeURIComponent(term)}&type=movie&apikey=${API_KEY}&page=${pageNum}`
      );
      const data = await res.json();

      if (data.Response === "True") {
        if (append) {
          // הוספת תוצאות חדשות למערך הקיים
          setRawMovies(prev => [...prev, ...data.Search]);
        } else {
          // דריסת התוצאות (בחיפוש חדש)
          setRawMovies(data.Search);
        }
        
        // OMDB מחזיר 10 תוצאות לדף. אם קיבלנו פחות, סימן שנגמרו הסרטים.
        setHasMore(data.Search.length === 10); 
        setError("");
      } else {
        if (!append) setRawMovies([]);
        setHasMore(false);
        // מציג שגיאה רק אם זה לא החיפוש הראשוני והחיפוש נכשל
        if (term !== INITIAL_TERM && !append) setError(data.Error);
      }
    } catch (err) {
      setError("Server connection error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 1. אפקט לטעינה ראשונית/חדשה בעת שינוי מילת החיפוש ב-URL
  useEffect(() => {
    setPage(1);
    fetchMovies(search || INITIAL_TERM, 1, false);
  }, [search, fetchMovies]);

  // 2. אפקט לסינון הנתונים הגולמיים לפי טווח השנים שנבחר
  useEffect(() => {
    let result = [...rawMovies];
    result = result.filter(m => {
      const y = parseInt(m.Year);
      return y >= yMin && y <= yMax;
    });
    setMovies(result);
  }, [rawMovies, yMin, yMax]);

  /**
   * טעינת דף הנתונים הבא מה-API
   */
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(search || INITIAL_TERM, nextPage, true);
  };

  /**
   * עדכון מילת החיפוש בכתובת ה-URL
   */
  const setSearch = (val) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (val) p.set("q", val); else p.delete("q");
      return p;
    });
  };

  return { 
    search, 
    setSearch, 
    movies, 
    rawMovies, 
    setMovies, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    loadMore 
  };
}