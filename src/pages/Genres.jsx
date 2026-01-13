import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export default function Genres() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const genreList = [
    "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
    "Drama", "Family", "Fantasy", "History", "Horror", "Musical",
    "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"
  ];

  const loadMoviesByGenre = async (genre) => {
    setSelected(genre);
    setLoading(true);

    try {
      // שאילתה השולפת סרטים שבהם המערך genres מכיל את הערך הנבחר
      const q = query(
        collection(db, "movies"),
        where("genres", "array-contains", genre)
      );

      const snap = await getDocs(q);
      const arr = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMovies(arr);
    } catch (err) {
      console.error("Error loading movies:", err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ color: "white" }}>
      <h1 className="mb-4" style={{ color: "#e50914", fontWeight: "bold" }}>Browse by Genre</h1>

      {/* רשימת כפתורי ז'אנרים בעיצוב נקי */}
      <div className="mb-5 d-flex flex-wrap gap-2">
        {genreList.map((g) => (
          <button
            key={g}
            onClick={() => loadMoviesByGenre(g)}
            className={`btn genre-selector-btn ${selected === g ? "active" : ""}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* אנימציית טעינה */}
      {loading && (
        <div className="d-flex justify-content-center mt-5">
          <div className="spinner-border text-danger" role="status"></div>
        </div>
      )}

      {/* תצוגת תוצאות */}
      {!loading && selected && (
        <div className="animate-fade-in">
          <h2 className="mb-4 h4 text-muted">
            Showing results for: <span style={{ color: "#e50914" }}>{selected}</span>
          </h2>

          {movies.length === 0 ? (
            <div className="text-center mt-5">
              <p className="text-muted">No movies found in our database for this genre yet.</p>
            </div>
          ) : (
            <div className="row g-4">
              {movies.map((m) => (
                <div key={m.id} className="col-6 col-md-4 col-lg-3">
                  <div className="genre-movie-card" onClick={() => navigate(`/info/${m.id}`)}>
                    <div className="poster-container">
                      <img
                        src={m.poster || m.Poster || "https://via.placeholder.com/300x450?text=No+Poster"}
                        alt={m.title || m.Title}
                        className="img-fluid rounded shadow-sm"
                      />
                      {/* הוספת הדירוג כציפה על הפוסטר (אופציונלי) */}
                      {m.imdbRating && <div className="rating-badge-overlay">{m.imdbRating}</div>}
                    </div>
                    <div className="mt-2 text-center">
                      <h6 className="movie-title-short">{m.title || m.Title}</h6>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}