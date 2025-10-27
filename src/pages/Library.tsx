// src/pages/Library.tsx
import { useState } from "react";
import { Link } from "react-router-dom";

import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";

import "./Library.css";

export default function LibraryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="library-app">
      {/* Header (parity with Profile/Home) */}
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

      {/* Page body */}
      <main className="library-layout">
        {/* Left: identity + tabs + content */}
        <div className="library-left">
          {/* Top banner: Profile identity (compact) + Library tabs */}
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

          {/* Library content (books grid/list goes here) */}
          <section className="lib-content" aria-label="Library content">
            {/* TODO: render your books grid/list here */}
          </section>
        </div>

        {/* Right: fixed feature rail */}
        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel />
        </aside>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
