import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

// שליפת ה-Key ממשתני הסביבה (אבטחה)
const API_KEY = process.env.REACT_APP_OMDB_API_KEY;
const INITIAL_TERM = "way"; // מילת ברירת מחדל כדי שהאתר לא יהיה ריק בטעינה ראשונה

export default function useMovies() {
  const [searchParams, setSearchParams] = useSearchParams();

  // States לניהול הנתונים
  const [movies, setMovies] = useState([]);       // מה שהמשתמש רואה (אחרי סינון שנים)
  const [rawMovies, setRawMovies] = useState([]); // ה"מחסן" - כל מה שירד מהשרת
  const [page, setPage] = useState(1);            // ניהול הדף הנוכחי לטעינה הבאה

  // States לניהול חוויית משתמש (UX)
  const [loading, setLoading] = useState(false);       // טעינה ראשונית (מסך שלם)
  const [loadingMore, setLoadingMore] = useState(false); // טעינת דף נוסף
  const [hasMore, setHasMore] = useState(true);        // האם יש טעם להציג כפתור "עוד"
  const [error, setError] = useState("");

  // קריאת פרמטרים מה-URL (הופך את ה-URL למקור האמת)
  const search = searchParams.get("q") || "";
  const yMin = Number(searchParams.get("yMin")) || 1950;
  const yMax = Number(searchParams.get("yMax")) || 2025;

  /**
   * fetchMovies: הפונקציה שמדברת עם OMDb
   */
  const fetchMovies = useCallback(async (term, pageNum = 1, append = false) => {
    if (!term.trim()) return;

    // אם אין API KEY – אל תבצע בקשה "שקטה"
    if (!API_KEY) {
      setRawMovies([]);
      setHasMore(false);
      setError("Missing OMDb API key (REACT_APP_OMDB_API_KEY).");
      console.error("[useMovies] Missing OMDb API key (REACT_APP_OMDB_API_KEY).");
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    // החלטה איזה סוג ספינר להציג
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(
        `https://www.omdbapi.com/?s=${encodeURIComponent(term)}&type=movie&apikey=${API_KEY}&page=${pageNum}`
      );
      const data = await res.json();

      if (data.Response === "True") {
        if (append) {
          setRawMovies((prev) => [...prev, ...data.Search]);
        } else {
          setRawMovies(data.Search);
        }

        setHasMore(data.Search.length === 10);
        setError("");
      } else {
        if (!append) setRawMovies([]);
        setHasMore(false);

        // לא להסתיר שגיאה בטעינה הראשונה
        if (!append) {
          const msg = data?.Error || "No results found";
          setError(msg);
          console.warn("[useMovies] OMDb Response=False:", msg);
        }
      }
    } catch (err) {
      setError("Server connection error");
      console.error("[useMovies] Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // אפקט 1: כשמילת החיפוש ב-URL משתנה, מאפסים דפים ושולפים מחדש
  useEffect(() => {
    setPage(1);
    fetchMovies(search || INITIAL_TERM, 1, false);
  }, [search, fetchMovies]);

  // אפקט 2: סינון מקומי (Client-side)
  useEffect(() => {
    let result = [...rawMovies];
    result = result.filter((m) => {
      const y = parseInt(m.Year);
      return y >= yMin && y <= yMax;
    });
    setMovies(result);
  }, [rawMovies, yMin, yMax]);

  // פונקציה לקידום הדף וקריאה ל-API
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(search || INITIAL_TERM, nextPage, true);
  };

  // עדכון ה-URLSearchParams
  const setSearch = (val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set("q", val);
    else p.delete("q");
    setSearchParams(p);
  };

  return { search, setSearch, movies, rawMovies, loading, loadingMore, error, hasMore, loadMore };
}
