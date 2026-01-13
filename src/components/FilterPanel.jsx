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
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "320px",
        height: "100vh",
        background: "#111",
        padding: "20px",
        borderLeft: "2px solid #e50914",
        zIndex: 999,
        overflowY: "auto",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "22px",
          float: "right",
          cursor: "pointer",
        }}
      >
        ×
      </button>

      <h3 style={{ color: "#e50914", marginTop: "10px" }}>Filters</h3>

      {/* GENRES */}
      <div style={{ marginTop: "24px", marginBottom: "8px" }}>Genre:</div>

      <button
        onClick={() => setSelectedGenres([])}
        style={{
          padding: "8px",
          background: selectedGenres.length === 0 ? "#e50914" : "#333",
          border: "1px solid #444",
          borderRadius: "6px",
          color: "#fff",
          width: "100%",
          marginBottom: "10px",
        }}
      >
        All
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          marginBottom: "15px",
        }}
      >
        {genreList.map((g) => (
          <button
            key={g}
            // הקוד החדש (התקין):
            onClick={() => {
              const nextGenres = selectedGenres.includes(g)
                ? selectedGenres.filter((x) => x !== g)
                : [...selectedGenres, g];
              setSelectedGenres(nextGenres);
            }}
            style={{
              padding: "8px",
              background: selectedGenres.includes(g) ? "#e50914" : "#333",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "#fff",
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* YEAR RANGE */}
      <label className="mt-4">Year Range:</label>

      <div style={{ marginBottom: "8px" }}>
        <strong>{yearMin}</strong> - <strong>{yearMax}</strong>
      </div>

      <input
        type="range"
        min="1950"
        max="2025"
        value={yearMin}
        onChange={(e) => setYearMin(e.target.value)}
        style={{ width: "100%", marginBottom: "6px" }}
      />

      <input
        type="range"
        min="1950"
        max="2025"
        value={yearMax}
        onChange={(e) => setYearMax(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      {/* SORT BY LIKES */}
      <label className="mt-4">Sort by likes:</label>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "8px",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          style={{
            flex: 1,
            background: likesSort === "asc" ? "#e50914" : "#333",
            color: "#fff",
            border: "none",
          }}
          onClick={() => setLikesSort("asc")}
        >
          Low → High
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{
            flex: 1,
            background: likesSort === "desc" ? "#e50914" : "#333",
            color: "#fff",
            border: "none",
          }}
          onClick={() => setLikesSort("desc")}
        >
          High → Low
        </button>
      </div>

      {/* APPLY & CLEAR */}
      <button
        className="btn btn-danger mt-2 w-100"
        onClick={applyFilters}
        type="button"
      >
        Apply Filters
      </button>

      <button
        className="btn btn-secondary mt-2 w-100"
        onClick={clearFilters}
        type="button"
      >
        Clear Filters
      </button>
    </div>
  );
}
