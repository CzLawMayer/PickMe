// src/pages/Search.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import "./Reviews.css";
import "./Library.css";
import "./Search.css";

import { searchBooks } from "@/searchData";

type SortKey = "recent" | "title" | "author" | "rating" | "likes" | "saves";
type BookState = { liked: boolean; saved: boolean; likeCount: number; saveCount: number };

export default function SearchPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Top controls
  const [activeKind, setActiveKind] = useState<"books" | "users" | "genres">("books");
  const [query, setQuery] = useState("");

  // Filter popover
  const [sortOpen, setSortOpen] = useState(false);
  const sortBtnRef = useRef<HTMLButtonElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sortOpen && !sortMenuRef.current?.contains(t) && !sortBtnRef.current?.contains(t)) {
        setSortOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [sortOpen]);

  // Data (books only for now)
  const rawBookResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchBooks(query.trim());
  }, [query]);

  const booksWithIndex = useMemo(
    () => rawBookResults.map((b, i) => ({ ...b, __index: i })),
    [rawBookResults]
  );

  const sortedBooks = useMemo(() => {
    const arr = [...booksWithIndex];
    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    switch (sortKey) {
      case "title":  arr.sort((a, b) => str(a.title).localeCompare(str(b.title))); break;
      case "author": arr.sort((a, b) => str(a.author).localeCompare(str(b.author))); break;
      case "rating": arr.sort((a, b) => num(b.rating) - num(a.rating)); break;
      case "likes":  arr.sort((a, b) => num(b.likes) - num(a.likes)); break;
      case "saves":  arr.sort((a, b) => num(b.bookmarks) - num(a.bookmarks)); break;
      case "recent":
      default:       arr.sort((a, b) => a.__index - b.__index);
    }
    return arr;
  }, [booksWithIndex, sortKey]);

  const applySort = (k: SortKey) => {
    setSortKey(k);
    setSortOpen(false);
  };

  // ---------- Like/Save state (mirrors Reviews) ----------
  const [bookStates, setBookStates] = useState<Record<string, BookState>>({});

  // Ensure we have state entries for visible results
  useEffect(() => {
    if (activeKind !== "books") return;
    setBookStates((prev) => {
      const next = { ...prev };
      for (const b of sortedBooks) {
        const id = String(b.id);
        if (!next[id]) {
          next[id] = {
            liked: false,
            saved: false,
            likeCount: typeof b.likes === "number" ? b.likes : Number(b.likes) || 0,
            saveCount: typeof b.bookmarks === "number" ? b.bookmarks : Number(b.bookmarks) || 0,
          };
        }
      }
      return next;
    });
  }, [sortedBooks, activeKind]);

  const toggleLike = (bookId: string | number) => {
    const id = String(bookId);
    setBookStates((prev) => {
      const st = prev[id];
      if (!st) return prev;
      const nextLiked = !st.liked;
      return {
        ...prev,
        [id]: {
          ...st,
          liked: nextLiked,
          likeCount: nextLiked ? st.likeCount + 1 : Math.max(0, st.likeCount - 1),
        },
      };
    });
  };

  const toggleSave = (bookId: string | number) => {
    const id = String(bookId);
    setBookStates((prev) => {
      const st = prev[id];
      if (!st) return prev;
      const nextSaved = !st.saved;
      return {
        ...prev,
        [id]: {
          ...st,
          saved: nextSaved,
          saveCount: nextSaved ? st.saveCount + 1 : Math.max(0, st.saveCount - 1),
        },
      };
    });
  };

  // near your other hooks
  useEffect(() => {
    // focus after paint (more reliable than setTimeout 0)
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      // optional: select existing text
      // inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, []); // run once on page load

  return (
    <div className="library-app search-page">
      {/* HEADER */}
      <AppHeader
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onClickWrite={() => {}}
      />

      {/* BODY */}
      <main className="library-layout library-layout--full">
        <div className="library-left">
          {/* HERO */}
          <section className="lib-hero" aria-label="Search header">
            <div className="lib-hero-grid">
                {/* Left: search takes remaining space */}
                <div className="search-identity-slot">
                  <div className="search-underline" onClick={() => inputRef.current?.focus()}>
                    {/* left icon button (already added earlier) */}
                    <button
                      type="button"
                      className="search-icon-btn"
                      aria-label="Focus search input"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => inputRef.current?.focus()}
                    >
                      <span className="material-symbols-outlined">search</span>
                    </button>

                    <input
                      ref={inputRef}
                      className="search-input-underline"
                      type="text"
                      placeholder="Search…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && query) {
                          setQuery("");
                          requestAnimationFrame(() => inputRef.current?.focus());
                        }
                      }}
                      aria-label="Search"
                      autoFocus
                      inputMode="search"
                    />

                    {/* right clear button — only when there’s text */}
                    {query && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        aria-label="Clear search"
                        onMouseDown={(e) => e.preventDefault()} // keep focus in input
                        onClick={() => {
                          setQuery("");
                          requestAnimationFrame(() => inputRef.current?.focus());
                        }}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Center: the three buttons dead-center */}
                <nav className="lib-tabs" aria-label="Search types">
                  <button
                    type="button"
                    className={`lib-tab ${activeKind === "books" ? "is-active" : ""}`}
                    onClick={() => setActiveKind("books")}
                    aria-current={activeKind === "books" ? "page" : undefined}
                  >
                    <span className="tab-label">Books</span>
                    <span className="tab-underline" aria-hidden="true">
                      <span className="seg seg-1" />
                      <span className="seg seg-2" />
                      <span className="seg seg-3" />
                      <span className="seg seg-4" />
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`lib-tab ${activeKind === "users" ? "is-active" : ""}`}
                    onClick={() => setActiveKind("users")}
                    aria-current={activeKind === "users" ? "page" : undefined}
                  >
                    <span className="tab-label">Users</span>
                    <span className="tab-underline" aria-hidden="true">
                      <span className="seg seg-1" />
                      <span className="seg seg-2" />
                      <span className="seg seg-3" />
                      <span className="seg seg-4" />
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`lib-tab ${activeKind === "genres" ? "is-active" : ""}`}
                    onClick={() => setActiveKind("genres")}
                    aria-current={activeKind === "genres" ? "page" : undefined}
                  >
                    <span className="tab-label">Genres</span>
                    <span className="tab-underline" aria-hidden="true">
                      <span className="seg seg-1" />
                      <span className="seg seg-2" />
                      <span className="seg seg-3" />
                      <span className="seg seg-4" />
                    </span>
                  </button>
                </nav>


                {/* Right: Filter stays where it is */}
                <div className="lib-hero-cta">
                    <button
                    type="button"
                    ref={sortBtnRef}
                    className="lib-cta lib-cta--icon lib-filter-btn"
                    aria-haspopup="menu"
                    aria-expanded={sortOpen}
                    aria-label="Sort results"
                    onClick={() => setSortOpen((v) => !v)}
                    >
                    <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
                    </button>

                    {sortOpen && (
                    <div ref={sortMenuRef} className="lib-filter-menu" role="menu" aria-label="Sort books">
                        <button role="menuitem" className="lib-filter-item" onClick={() => applySort("recent")}>Recently added</button>
                        <button role="menuitem" className="lib-filter-item" onClick={() => applySort("title")}>Title (A–Z)</button>
                        <button role="menuitem" className="lib-filter-item" onClick={() => applySort("author")}>Author (A–Z)</button>
                        <button role="menuitem" className="lib-filter-item" onClick={() => applySort("rating")}>Rating (high → low)</button>
                        <button role="menuitem" className="lib-filter-item" onClick={() => applySort("likes")}>Likes (high → low)</button>
                        <button role="menuitem" className="lib-filter-item" onClick={() => applySort("saves")}>Saves (high → low)</button>
                    </div>
                    )}
                </div>
            </div>
          </section>

          {/* RESULTS */}
          <section className="lib-scroll" aria-label="Search results">
            {activeKind === "books" && (
              <>
                {!query && (
                  <p className="muted" style={{ padding: "8px 2px" }}>
                    Type above to search books.
                  </p>
                )}
                {query && sortedBooks.length === 0 && (
                  <p style={{ padding: "8px 2px" }}>
                    No books found for “{query}”.
                  </p>
                )}

                <div className="lib-row search-books-grid">
                  {sortedBooks.map((book) => {
                    const avgRatingNum = parseFloat(
                      typeof book.rating === "string" ? book.rating : (book.rating ?? "0").toString()
                    );
                    const st = bookStates[String(book.id)];
                    const likeActive = st?.liked ?? false;
                    const saveActive = st?.saved ?? false;
                    const likeCount = st?.likeCount ?? (Number(book.likes) || 0);
                    const saveCount = st?.saveCount ?? (Number(book.bookmarks) || 0);

                    return (
                      <div key={book.id} className="lib-col">
                        <div className="lib-card lib-card--review" aria-label={`Book card for ${book.title}`}>
                          <Link
                            to={`/?book=${encodeURIComponent(String(book.id))}`}
                            className="lib-cover is-wide"
                            aria-label={`Open "${book.title}" on Home`}
                            title={`Open "${book.title}" on Home`}
                          >
                            {book.coverUrl ? (
                              <img src={book.coverUrl} alt={`${book.title} cover`} />
                            ) : null}
                          </Link>

                          <div className="lib-details review-details" aria-label="Book details">
                            <div className="lib-line lib-title-line" title={book.title}>
                              <Link
                                to={`/?book=${encodeURIComponent(String(book.id))}`}
                                className="lib-title-link"
                              >
                                {book.title || "—"}
                              </Link>
                            </div>
                            <div className="lib-line lib-year-line">
                              {book.year ? <span>{book.year}</span> : <span>—</span>}
                            </div>
                            <div className="lib-line lib-author-line" title={book.author}>
                              {book.author || "—"}
                            </div>

                            {/* Actions — identical behavior to Reviews */}
                            <div className="lib-row lib-row-actions is-inline" role="group" aria-label="Likes, rating, saves">
                                <LikeButton
                                className={`meta-icon-btn like ${likeActive ? "is-active" : ""}`}
                                glyphClass="meta-icon-glyph"
                                countClass="meta-icon-count"
                                active={likeActive}
                                count={likeCount}
                                onToggle={() => toggleLike(book.id)}
                                aria-label={likeActive ? "Unlike" : "Like"}
                                // prevent focus shift + bubbling that might change hover context
                                onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                />

                                <button
                                type="button"
                                className={`meta-icon-btn star ${(avgRatingNum ?? 0) > 0 ? "is-active" : ""}`}
                                aria-pressed={(avgRatingNum ?? 0) > 0}
                                title="Average rating"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => e.stopPropagation()}
                                >
                                <span className="material-symbols-outlined meta-icon-glyph">star</span>
                                <span className="meta-icon-count">
                                    {Number.isFinite(avgRatingNum) ? `${avgRatingNum.toFixed(1)}/5` : "—"}
                                </span>
                                </button>

                                <SaveButton
                                className={`meta-icon-btn save ${saveActive ? "is-active" : ""}`}
                                glyphClass="meta-icon-glyph"
                                countClass="meta-icon-count"
                                active={saveActive}
                                count={saveCount}
                                onToggle={() => toggleSave(book.id)}
                                aria-label={saveActive ? "Unsave" : "Save"}
                                onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                />

                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* fillers for masonry look */}
                  <div className="lib-col" />
                  <div className="lib-col" />
                  <div className="lib-col" />
                </div>
              </>
            )}

            {activeKind === "users" && (
              <div className="muted" style={{ padding: "8px 2px" }}>
                Users search coming next.
              </div>
            )}
            {activeKind === "genres" && (
              <div className="muted" style={{ padding: "8px 2px" }}>
                Genres search coming next.
              </div>
            )}
          </section>
        </div>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
