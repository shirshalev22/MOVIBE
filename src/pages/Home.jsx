import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams(); //שומר את החיפוש האחרון
  // משתנים ששומרים את מצב המסך
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // פונקציה שמביאה סרטים לפי מילת החיפוש
  const fetchMovies = async (q) => {
    const term = (q || "").trim();
    if (!term) return;

    try {
      setError("");
      setLoading(true);

      const url = `https://www.omdbapi.com/?s=${encodeURIComponent(term)}&apikey=5a292f28`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.Response === "True") {
        setMovies(data.Search || []); // אם יש תוצאות- שומרים אותן
      } else {
        setMovies([]); // אם אין- מרוקנים
        setError(data.Error || "No results found");
      }
    } catch (err) {
      setMovies([]);
      setError("Server connection error"); // אם השרת לא עבד
    } finally {
      setLoading(false);
    }
  };

  // אם יש חיפוש אחרון- טוענים אותו, אם לא- ברירת מחדל
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearch(q);
      fetchMovies(q);
    } else {
      fetchMovies("black");
    }
  }, []);

  // כשלוחצים על כפתור החיפוש
  const searchMovies = () => {
    const term = search.trim();
    if (!term) {
      setError("Please enter a search term");
      setMovies([]);
      return;
    }
    setSearchParams({ q: term }); // לשמור את החיפוש האחרון ב־URL
    fetchMovies(term);
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center"
      style={{ backgroundColor: "#000", color: "white" }}
    >
      <h1 className="my-4" style={{ color: "#e50914" }}>
        Search Movies
      </h1>

      {/* שורת החיפוש */}
      <div className="input-group mb-4" style={{ maxWidth: 520 }}>
        <input
          type="text"
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Enter movie name..."
          aria-label="Movie search"
        />
        <button className="btn btn-danger" onClick={searchMovies}>
          Search
        </button>
      </div>

      {error && <p className="text-danger">{error}</p>}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
          <div className="spinner-border" role="status" aria-label="Loading"></div>
        </div>
      ) : (
        // רשימת הסרטים
        <div className="container">
          <div className="row justify-content-center">
            {(movies || []).map((movie) => (
              <div key={movie.imdbID} className="col-md-8 mb-4">
                <div className="card bg-dark text-light border-0">
                  <div
                    className="row g-0 align-items-center"
                    style={{ border: "1px solid #e50914", borderRadius: 6 }}
                  >
                    <div className="col-md-4 text-center p-2">
                      {movie.Poster !== "N/A" ? (
                        <img
                          src={movie.Poster}
                          alt={movie.Title}
                          className="img-fluid"
                          style={{ maxHeight: 260, objectFit: "cover", borderRadius: 4 }}
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
                        <h5 className="card-title">{movie.Title}</h5>
                        <p className="card-text mb-3">Year: {movie.Year}</p>
                        {/*מעבר לעמוד פרטים*/}
                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            navigate(
                              `/info/${movie.imdbID}?q=${encodeURIComponent(
                                searchParams.get("q") || search || "black"
                              )}`
                            )
                          }
                        >
                          More Info
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* אם אין תוצאות בכלל */}
            {!error && movies?.length === 0 && (
              <div className="text-center text-muted">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
