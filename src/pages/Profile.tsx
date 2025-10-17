import { useState } from "react";
import "./Profile.css";
import SideMenu from "@/components/SideMenu";
import LikeButton from "@/components/LikeButton";
import StarButton from "@/components/StarButton";
import SaveButton from "@/components/SaveButton";

export default function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Local state for the metadata actions
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const baseRating = 4.2;
  const priorVotes = 20;
  const combinedRating =
    userRating > 0
      ? (baseRating * priorVotes + userRating) / (priorVotes + 1)
      : baseRating;

  return (
    <div className="profile-app">
      {/* Top bar (same as Home) */}
      <header className="header">
        <h1 className="logo">
          Pick<span>M</span>e!
        </h1>
        <div className="header-icons">
          <div className="icon" aria-label="write">✏️</div>
          <div className="icon" aria-label="search">🔍</div>
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

      <main className="profile-page">
        {/* Global 3×3 grid: rows = [top | middle | bottom], cols = [L | C | R] */}
        <div className="profile-grid">

          {/* LEFT — Row 1: Identity */}
          <section className="cell identity-cell">
            <div className="profile-identity">
              <div className="profile-card">
                <div className="profile-avatar" aria-hidden>
                  <svg width="96" height="96" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                    <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                    <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="profile-id">
                  <h2 className="profile-name">Your Name</h2>
                  <div className="profile-handle">@username</div>
                  <div className="profile-bars">
                    <div className="bar bar-1" />
                    <div className="bar bar-2" />
                    <div className="bar bar-3" />
                    <div className="bar bar-4" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* LEFT — Row 2: Stories (title + black box fills the row) */}
          <section className="cell stories-cell section">
            <h2 className="section-title">Stories</h2>
            <div className="strip stories-strip" />
          </section>

          {/* LEFT — Row 3: Top 5 Favorites (title + black box fills the row) */}
          <section className="cell favorites-cell section">
            <h2 className="section-title">Top 5 Favorites</h2>
            <div className="strip favorites-strip" />
          </section>

          {/* CENTER — spans all 3 rows */}
          <section className="cell feature-cell">
            <div className="feature-card">
              <div className="feature-stack">
                <div className="feature-cover-placeholder" aria-label="Featured book cover placeholder" />
                <div className="feature-info">
                  <h3 className="feature-title">Example Book Title</h3>

                  <hr className="meta-hr" />

                  <div className="feature-author">
                    <span className="meta-avatar--sm" aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                        <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                        <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="feature-author-name">Author Name</span>
                  </div>

                  <hr className="meta-hr" />

                  <div className="meta-actions">
                    <LikeButton
                      count={(liked ? 1 : 0) + 127}
                      active={liked}
                      onToggle={() => setLiked((v) => !v)}
                    />
                    <StarButton
                      rating={combinedRating}
                      userRating={userRating}
                      active={userRating > 0}
                      onRate={(v) => setUserRating((prev) => (prev === v ? 0 : v))}
                    />
                    <SaveButton
                      count={(saved ? 1 : 0) + 56}
                      active={saved}
                      onToggle={() => setSaved((v) => !v)}
                    />
                  </div>

                  <hr className="meta-hr" />

                  <div className="align-left">
                    <p className="meta-chapters"><span>5 / 20 Chapters</span></p>
                  </div>

                  <hr className="meta-hr" />

                  <div className="align-left">
                    <ul className="meta-tags vertical-tags">
                      <li>Fantasy</li>
                      <li>Adventure</li>
                      <li>Mystery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT — Rows 1–2: Library (title stuck to top, shelf fills rest) */}
          <section className="cell library-cell section">
            <h2 className="section-title right-title">Library</h2>
            <div className="shelf" role="grid" aria-label="Bookshelf">
              <div className="shelf-row" role="row" />
              <div className="shelf-row" role="row" />
              <div className="shelf-row" role="row" />
            </div>
          </section>

          {/* RIGHT — Row 3: Currently Reading (title + black box fills the row) */}
          <section className="cell current-cell section">
            <h2 className="section-title">Currently Reading</h2>
            <div className="strip current-strip" />
          </section>
        </div>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
