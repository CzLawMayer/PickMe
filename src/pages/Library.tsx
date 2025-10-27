// src/pages/Library.tsx
import { useState } from "react";
import { Link } from "react-router-dom";

import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";

// NEW:
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import StarButton from "@/components/StarButton";
import { libraryBooks } from "@/profileData";

import "./Library.css";

export default function LibraryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Pick any book for now (first in library)
  const book = (libraryBooks?.() ?? [])[0] ?? {
    id: "placeholder",
    title: "Untitled",
    author: "Unknown",
    rating: 4.5,
    likes: 423,
    bookmarks: 76,
    year: 2023,
  };

  return (
    <div className="library-app">
      {/* Header */}
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

      <main className="library-layout">
        <div className="library-left">
          {/* Top banner */}
          <section className="lib-hero" aria-label="Library header">
            <div className="identity-cell" style={{ minWidth: 0 }}>
              <ProfileIdentity compact />
            </div>

            <nav className="lib-tabs" aria-label="Library sections">
              <Link to="/profile" className="lib-tab">Profile</Link>
              <Link to="/library" className="lib-tab" aria-current="page">Library</Link>
              <Link to="/read" className="lib-tab">Read</Link>
              <Link to="/reviews" className="lib-tab">Reviews</Link>
            </nav>
          </section>

          {/* NEW: Book summary block directly below username/buttons */}
          <section className="lib-item" aria-label="Featured library item">
            <div className="lib-item-cover" aria-label="Book cover placeholder" />
            <div className="lib-item-main">
              <h3 className="lib-item-title">{book.title}</h3>
              <div className="lib-item-year">{book.year ?? "—"}</div>
              <div className="lib-item-author">{book.author}</div>

              <div className="lib-item-meta">
                <LikeButton className="meta-icon-btn like" count={book.likes ?? 0} />
                <SaveButton className="meta-icon-btn save" count={book.bookmarks ?? 0} />
                <StarButton
                  className="meta-icon-btn star"
                  rating={Number(book.rating ?? 0)}
                  userRating={0}
                  onRate={() => {}}
                />
                <span className="lib-item-rating-text">
                  {Number(book.rating ?? 0).toFixed(1)}/5
                </span>
              </div>

              {/* 5-star row (filled based on rating) */}
              <div className="lib-item-stars" aria-label="User rating">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < Math.round(Number(book.rating ?? 0));
                  return (
                    <span
                      key={i}
                      className={`lib-star ${filled ? "is-filled" : ""}`}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Your future grid/list goes here */}
          <section className="lib-content" aria-label="Library content" />
        </div>

        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel />
        </aside>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
