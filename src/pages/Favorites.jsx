import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import useFavorites from "../hooks/useFavorites";

export default function Favorites() {
  const { user, favs, toggleFav } = useFavorites();
  const [movies, setMovies] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const idsArray = Array.from(favs);
      if (idsArray.length === 0) {
        setMovies([]);
        return;
      }

      try {
        setError("");
        setFetching(true);
        const apiKey = process.env.REACT_APP_OMDB_API_KEY;

        const results = await Promise.all(
          idsArray.map(async (id) => {
            const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${apiKey}`);
            const data = await res.json();
            return data.Response === "True" ? data : null;
          })
        );
        setMovies(results.filter(m => m !== null));
      } catch (e) {
        setError("API Connection Error.");
      } finally {
        setFetching(false);
      }
    };

    if (user) fetchAll();
  }, [favs, user]);

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

      {fetching && movies.length === 0 ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-danger" role="status"></div>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center mt-5">Your favorites list is empty.</div>
      ) : (
        <div className="favorites-grid">
          {error && <p className="text-danger text-center w-100">{error}</p>}
          
          {movies.map((m) => (
            <div key={m.imdbID} className="hide-card-elements">
              <MovieCard 
                movie={m} 
                isFav={true} 
                onToggleFav={() => toggleFav(m.imdbID)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}