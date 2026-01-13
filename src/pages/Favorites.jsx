import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";

/**
 * דף המועדפים - מציג רשימת סרטים שהמשתמש שמר ב-Firestore.
 * כולל סנכרון בזמן אמת ושליפת נתונים משלימים מה-API של OMDb.
 */
export default function Favorites() {
  const [user, setUser] = useState(null);
  const [ids, setIds] = useState([]);       // מזהי הסרטים שנשמרו ב-DB
  const [movies, setMovies] = useState([]);    // אובייקטי הסרטים המלאים מה-API
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // מעקב אחרי מצב התחברות המשתמש
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  /**
   * מאזין בזמן אמת לאוסף המועדפים של המשתמש ב-Firestore.
   * משתמש ב-onSnapshot כדי לעדכן את הממשק ברגע שיש שינוי ב-DB.
   */
  useEffect(() => {
    if (!user) {
      setIds([]);
      setMovies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const favsCol = collection(db, "users", user.uid, "favorites");
    const stopSnapshot = onSnapshot(favsCol, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push(d.id)); 
        setIds(arr);
        setLoading(false);
      }, () => {
        setError("Failed to load favorites.");
        setLoading(false);
      }
    );
    return () => stopSnapshot();
  }, [user]);

  /**
   * שליפת פרטי הסרטים מה-OMDb לפי רשימת ה-IDs.
   * המפתח נשלף ממשתני הסביבה (Environment Variables) לשמירה על אבטחה.
   */
  useEffect(() => {
    const fetchAll = async () => {
      if (!ids?.length) {
        setMovies([]);
        return;
      }
      try {
        setError("");
        setFetching(true);

        // שימוש במשתנה סביבה עבור ה-API Key
        const apiKey = process.env.REACT_APP_OMDB_API_KEY;

        const results = await Promise.all(
          ids.map(async (id) => {
            const url = `https://www.omdbapi.com/?i=${encodeURIComponent(id)}&apikey=${apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            return data && data.Response === "True" 
              ? data 
              : { imdbID: id, Poster: "N/A", Title: "", Year: "" };
          })
        );
        setMovies(results);
      } catch (e) {
        setError("Server connection error.");
      } finally {
        setFetching(false);
      }
    };
    fetchAll();
  }, [ids]);

  // פונקציה להסרת סרט מהמועדפים
  const removeFav = async (imdbID) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "favorites", imdbID));
    } catch (e) {
      alert("Failed to remove favorite.");
    }
  };

  if (!user) {
    return (
      <div className="container page-narrow" style={{ color: "white" }}>
        <h1>Favorites</h1>
        <p style={{ textAlign: "center" }}>To see favorites, log in to your account.</p>
        <div className="center">
          <button className="vod-btn logout-inline" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ color: "white" }}>
      <h1 style={{textAlign: "center", margin: "18px 0 16px" }}>Favorites</h1>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
          <div className="spinner-border" role="status"></div>
        </div>
      ) : ids.length === 0 ? (
        <div className="text-center">No favorites yet.</div>
      ) : (
        <>
          {error && <p className="text-danger text-center">{error}</p>}
          <div className="row justify-content-center">
            {movies.map((m) => {
              const posterNA = !m.Poster || m.Poster === "N/A";
              return (
                <div key={m.imdbID} className="col-lg-8 col-md-10 mb-4">
                  <div className="card bg-dark text-light border-0 shadow-sm">
                    <div
                      className="row g-0 align-items-center"
                      style={{ border: "1px solid #e50914", borderRadius: 6 }}
                    >
                      <div className="col-md-4 text-center p-2">
                        {!posterNA ? (
                          <img
                            src={m.Poster}
                            alt={m.Title}
                            className="img-fluid"
                            style={{ maxHeight: 260, objectFit: "cover", borderRadius: 4 }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center bg-secondary"
                            style={{ height: 260, borderRadius: 4, opacity: 0.6 }}
                          >
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="col-md-8">
                        <div className="card-body">
                          <h5 className="card-title mb-2">{m.Title || ""}</h5>
                          <p className="card-text mb-0">Year: {m.Year || ""}</p>

                          <div className="actions mt-3 d-flex align-items-center gap-3">
                            <button
                              className="btn btn-danger"
                              onClick={() => navigate(`/info/${m.imdbID}?from=favorites`)}
                            >
                              More Info
                            </button>

                            <button
                              type="button"
                              className="fav-btn active"
                              onClick={() => removeFav(m.imdbID)}
                              style={{ background: 'none', border: 'none', padding: 0 }}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true" width="32" height="32" fill="#e50914">
                                <path d="M12.1 8.64l-.1.1-.1-.1c-1.96-1.88-4.99-1.88-6.86-.02-1.86 1.86-1.86 4.9 0 6.76L12 21.5l6.96-6.62c1.86-1.86 1.86-4.9 0-6.76-1.87-1.86-4.9-1.86-6.86.02z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {fetching && (
            <div className="d-flex justify-content-center align-items-center my-3">
              <div className="spinner-border spinner-border-sm" role="status"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}