import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function Info() {
  const { id } = useParams(); //מהכתובת idלוקחים את ה 
  const navigate = useNavigate();
  const location = useLocation(); 

  //משתנים
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // id מביאים פרטים של סרט לפי 
  const loadMovie = async () => {
    try {
      setError("");
      setLoading(true);

      const url = `https://www.omdbapi.com/?i=${encodeURIComponent(id)}&apikey=5a292f28`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.Response === "True") {
        setMovie(data);
      } else {
        setMovie(null);
        setError(data.Error || "No data found");
      }
    } catch (err) {
      setMovie(null);
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  //כפתור חזור
  const onBack = () => {
    const q = new URLSearchParams(location.search).get("q");
    if (q) navigate(`/?q=${encodeURIComponent(q)}`);
    else navigate(-1); // גיבוי
  };

  return (
    <div
      className="d-flex flex-column align-items-center text-center"
      style={{ minHeight: "100vh" }}
    >
      <button
        className="btn btn-danger mb-4"
        onClick={onBack}
        style={{ width: "120px" }}
      >
        Back
      </button>

      {error && <p className="text-danger">{error}</p>}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
          <div className="spinner-border" role="status" aria-label="Loading"></div>
        </div>
      ) : (
        //כרטיס הפרטים של הסרט
        movie && (
          <div
            className="card bg-dark text-light p-4"
            style={{ maxWidth: "600px", border: "2px solid #e50914" }}
          >
            <h2 className="mb-3" style={{ color: "#e50914" }}>
              {movie.Title}
            </h2>

            {movie.Poster !== "N/A" && (
              <div className="mb-3">
                <img
                  src={movie.Poster}
                  alt={movie.Title}
                  style={{ width: "250px", borderRadius: "6px" }}
                />
              </div>
            )}

            <p><b>Actors:</b> {movie.Actors}</p>
            <p><b>IMDB Rating:</b> {movie.imdbRating}</p>
            <p><b>Year:</b> {movie.Year}</p>
            <p><b>Runtime:</b> {movie.Runtime}</p>
            <p><b>Plot:</b> {movie.Plot}</p>
          </div>
        )
      )}
    </div>
  );
}
