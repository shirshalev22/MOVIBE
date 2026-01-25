import React from "react";

export default function FilterPanel({
  isOpen,           // האם הפאנל פתוח או סגור
  onClose,          // פונקציה לסגירת הפאנל
  genreList,        // רשימת כל הז'אנרים הקיימים (מגיעה מ-Genres.js)
  selectedGenres,   // מערך הז'אנרים שהמשתמש בחר כרגע
  setSelectedGenres,
  yearMin, yearMax,
  setYearMin, setYearMax,
  likesSort,        // המצב הנוכחי של המיון (asc/desc)
  setLikesSort,
  applyFilters,     // הפונקציה הכי חשובה - מחשבת את התוצאות ומעדכנת את המסך
  clearFilters,     // מאפסת את כל הבחירות לברירת מחדל
}) {
  // אם הפאנל לא מוגדר כ-"פתוח", אל תרנדר כלום (חוסך משאבים)
  if (!isOpen) return null;

  return (
    <div className="filter-panel">
      {/* כפתור ה-X לסגירה מהירה */}
      <button onClick={onClose} className="filter-close-btn"> × </button>

      <h3 className="filter-title">Filters</h3>

      {/* --- חלק 1: בחירת ז'אנרים --- */}
      <div className="mt-4 mb-2 text-white">Genre:</div>

      {/* כפתור "All" - מאפס את מערך הז'אנרים למערך ריק */}
      <button
        onClick={() => setSelectedGenres([])}
        className={`filter-btn filter-btn-full ${selectedGenres.length === 0 ? "active" : ""}`}
      >
        All
      </button>

      <div className="filter-grid">
        {genreList.map((g) => (
          <button
            key={g}
            onClick={() => {
              // לוגיקת Toggle: אם הז'אנר נבחר - הסר, אם לא - הוסף
              const nextGenres = selectedGenres.includes(g)
                ? selectedGenres.filter((x) => x !== g)
                : [...selectedGenres, g];
              setSelectedGenres(nextGenres);
            }}
            // אם הז'אנר נבחר, נוסיף לו קלאס "active" כדי שייצבע באדום/בולט
            className={`filter-btn ${selectedGenres.includes(g) ? "active" : ""}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* --- חלק 2: בחירת טווח שנים --- */}
      <label className="mt-4 text-white d-block">Year Range:</label>
      <div className="mb-2 text-white">
        <strong>{yearMin}</strong> - <strong>{yearMax}</strong>
      </div>

      {/* סליידר לשנת מינימום */}
      <input
        type="range" min="1950" max="2025"
        value={yearMin}
        onChange={(e) => setYearMin(e.target.value)}
        className="w-100 mb-2"
      />

      {/* סליידר לשנת מקסימום */}
      <input
        type="range" min="1950" max="2025"
        value={yearMax}
        onChange={(e) => setYearMax(e.target.value)}
        className="w-100 mb-3"
      />

      {/* --- חלק 3: מיון לפי פופולריות (לייקים) --- */}
      <label className="mt-4 text-white d-block">Sort by likes:</label>
      <div className="sort-group">
        <button
          type="button"
          className={`sort-btn ${likesSort === "asc" ? "active" : ""}`}
          onClick={() => setLikesSort("asc")}
        >
          Low → High
        </button>

        <button
          type="button"
          className={`sort-btn ${likesSort === "desc" ? "active" : ""}`}
          onClick={() => setLikesSort("desc")}
        >
          High → Low
        </button>
      </div>

      {/* --- חלק 4: כפתורי פעולה סופיים --- */}
      <button
        className="btn btn-danger filter-action-btn"
        onClick={applyFilters} // מפעיל את לוגיקת הסינון ב-Home.js
        type="button"
      >
        Apply Filters
      </button>

      <button
        className="btn btn-secondary filter-action-btn"
        onClick={clearFilters} // מחזיר הכל למצב ראשוני
        type="button"
      >
        Clear Filters
      </button>
    </div>
  );
}