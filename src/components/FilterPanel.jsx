import React from "react";

export default function FilterPanel({
  isOpen,
  onClose,
  genreList,
  selectedGenres,
  setSelectedGenres,
  yearMin,
  yearMax,
  setYearMin,
  setYearMax,
  likesSort,
  setLikesSort,
  applyFilters,
  clearFilters,
}) {
  if (!isOpen) return null;

  return (
    <div className="filter-panel">
      {/* כפתור סגירה */}
      <button onClick={onClose} className="filter-close-btn">
        ×
      </button>

      <h3 className="filter-title">Filters</h3>

      {/* ז'אנרים */}
      <div className="mt-4 mb-2 text-white">Genre:</div>

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
              const nextGenres = selectedGenres.includes(g)
                ? selectedGenres.filter((x) => x !== g)
                : [...selectedGenres, g];
              setSelectedGenres(nextGenres);
            }}
            className={`filter-btn ${selectedGenres.includes(g) ? "active" : ""}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* בחירת שנים */}
      <label className="mt-4 text-white d-block">Year Range:</label>
      <div className="mb-2 text-white">
        <strong>{yearMin}</strong> - <strong>{yearMax}</strong>
      </div>

      <input
        type="range"
        min="1950"
        max="2025"
        value={yearMin}
        onChange={(e) => setYearMin(e.target.value)}
        className="w-100 mb-2"
      />

      <input
        type="range"
        min="1950"
        max="2025"
        value={yearMax}
        onChange={(e) => setYearMax(e.target.value)}
        className="w-100 mb-3"
      />

      {/* מיון לפי לייקים */}
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

      {/* כפתורי פעולה */}
      <button
        className="btn btn-danger filter-action-btn"
        onClick={applyFilters}
        type="button"
      >
        Apply Filters
      </button>

      <button
        className="btn btn-secondary filter-action-btn"
        onClick={clearFilters}
        type="button"
      >
        Clear Filters
      </button>
    </div>
  );
}