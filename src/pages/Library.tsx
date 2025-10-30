// src/pages/Library.tsx
import { useState } from "react";
import { Link } from "react-router-dom";

import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";

import "./Library.css";

import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";

import { userLibraryBooks } from "@/profileData";

// tiny helper for the personal stars row on row 5
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
        color: "#777",
        width: "100%",
        justifyContent: "flex-start",
      }}
      aria-label={`Your rating: ${value || 0} out of 5`}
    >
      {stars.map((n) => {
        const filled = value >= n;
        return (
          <span
            key={n}
            className="material-symbols-outlined"
            style={{
              fontSize: "20px",
              lineHeight: 1,
              color: filled ? "#f2ac15" : "#fff",
              ["--ms-fill" as any]: filled ? 1 : 0,
            }}
            aria-hidden="true"
          >
            star
          </span>
        );
      })}
    </div>
  );
}

export default function LibraryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // full list of user's books, merged with userRating etc.
  const books = userLibraryBooks();

  // --- per-book state maps ----------------------------------
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    books.forEach((b) => {
      m[b.id] = false; // could preload true/false if you track that
    });
    return m;
  });

  const [savedMap, setSavedMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    books.forEach((b) => {
      m[b.id] = false;
    });
    return m;
  });

  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>(
    () => {
      const m: Record<string, number> = {};
      books.forEach((b) => {
        m[b.id] = typeof b.likes === "number" ? b.likes : 0;
      });
      return m;
    }
  );

  const [saveCountMap, setSaveCountMap] = useState<Record<string, number>>(
    () => {
      const m: Record<string, number> = {};
      books.forEach((b) => {
        m[b.id] = typeof b.bookmarks === "number" ? b.bookmarks : 0;
      });
      return m;
    }
  );

  // --- handlers that update just one book -------------------
  function toggleLike(bookId: string) {
    setLikedMap((prev) => {
      const nextLiked = !prev[bookId];

      setLikeCountMap((prevCounts) => ({
        ...prevCounts,
        [bookId]: nextLiked
          ? prevCounts[bookId] + 1
          : Math.max(0, prevCounts[bookId] - 1),
      }));

      return { ...prev, [bookId]: nextLiked };
    });
  }

  function toggleSave(bookId: string) {
    setSavedMap((prev) => {
      const nextSaved = !prev[bookId];

      setSaveCountMap((prevCounts) => ({
        ...prevCounts,
        [bookId]: nextSaved
          ? prevCounts[bookId] + 1
          : Math.max(0, prevCounts[bookId] - 1),
      }));

      return { ...prev, [bookId]: nextSaved };
    });
  }

  return (
    <div className="library-app">
      {/* ===== HEADER (unchanged visually) ===== */}
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
        {/* LEFT SIDE: hero (static) + scroll area */}
        <div className="library-left">
          {/* --- Top identity / tabs header (static, stays fixed above scroll) --- */}
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
                // normalize avg rating from booksData
                const avgRatingNum = parseFloat(
                  typeof book.rating === "string"
                    ? book.rating
                    : (book.rating ?? "0").toString()
                );

                const liked = likedMap[book.id] ?? false;
                const saved = savedMap[book.id] ?? false;
                const likeCount = likeCountMap[book.id] ?? 0;
                const saveCount = saveCountMap[book.id] ?? 0;

                return (
                  <div key={book.id} className="lib-col">
                    <div
                      className="lib-card"
                      aria-label={`Book card for ${book.title}`}
                    >
                      {/* Cover (left column in the card) */}
                      <div
                        className="lib-cover"
                        aria-label={`${book.title} cover`}
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
                            }}
                          />
                        ) : null}
                      </div>

                      {/* Right side of the card: 5 detail rows */}
                      <div className="lib-details" aria-label="Book details">
                        {/* Row 1: title */}
                        <div
                          className="lib-line book-title"
                          title={book.title}
                        >
                          {book.title || "—"}
                        </div>

                        {/* Row 2: year */}
                        <div className="lib-line book-year">
                          {book.year ? book.year : "—"}
                        </div>

                        {/* Row 3: author */}
                        <div
                          className="lib-line book-author"
                          title={book.author}
                        >
                          {book.author || "—"}
                        </div>

                        {/* Row 4: like / avg rating / save */}
                        <div
                          className="lib-row lib-row-actions is-inline"
                          role="group"
                          aria-label="Likes, rating, saves"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            overflow: "hidden",
                            marginBottom: "8px", // also gives space above stars
                          }}
                        >
                          {/* Like button */}
                          <LikeButton
                            className={`meta-icon-btn like ${
                              liked ? "is-active" : ""
                            }`}
                            glyphClass="meta-icon-glyph"
                            countClass="meta-icon-count"
                            active={liked}
                            count={likeCount}
                            onToggle={() => toggleLike(book.id)}
                            aria-label={liked ? "Unlike" : "Like"}
                          />

                          {/* Average rating display (NOT interactive now) */}
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

                          {/* Save button */}
                          <SaveButton
                            className={`meta-icon-btn save ${
                              saved ? "is-active" : ""
                            }`}
                            glyphClass="meta-icon-glyph"
                            countClass="meta-icon-count"
                            active={saved}
                            count={saveCount}
                            onToggle={() => toggleSave(book.id)}
                            aria-label={saved ? "Unsave" : "Save"}
                          />
                        </div>

                        {/* Row 5: user's own rating stars */}
                        <div className="lib-line user-stars-row">
                          <UserRatingStars value={book.userRating ?? 0} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* filler cols to keep the last grid row balanced visually */}
              <div className="lib-col" />
              <div className="lib-col" />
              <div className="lib-col" />
            </div>
          </section>
        </div>

        {/* RIGHT SIDE: Feature panel (static / not scrolling) */}
        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel />
        </aside>
      </main>

      {/* Side menu overlay panel */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
