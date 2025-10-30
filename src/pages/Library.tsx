// src/pages/Library.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";

import "./Library.css";

import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import { userLibraryBooks } from "@/profileData";

// --- tiny helper for the personal stars (user rating) ---
function UserRatingStars({ value }: { value: number }) {
  // value is user's own rating 0–5
  const stars = [1, 2, 3, 4, 5];

  return (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "4px",

      // let the glyphs breathe vertically
      lineHeight: 1.2,
      minHeight: "20px",

      width: "100%",
      justifyContent: "flex-start",

      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: 600,
      fontSize: "18px",
      color: "#fff",
      marginTop: "6px",

      // don't crop descenders
      overflow: "visible",
    }}
    aria-label={`Your rating: ${value || 0} out of 5`}
  >
    {stars.map((n) => {
      const filled = value >= n;
      return (
        <span
          key={n}
          style={{
            lineHeight: 1.2,
            color: filled ? "#f2ac15" : "#ffffff",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
          aria-hidden="true"
        >
          {filled ? "★" : "☆"}
        </span>
      );
    })}
  </div>
  );
}

export default function LibraryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // user's full library with merged data (id, title, coverUrl, rating, userRating, etc.)
  const books = userLibraryBooks();

  // pick an initial featured book so right panel isn't empty on load
  const [hoveredBook, setHoveredBook] = useState<any | null>(
    books[0] ?? null
  );

  // per-book UI state (liked/saved + counts)
  type BookState = {
    liked: boolean;
    saved: boolean;
    likeCount: number;
    saveCount: number;
  };

  const initialStates = useMemo(() => {
    const obj: Record<string, BookState> = {};
    for (const b of books) {
      obj[b.id] = {
        liked: false,
        saved: false,
        likeCount: typeof b.likes === "number" ? b.likes : 0,
        saveCount: typeof b.bookmarks === "number" ? b.bookmarks : 0,
      };
    }
    return obj;
  }, [books]);

  const [bookStates, setBookStates] = useState<Record<string, BookState>>(
    initialStates
  );

  // toggle like for a single book
  const toggleLike = (bookId: string | number) => {
    setBookStates((prev) => {
      const id = String(bookId);
      const st = prev[id];
      if (!st) return prev;

      const nextLiked = !st.liked;
      const nextLikeCount = nextLiked
        ? st.likeCount + 1
        : Math.max(0, st.likeCount - 1);

      return {
        ...prev,
        [id]: {
          ...st,
          liked: nextLiked,
          likeCount: nextLikeCount,
        },
      };
    });
  };

  // toggle save for a single book
  const toggleSave = (bookId: string | number) => {
    setBookStates((prev) => {
      const id = String(bookId);
      const st = prev[id];
      if (!st) return prev;

      const nextSaved = !st.saved;
      const nextSaveCount = nextSaved
        ? st.saveCount + 1
        : Math.max(0, st.saveCount - 1);

      return {
        ...prev,
        [id]: {
          ...st,
          saved: nextSaved,
          saveCount: nextSaveCount,
        },
      };
    });
  };

  // figure out like/save state for the book currently hovered (for FeaturePanel)
  const hoveredState = hoveredBook
    ? bookStates[String(hoveredBook.id)]
    : undefined;

  return (
    <div className="library-app">
      {/* ===== HEADER ===== */}
      <header className="header">
        <h1 className="logo">
          <Link to="/" className="logo-link" aria-label="Go to home">
            Pick<span>M</span>e!
          </Link>
        </h1>

        <div className="header-icons">
          <button type="button" className="icon" aria-label="write">
            ✏️
          </button>
          <button type="button" className="icon" aria-label="search">
            🔍
          </button>
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

      {/* ===== BODY LAYOUT ===== */}
      <main className="library-layout">
        {/* LEFT SIDE: identity header (static) + scroll area below */}
        <div className="library-left">
          {/* --- Top identity / tabs header --- */}
          <section className="lib-hero" aria-label="Library header">
            <div className="identity-cell" style={{ minWidth: 0 }}>
              <ProfileIdentity compact />
            </div>

            <nav className="lib-tabs" aria-label="Library sections">
              <Link to="/profile" className="lib-tab">
                Profile
              </Link>
              <Link to="/library" className="lib-tab" aria-current="page">
                Library
              </Link>
              <Link to="/read" className="lib-tab">
                Read
              </Link>
              <Link to="/reviews" className="lib-tab">
                Reviews
              </Link>
            </nav>
          </section>

          {/* --- Scrollable books area --- */}
          <section className="lib-scroll" aria-label="Your books">
            <div className="lib-row">
              {books.map((book) => {
                const st = bookStates[String(book.id)];
                const likeActive = st?.liked ?? false;
                const saveActive = st?.saved ?? false;
                const likeCount = st?.likeCount ?? 0;
                const saveCount = st?.saveCount ?? 0;

                const avgRatingNum = parseFloat(
                  typeof book.rating === "string"
                    ? book.rating
                    : (book.rating ?? "0").toString()
                );

                return (
                  <div key={book.id} className="lib-col">
                    <div
                      className="lib-card"
                      aria-label={`Book card for ${book.title}`}
                      onMouseEnter={() => setHoveredBook(book)}
                      onFocus={() => setHoveredBook(book)} // keyboard focus fallback
                    >
                      {/* COVER */}
                      <div
                        className="lib-cover"
                        aria-label={`${book.title} cover`}
                        onMouseEnter={() => setHoveredBook(book)}
                      >
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={`${book.title} cover`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              borderRadius: 0, // square corners
                            }}
                          />
                        ) : null}
                      </div>

                      {/* DETAILS */}
                      <div
                        className="lib-details"
                        aria-label="Book details"
                        onMouseEnter={() => setHoveredBook(book)}
                      >
                        {/* Row 1: title */}
                        <div
                          className="lib-line lib-title-line"
                          title={book.title}
                          style={{
                            fontSize: "clamp(16px,1.6vw,20px)",
                            fontWeight: 700,
                            lineHeight: 1.15,
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            overflowWrap: "break-word",
                          }}
                        >
                          {book.title || "—"}
                        </div>

                        {/* Row 2: year */}
                        <div
                          className="lib-line lib-year-line"
                          style={{
                            marginTop: "6px",
                            fontSize: "12px",
                            lineHeight: 1.2,
                          }}
                        >
                          {book.year ? book.year : "—"}
                        </div>

                        {/* Row 3: author */}
                        <div
                          className="lib-line lib-author-line"
                          title={book.author}
                          style={{
                            fontSize: "13px",
                            lineHeight: 1.3,
                            color: "rgba(255,255,255,0.7)",
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            overflowWrap: "break-word",
                          }}
                        >
                          {book.author || "—"}
                        </div>

                        {/* Row 4: buttons + avg rating + save
                            PLUS user's own 5-star rating right under */}
                        <div
                          className="lib-row lib-row-actions is-inline"
                          role="group"
                          aria-label="Likes, rating, saves"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            // IMPORTANT: allow stars to render fully
                            overflow: "visible",

                            marginTop: "10px",
                            marginBottom: "10px",

                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                          onMouseEnter={() => setHoveredBook(book)}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              gap: "8px",
                              flexWrap: "nowrap",
                              width: "100%",
                            }}
                          >
                            {/* Like */}
                            <LikeButton
                              className={`meta-icon-btn like ${
                                likeActive ? "is-active" : ""
                              }`}
                              glyphClass="meta-icon-glyph"
                              countClass="meta-icon-count"
                              active={likeActive}
                              count={likeCount}
                              onToggle={() => toggleLike(book.id)}
                              aria-label={likeActive ? "Unlike" : "Like"}
                            />

                            {/* Average rating (global) */}
                            <button
                              type="button"
                              className={`meta-icon-btn star ${
                                (book.userRating ?? 0) > 0 ? "is-active" : ""
                              }`}
                              aria-pressed={(book.userRating ?? 0) > 0}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Average rating"
                            >
                              <span className="material-symbols-outlined meta-icon-glyph">
                                star
                              </span>
                              <span className="meta-icon-count">
                                {Number.isFinite(avgRatingNum)
                                  ? `${avgRatingNum.toFixed(1)}/5`
                                  : "—"}
                              </span>
                            </button>

                            {/* Save */}
                            <SaveButton
                              className={`meta-icon-btn save ${
                                saveActive ? "is-active" : ""
                              }`}
                              glyphClass="meta-icon-glyph"
                              countClass="meta-icon-count"
                              active={saveActive}
                              count={saveCount}
                              onToggle={() => toggleSave(book.id)}
                              aria-label={saveActive ? "Unsave" : "Save"}
                            />
                          </div>

                          {/* User's personal rating stars (now directly below the buttons) */}
                          <UserRatingStars value={book.userRating ?? 0} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* filler cols to balance last row visually */}
              <div className="lib-col" />
              <div className="lib-col" />
              <div className="lib-col" />
            </div>
          </section>
        </div>

        {/* RIGHT SIDE: Feature panel */}
        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel
            book={hoveredBook || undefined}
            liked={hoveredState?.liked ?? false}
            saved={hoveredState?.saved ?? false}
            userRating={hoveredBook?.userRating ?? 0}
            onToggleLike={() => {
              if (hoveredBook) toggleLike(hoveredBook.id);
            }}
            onToggleSave={() => {
              if (hoveredBook) toggleSave(hoveredBook.id);
            }}
            onRate={(val) => {
              // future: update per-book userRating here if you add rating-from-panel
              console.log("rate", hoveredBook?.id, val);
            }}
          />
        </aside>
      </main>

      {/* Side menu overlay */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
