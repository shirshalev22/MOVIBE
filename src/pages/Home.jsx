import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"; 
import { db } from "../config/firebase";

import useMovies from "../hooks/useMovies";
import useFilters from "../hooks/useFilters";
import useFavorites from "../hooks/useFavorites";
import useVotes from "../hooks/useVotes";

import MovieCard from "../components/MovieCard";
import FilterPanel from "../components/FilterPanel";
import LuckyModal from "../components/LuckyModal"; 

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ====== HOOKS ======
  const { search, setSearch, rawMovies, loadingMore, hasMore, loadMore } = useMovies();
  const filterTools = useFilters();
  const { selectedGenres, setSelectedGenres, yearMin, setYearMin, yearMax, setYearMax, likesSort, setLikesSort } = filterTools;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLuckyOpen, setIsLuckyOpen] = useState(false); 

  const { user, favs, toggleFav } = useFavorites();
  const [movieMeta, setMovieMeta] = useState({});
  const { handleVote } = useVotes(user, setMovieMeta);

  const [dbGenreMovies, setDbGenreMovies] = useState([]);
  const [loadingDB, setLoadingDB] = useState(false);

  const genreList = useMemo(() => ["Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Drama", "Family",
                     "Fantasy", "History", "Horror", "Musical", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"], []);

  // משיכת המפתח מה-env
  const API_KEY = process.env.REACT_APP_OMDB_API_KEY;

  // ====== סנכרון URL ======
  useEffect(() => {
    const queryInUrl = searchParams.get("q");
    if (queryInUrl && queryInUrl !== search) {
      setSearch(queryInUrl);
    }
  }, [searchParams, setSearch, search]);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set("q", value);
    else newParams.delete("q");
    setSearchParams(newParams);
  };

  // ====== שליפת סרטים מהמסד לפי ז'אנר (כשאין חיפוש פעיל) ======
  const genreQueryKey = selectedGenres.join(","); // חילוץ משתנה סטטי כדי ש-ESLint לא יתלונן

  useEffect(() => {
    const fetchFromDB = async () => {
      if (selectedGenres.length === 0 || search) {
        setDbGenreMovies([]);
        return;
      }

      setLoadingDB(true);
      try {
        const q = query(
          collection(db, "movies"), 
          where("genres", "array-contains-any", selectedGenres)
        );
        
        const snap = await getDocs(q);
        const ids = snap.docs.map(doc => doc.id);

        if (ids.length === 0) {
          setDbGenreMovies([]);
          return;
        }

        const fullData = await Promise.all(ids.map(async (id) => {
          const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`);
          return res.json();
        }));

        setDbGenreMovies(fullData.filter(m => m.Response !== "False"));
      } catch (err) {
        console.error("Error fetching movies by genre:", err);
      } finally {
        setLoadingDB(false);
      }
    };

    fetchFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreQueryKey, search, API_KEY]); 

  // ====== לוגיקת סינון ======
  const filteredMovies = useMemo(() => {
    const baseMovies = (selectedGenres.length > 0 && !search) ? dbGenreMovies : rawMovies;
    if (!baseMovies || baseMovies.length === 0) return [];

    let result = [...baseMovies].filter(m => {
      const y = parseInt(m.Year);
      return y >= yearMin && y <= yearMax;
    });

    if (likesSort !== "none") {
      result.sort((a, b) => {
        const likesA = movieMeta[a.imdbID]?.likes || 0;
        const likesB = movieMeta[b.imdbID]?.likes || 0;
        return likesSort === "asc" ? likesA - likesB : likesB - likesA;
      });
    }
    return result;
  }, [rawMovies, dbGenreMovies, search, selectedGenres.length, yearMin, yearMax, likesSort, movieMeta]);

  // ====== טעינת נתונים מ-FIRESTORE (Metadata) ======
  useEffect(() => {
    const moviesToHydrate = (selectedGenres.length > 0 && !search) ? dbGenreMovies : rawMovies;
    if (!moviesToHydrate.length) return;

    const hydrate = async () => {
      const ids = [...new Set(moviesToHydrate.map(m => m?.imdbID).filter(id => id))];
      const updates = {};

      await Promise.all(ids.map(async (id) => {
        // מונע טעינה מחדש של מה שכבר קיים
        if (movieMeta[id] && movieMeta[id].myVote !== undefined) return;

        const movieSnap = await getDoc(doc(db, "movies", id));
        let myVote = null;

        if (user) {
          const voteSnap = await getDoc(doc(db, "movies", id, "votes", user.uid));
          if (voteSnap.exists()) {
            myVote = voteSnap.data().type;
          }
        }

        if (movieSnap.exists()) {
          const data = movieSnap.data();
          updates[id] = { 
            likes: data.likes || 0, 
            dislikes: data.dislikes || 0, 
            genres: data.genres || [],
            myVote: myVote 
          };
        }
      }));

      if (Object.keys(updates).length > 0) {
        setMovieMeta(prev => ({ ...prev, ...updates }));
      }
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMovies, dbGenreMovies, user]); 

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center">
      <div 
        className={`lucky-tab ${!user ? 'btn btn-secondary disabled-tab' : ''}`} 
        onClick={() => user ? setIsLuckyOpen(true) : alert("Please log in!")}
      >
        <span>SURPRISE ME 🎲</span>
      </div>

      <h1 className="my-4">Search Movies</h1>

      <div className="d-flex gap-2 mb-4 w-100 px-3" style={{ maxWidth: 720 }}>
        <input type="text" className="form-control" placeholder="Search..." 
               value={search || ""} onChange={handleSearchInputChange} />
        <button className="btn btn-secondary" onClick={() => setIsFilterOpen(true)} disabled={!user}>
          Filter
        </button>
      </div>

      <LuckyModal isOpen={isLuckyOpen} onClose={() => setIsLuckyOpen(false)} />
      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} 
                   genreList={genreList} {...filterTools} 
                   applyFilters={() => setIsFilterOpen(false)} 
                   clearFilters={() => {
                     setSelectedGenres([]); setYearMin(1950); setYearMax(2025); setLikesSort("none");
                     setSearchParams({ q: search || "" });
                   }} 
      />

      <div className="container">
        {(loadingDB) && <div className="text-center my-3">Loading Genres...</div>}
        <div className="grid-2">
          {filteredMovies.map(movie => (
            <MovieCard 
              key={movie.imdbID} 
              movie={movie} 
              meta={movieMeta[movie.imdbID] || { likes: 0, dislikes: 0, myVote: null }} 
              isFav={favs.has(movie.imdbID)} 
              onToggleFav={() => toggleFav(movie.imdbID)} 
              onVote={(type) => handleVote(movie, type)} 
            />
          ))}
        </div>

        {hasMore && selectedGenres.length === 0 && !search && (
          <div className="text-center mt-4 mb-5">
            <button className="btn btn-danger px-5" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}