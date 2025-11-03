// src/pages/Reviews.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";

import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";

import { profile, userReviewBooks } from "@/profileData";
import "./Reviews.css";

type ReviewBook = {
  id: string | number;
  title?: string;
  author?: string;
  coverUrl?: string;
  tags?: string[];
  rating?: number | string;
  likes?: number;
  bookmarks?: number;
  year?: number | string;
  userRating?: number;
  reviews?: string[];
};

// inline star row (used inside overlay)
function UserRatingStars({ value }: { value: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        lineHeight: 1,
        fontSize: "16px",
        width: "100%",
        justifyContent: "flex-start",
        fontWeight: 600,
        minHeight: "16px",
        color: "inherit",
      }}
      aria-label={`Your rating: ${value || 0} out of 5`}
    >
      {stars.map((n) => {
        const filled = value >= n;
        return (
          <span
            key={n}
            className={filled ? "user-star star-filled" : "user-star star-empty"}
            style={{ fontSize: "16px", lineHeight: 1, display: "block" }}
            aria-hidden="true"
          >
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

export default function ReviewsPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // source of truth
  const books = useMemo<ReviewBook[]>(() => userReviewBooks() as any, []);

  // selection / feature panel
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<ReviewBook | null>(null);

  const getBookById = (id: string | null) =>
    id ? books.find((b) => String(b.id) === String(id)) || null : null;

  const previewBook = (book: ReviewBook) => setActiveBook(book);
  const selectBook = (book: ReviewBook) => {
    const idStr = String(book.id);
    setSelectedBookId(idStr);
    setActiveBook(book);
  };
  const clearHover = () => {
    const sel = getBookById(selectedBookId);
    setActiveBook(sel || null);
  };

  function colorFromString(seed: string) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
    const bg = `hsl(${h} 70% 50% / 0.16)`;
    const border = `hsl(${h} 70% 50% / 0.38)`;
    const text = `hsl(${h} 85% 92%)`;
    return { bg, border, text };
  }

  type SortKey = "recent" | "title" | "author" | "rating" | "likes" | "saves";
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const sortBtnRef = useRef<HTMLButtonElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const applySort = (k: SortKey) => {
    setSortKey(k);
    setSortOpen(false);
  };

  const booksWithIndex = useMemo(
    () => books.map((b, i) => ({ ...b, __index: i })),
    [books]
  );

  const sortedBooks = useMemo(() => {
    const arr = [...booksWithIndex];
    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    switch (sortKey) {
      case "title":
        arr.sort((a, b) => str(a.title).localeCompare(str(b.title)));
        break;
      case "author":
        arr.sort((a, b) => str(a.author).localeCompare(str(b.author)));
        break;
      case "rating":
        arr.sort((a, b) => num(b.rating) - num(a.rating));
        break;
      case "likes":
        arr.sort((a, b) => num(b.likes) - num(a.likes));
        break;
      case "saves":
        arr.sort((a, b) => num(b.bookmarks) - num(a.bookmarks));
        break;
      case "recent":
      default:
        arr.sort((a, b) => a.__index - b.__index);
    }
    return arr;
  }, [booksWithIndex, sortKey]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (searchOpen && !searchMenuRef.current?.contains(t) && !searchBtnRef.current?.contains(t)) {
        setSearchOpen(false);
      }
      if (sortOpen && !sortMenuRef.current?.contains(t) && !sortBtnRef.current?.contains(t)) {
        setSortOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [searchOpen, sortOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [searchOpen]);

  const displayedBooks = useMemo(() => {
    if (!searchQuery.trim()) return sortedBooks;
    const q = searchQuery.trim().toLowerCase();
    return sortedBooks.filter((b) => {
      const t = (b.title ?? "").toLowerCase();
      const a = (b.author ?? "").toLowerCase();
      return t.includes(q) || a.includes(q);
    });
  }, [sortedBooks, searchQuery]);

  // like/save state
  type BookState = { liked: boolean; saved: boolean; likeCount: number; saveCount: number };
  const initialStates = useMemo(() => {
    const obj: Record<string, BookState> = {};
    for (const b of books) {
      obj[String(b.id)] = {
        liked: false,
        saved: false,
        likeCount: typeof b.likes === "number" ? b.likes : 0,
        saveCount: typeof b.bookmarks === "number" ? b.bookmarks : 0,
      };
    }
    return obj;
  }, [books]);
  const [bookStates, setBookStates] = useState<Record<string, BookState>>(initialStates);

  const toggleLike = (bookId: string | number) => {
    setBookStates((prev) => {
      const id = String(bookId);
      const st = prev[id];
      if (!st) return prev;
      const nextLiked = !st.liked;
      const nextLikeCount = nextLiked ? st.likeCount + 1 : Math.max(0, st.likeCount - 1);
      return { ...prev, [id]: { ...st, liked: nextLiked, likeCount: nextLikeCount } };
    });
  };
  const toggleSave = (bookId: string | number) => {
    setBookStates((prev) => {
      const id = String(bookId);
      const st = prev[id];
      if (!st) return prev;
      const nextSaved = !st.saved;
      const nextSaveCount = nextSaved ? st.saveCount + 1 : Math.max(0, st.saveCount - 1);
      return { ...prev, [id]: { ...st, saved: nextSaved, saveCount: nextSaveCount } };
    });
  };

  const activeState = activeBook ? bookStates[String(activeBook.id)] : undefined;

  return (
    <div className="library-app reviews-page">
      {/* ===== HEADER ===== */}
      <header className="header">
        <h1 className="logo">
          <Link to="/" className="logo-link" aria-label="Go to home">
            Pick<span>M</span>e!
          </Link>
        </h1>

        <div className="header-icons">
          <button type="button" className="icon" aria-label="write">✏️</button>
          <button type="button" className="icon" aria-label="search">🔍</button>
          <button
            type="button"
            className="icon icon-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "X" : "☰"}
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <main className="library-layout">
        {/* LEFT */}
        <div className="library-left">
          <section className="lib-hero" aria-label="Library header">
            <div className="identity-cell" style={{ minWidth: 0 }}>
              <ProfileIdentity compact />
            </div>

            <nav className="lib-tabs" aria-label="Library sections">
              <NavLink to="/library" className="lib-tab">Library</NavLink>
              <NavLink to="/stories" className="lib-tab">Stories</NavLink>
              <NavLink to="/read" end className="lib-tab">Read</NavLink>
              <NavLink to="/reviews" end className="lib-tab is-active">Reviews</NavLink>
            </nav>

            <div className="lib-hero-cta">
              <button
                type="button"
                ref={searchBtnRef}
                className="lib-cta lib-cta--icon lib-search-btn"
                aria-haspopup="dialog"
                aria-expanded={searchOpen}
                aria-label="Search reviews"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">search</span>
              </button>

              <button
                type="button"
                ref={sortBtnRef}
                className="lib-cta lib-cta--icon lib-filter-btn"
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                aria-label="Sort reviews"
                onClick={() => setSortOpen((v) => !v)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
              </button>

              {searchOpen && (
                <div className="lib-search-menu" ref={searchMenuRef}>
                  <div className="lib-search-field has-clear">
                    <input
                      ref={searchInputRef}
                      className="lib-search-input"
                      type="text"
                      placeholder="Search by title or author…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="lib-search-clear--inside"
                      aria-label="Clear search"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                  </div>
                </div>
              )}

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
          </section>

          {/* GRID */}
          <section className="lib-scroll" aria-label="Your reviewed books" onMouseLeave={clearHover}>
            <div className="lib-row">
              {displayedBooks.map((book) => {
                const st = bookStates[String(book.id)];
                const likeActive = st?.liked ?? false;
                const saveActive = st?.saved ?? false;
                const likeCount = st?.likeCount ?? 0;
                const saveCount = st?.saveCount ?? 0;

                const avgRatingNum = parseFloat(
                  typeof book.rating === "string" ? book.rating : (book.rating ?? "0").toString()
                );

                return (
                  <div key={book.id} className="lib-col">
                    <div
                      className="lib-card lib-card--review"
                      aria-label={`Book card for ${book.title}`}
                      onMouseEnter={() => previewBook(book)}
                      onFocus={() => previewBook(book)}
                      onClick={() => selectBook(book)}
                      tabIndex={0}
                    >
                      {/* COVER */}
                      <div
                        className={`lib-cover is-wide${selectedBookId === String(book.id) ? " is-selected" : ""}`}
                        aria-label={`${book.title} cover`}
                        onMouseEnter={() => previewBook(book)}
                      >
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={`${book.title} cover`} />
                        ) : null}

                        {/* OVERLAY */}
                        <div className="review-overlay" aria-hidden="true">
                            <div className="review-overlay-inner">
                                {/* HEADER stays fixed */}
                                <div className="review-header">
                                <div className="review-title" title={book.title}>{book.title}</div>

                                <div className="review-meta">
                                    <span className="user-rating-avatar" aria-hidden="true">
                                    <img
                                        src={(profile as any)?.avatarUrl || (profile as any)?.photo || (profile as any)?.avatar || ""}
                                        alt=""
                                    />
                                    </span>
                                    <span className="user-stars-wrap" aria-label={`Your rating for ${book.title}`}>
                                    <UserRatingStars value={book.userRating ?? 0} />
                                    </span>
                                </div>

                                <div className="review-divider" />
                                </div>

                                {/* BODY scrolls if long */}
                                <div className="review-scroll" role="region" aria-label="Review text">
                                {Array.isArray((book as any)?.reviews) && (book as any).reviews.length > 0
                                    ? (book as any).reviews.map((line: string, i: number) => (
                                        <div
                                            className="review-line"
                                            key={i}
                                            style={{ fontSize: "16px", lineHeight: 1.5, margin: "0 0 10px 0" }}
                                        >
                                            {line}
                                        </div>
                                        ))
                                    : <div className="review-line" style={{ fontSize: "16px", lineHeight: 1.5 }}>No review yet</div>
                                }
                                </div>
                            </div>
                        </div>
                      </div>

                      {/* INFO BELOW */}
                      <div className="lib-details review-details" aria-label="Book details">
                        <div className="lib-line lib-title-line" title={book.title}>
                          {book.title || "—"}
                        </div>
                        <div className="lib-line lib-year-line">
                          {book.year ? <span>{book.year}</span> : <span>—</span>}
                        </div>
                        <div className="lib-line lib-author-line" title={book.author}>
                          {book.author || "—"}
                        </div>

                        <div className="lib-row lib-row-actions is-inline" role="group" aria-label="Likes, rating, saves">
                          <LikeButton
                            className={`meta-icon-btn like ${likeActive ? "is-active" : ""}`}
                            glyphClass="meta-icon-glyph"
                            countClass="meta-icon-count"
                            active={likeActive}
                            count={likeCount}
                            onToggle={() => toggleLike(book.id)}
                            aria-label={likeActive ? "Unlike" : "Like"}
                          />
                          <button
                            type="button"
                            className={`meta-icon-btn star ${(book.userRating ?? 0) > 0 ? "is-active" : ""}`}
                            aria-pressed={(book.userRating ?? 0) > 0}
                            title="Average rating"
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
                          />
                        </div>

                        <div className="lib-line lib-genre-row">
                          {Array.isArray(book.tags) && book.tags.length > 0 ? (() => {
                            const tag = book.tags[0];
                            const c = colorFromString(tag);
                            return (
                              <span
                                className="genre-pill"
                                title={tag}
                                style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}
                              >
                                {tag}
                              </span>
                            );
                          })() : null}
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
          </section>
        </div>

        {/* RIGHT: Feature panel */}
        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel
            book={activeBook || undefined}
            liked={activeState?.liked ?? false}
            saved={activeState?.saved ?? false}
            userRating={activeBook?.userRating ?? 0}
            onToggleLike={() => activeBook && toggleLike(activeBook.id)}
            onToggleSave={() => activeBook && toggleSave(activeBook.id)}
            onRate={(val) => {
              console.log("rate", activeBook?.id, val);
            }}
          />
        </aside>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
