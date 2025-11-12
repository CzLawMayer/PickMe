import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";
import { profile } from "@/profileData";
import { inProgressBooks, publishedBooks } from "@/SubmitData";

import "./Library.css";       // your existing layout/hero/feature styles
import "./Submit.css";    // new: just the two rows + tiles

type PanelBook = {
  id: string | number;
  title: string;
  author?: string;
  coverUrl?: string | null;
  likes?: number;
  rating?: number | string;
  bookmarks?: number;
  currentChapter?: number;
  totalChapters?: number;
  chapters?: Array<unknown>;
  tags?: string[];
  userRating?: number;
};

function toPanelBook(b: any): PanelBook {
  const total =
    (typeof b.totalChapters === "number" && b.totalChapters) ||
    (Array.isArray(b.chapters) ? b.chapters.length : 0) || 0;

  return {
    id: b.id,
    title: b.title,
    author: b.author,
    coverUrl: b.coverUrl ?? null,
    likes: typeof b.likes === "number" ? b.likes : 0,
    rating: typeof b.rating === "string" ? b.rating : (typeof b.rating === "number" ? b.rating : 0),
    bookmarks: typeof b.bookmarks === "number" ? b.bookmarks : (typeof b.saves === "number" ? b.saves : 0),
    currentChapter: typeof b.currentChapter === "number" ? b.currentChapter : 0,
    totalChapters: total,
    chapters: b.chapters,
    tags: Array.isArray(b.tags) ? b.tags : (Array.isArray(b.subGenres) ? b.subGenres : []),
    userRating: typeof b.userRating === "number" ? b.userRating : 0,
  };
}

import { useRef } from "react";

function BooksSection({
  title,
  books,
  onHoverBook,
  onLeaveAll,
  className = "",
  wheelToHorizontal = false,   // <— NEW
}: {
  title: string;
  books: PanelBook[];
  onHoverBook: (bk: PanelBook | null) => void;
  onLeaveAll: () => void;
  className?: string;
  wheelToHorizontal?: boolean; // <— NEW
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!wheelToHorizontal || !trackRef.current) return;

    // If the user is primarily scrolling vertically, translate it to horizontal
    const verticalIntent = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
    if (verticalIntent) {
      e.preventDefault(); // keep the page from trying to scroll vertically
      trackRef.current.scrollLeft += e.deltaY; // natural direction
    }
    // If they use a trackpad swiping left/right (deltaX), let the browser handle it.
  };

  return (
    <section className={`subsec ${className}`}>
      <div className="subsec-head">
        <h2 className="subsec-title">{title}</h2>
        <div className="subsec-bars">
          <div className="bar b1" />
          <div className="bar b2" />
          <div className="bar b3" />
          <div className="bar b4" />
        </div>
      </div>

      <div className="books-rail" onMouseLeave={onLeaveAll} aria-label={`${title} books`}>
        <div
          className="books-track"
          ref={trackRef}
          onWheel={handleWheel}   // <— NEW
        >
          {books.map((b) => (
            <button
              key={b.id}
              className="book-tile"
              aria-label={b.title}
              onMouseEnter={() => onHoverBook(b)}
              style={b.coverUrl ? { backgroundImage: `url(${b.coverUrl})` } : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


export default function SubmitPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<PanelBook | null>(null);

  const inProg = useMemo(() => inProgressBooks.map(toPanelBook), []);
  const pub    = useMemo(() => publishedBooks.map(toPanelBook), []);

  void profile; // if ProfileIdentity uses it internally

  return (
    <div className="library-app">
      <AppHeader onClickWrite={() => setMenuOpen(true)} />

      <main className="library-layout">
        {/* LEFT: your existing hero from Library.css + our two rows */}
        <div className="library-left">
          <section className="lib-hero" aria-label="Submit header">
            <div className="identity-cell">
              <ProfileIdentity compact />
            </div>

            <nav className="lib-tabs" aria-label="Sections">
              <NavLink to="/library" className="lib-tab">Library</NavLink>
              <NavLink to="/stories" className="lib-tab">Stories</NavLink>
              <NavLink to="/read" className="lib-tab">Read</NavLink>
              <NavLink to="/reviews" className="lib-tab">Reviews</NavLink>
            </nav>

            <div className="lib-hero-cta" aria-hidden="true" />
          </section>

          {/* Two equal-height rows (in progress at top, published at bottom) */}
          <div className="rows">
            <BooksSection
              title="In Progress"
              books={inProg}
              onHoverBook={setHovered}
              onLeaveAll={() => setHovered(null)}
              className="inprogress"
              wheelToHorizontal
            />
            <BooksSection
              title="Published"
              books={pub}
              onHoverBook={setHovered}
              onLeaveAll={() => setHovered(null)}
              className="published"
              wheelToHorizontal
            />
          </div>
        </div>

        {/* RIGHT: your existing feature panel area from Library.css */}
        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel book={hovered ?? undefined} />
        </aside>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
