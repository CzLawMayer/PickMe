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

// tiny helper for the personal stars row (row 5)
function UserRatingStars({ value }: { value: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div
      className="user-rating-stars"
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
              color: filled ? "#f2ac15" : "rgba(255,255,255,0.4)",
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

  // all user's books, merged with personal rating
  const books = userLibraryBooks(); // [{...book, userRating}]

  // demo like/save just to show counts
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(123);
  const [saveCount, setSaveCount] = useState(45);

  const onToggleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
  };
  const onToggleSave = () => {
    setSaved((v) => !v);
    setSaveCount((c) => (saved ? Math.max(0, c - 1) : c + 1));
  };

  return (
    <div className="library-app">
      {/* Global header stays fixed at the very top of the page layout */}
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

      {/* 2-column main area. We'll lock its height so the inside can scroll */}
      <main
        className="library-layout"
        style={{
          // make the whole main area exactly fill viewport under header
          height: "calc(100svh - var(--app-header-h))",
          minHeight: "calc(100svh - var(--app-header-h))",
          maxHeight: "calc(100svh - var(--app-header-h))",
        }}
      >
        {/* LEFT COLUMN */}
        <div
          className="library-left"
          style={{
            // turn left side into a vertical flexbox:
            display: "flex",
            flexDirection: "column",

            // VERY IMPORTANT: allow inner flex children to actually shrink/scroll
            minHeight: 0,
          }}
        >
          {/* This stays pinned at the top of the left pane (not scrolling) */}
          <section
            className="lib-hero"
            aria-label="Library header"
            style={{
              flex: "0 0 auto",
            }}
          >
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

          {/* SCROLL AREA:
             This is the only thing that scrolls now.
             It fills the remaining height under lib-hero.
          */}
          <div
            className="library-scroll"
            style={{
              flex: "1 1 auto",
              minHeight: 0, // critical so overflow works
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {/* Book grid */}
            <section className="lib-row" aria-label="Your books">
              {books.map((book) => {
                // normalize numeric rating from book.rating
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
                    >
                      {/* Cover */}
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

                      {/* 5-row detail block */}
                      <div className="lib-details" aria-label="Book details">
                        {/* Row 1: title (big, wraps) */}
                        <div
                          className="lib-line book-title-line"
                          title={book.title}
                        >
                          {book.title || "—"}
                        </div>

                        {/* Row 2: year */}
                        <div className="lib-line book-year-line">
                          {book.year ? book.year : "—"}
                        </div>

                        {/* Row 3: author (dim white, wraps) */}
                        <div
                          className="lib-line book-author-line"
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
                            marginBottom: "12px", // breathing room before stars
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
                            onToggle={onToggleLike}
                            aria-label={liked ? "Unlike" : "Like"}
                          />

                          {/* Average rating display */}
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
                            onToggle={onToggleSave}
                            aria-label={saved ? "Unsave" : "Save"}
                          />
                        </div>

                        {/* Row 5: user's own stars */}
                        <div
                          className="lib-line"
                          style={{
                            overflow: "visible",
                          }}
                        >
                          <UserRatingStars value={book.userRating ?? 0} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* filler cols for grid balance */}
              <div className="lib-col" />
              <div className="lib-col" />
              <div className="lib-col" />
            </section>

            {/* optional bottom content below grid */}
            <section className="lib-content" aria-label="Library content">
              {/* future content goes here */}
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN (Feature panel). This does NOT scroll with the books.
            It sits next to the left column for the full height. */}
        <aside
          className="library-feature"
          aria-label="Featured"
          style={{
            // make sure it stretches the same fixed height as main
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <FeaturePanel />
        </aside>
      </main>

      {/* Slide-out menu */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
