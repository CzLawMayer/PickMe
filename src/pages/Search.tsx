// src/pages/Search.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./Search.css"; // optional; create if you want custom styles

export default function SearchPage() {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    // TODO: replace with your real search (books, stories, etc.)
    // For now, fake results filtered by the query.
    const sample = [
      { id: "bk-001", title: "The First Book", type: "book" },
      { id: "st-010", title: "A Weird Little Story", type: "story" },
      { id: "bk-222", title: "Learning GSAP", type: "book" },
    ];
    if (!q.trim()) return [];
    return sample.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  }, [q]);

  return (
    <div className="search-page">
      <header className="search-header">
        <h1>Search</h1>
      </header>

      <div className="search-bar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search books, stories, authors…"
          aria-label="Search input"
        />
      </div>

      <section className="search-results" aria-live="polite">
        {!q && <p className="muted">Type to start searching.</p>}
        {q && results.length === 0 && <p>No results for “{q}”.</p>}

        {results.map((r) => (
          <Link
            key={r.id}
            to={r.type === "story" ? `/stories?id=${r.id}` : `/read?id=${r.id}`}
            className="result-card"
          >
            <div className="result-title">{r.title}</div>
            <div className="result-meta">{r.type}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
