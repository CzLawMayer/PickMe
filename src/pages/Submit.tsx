import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";
import SubmissionModal from "@/components/SubmissionModal";

import { profile } from "@/profileData";
import { inProgressBooks, publishedBooks } from "@/SubmitData";

import "./Library.css";
import "./Submit.css";

/* ---------- PanelBook + mapper ---------- */
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
    (Array.isArray(b.chapters) ? b.chapters.length : 0) ||
    0;

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

/* ---------- BooksSection with overflow detect, wheel mapping, and trailing Add tile ---------- */
function BooksSection({
  title,
  books,
  onHoverBook,
  onLeaveAll,
  className = "",
  wheelToHorizontal = false,
  alwaysShowScrollbar = false,
  showAddTile = false,
  onClickAdd,
}: {
  title: string;
  books: PanelBook[];
  onHoverBook: (bk: PanelBook | null) => void;
  onLeaveAll: () => void;
  className?: string;
  wheelToHorizontal?: boolean;
  alwaysShowScrollbar?: boolean;
  showAddTile?: boolean;
  onClickAdd?: () => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // robust overflow detector
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const update = () => {
      const needs = el.scrollWidth - el.clientWidth > 1;
      el.classList.toggle("has-scroll", needs);
    };

    update();
    requestAnimationFrame(update);
    const t = setTimeout(update, 60);

    const ro = new ResizeObserver(update);
    ro.observe(el);

    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true });

    (document as any).fonts?.ready?.then(update).catch(() => {});
    window.addEventListener("resize", update);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [books]);

  // map vertical wheel to horizontal scroll (optional)
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!wheelToHorizontal || !trackRef.current) return;
    if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
      e.preventDefault();
      trackRef.current.scrollLeft += e.deltaY;
    }
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
          className={`books-track${alwaysShowScrollbar ? " force-scrollbar" : ""}`}
          ref={trackRef}
          onWheel={handleWheel}
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

          {/* trailing Add Book tile (only for sections that request it) */}
          {showAddTile && (
            <button
              type="button"
              className="book-tile book-add"
              aria-label="Add book"
              onClick={onClickAdd}
              title="Add book"
            />
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
export default function SubmitPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<PanelBook | null>(null);
  const [showModal, setShowModal] = useState(false);

  const inProg = useMemo(() => inProgressBooks.map(toPanelBook), []);
  const pub = useMemo(() => publishedBooks.map(toPanelBook), []);

  void profile;

  const openSubmission = () => setShowModal(true);
  const closeSubmission = () => setShowModal(false);

  return (
    <div className="library-app">
      {/* Keep your global header */}
      <AppHeader onClickWrite={() => setMenuOpen(true)} />

      <main className="library-layout">
        {/* LEFT column (hero + two rows) */}
        <div className="library-left">
          {/* User header (hero) preserved */}
          <section className="lib-hero" aria-label="Submit header">
            <div className="identity-cell">
              <ProfileIdentity compact />
            </div>

            {/* middle cell empty to preserve grid from Library.css */}
            <div aria-hidden="true" />

            {/* right-aligned CTA: Add book */}
            <div className="lib-hero-cta">
              <button
                className="add-book-btn"
                type="button"
                onClick={openSubmission}
              >
                Add book
              </button>
            </div>
          </section>

          {/* Two equal-height rows */}
          <div className="rows">
            <BooksSection
              title="In Progress"
              books={inProg}
              onHoverBook={setHovered}
              onLeaveAll={() => setHovered(null)}
              className="inprogress"
              wheelToHorizontal
              showAddTile
              onClickAdd={openSubmission}
              alwaysShowScrollbar
            />
            <BooksSection
              title="Published"
              books={pub}
              onHoverBook={setHovered}
              onLeaveAll={() => setHovered(null)}
              className="published"
              // scrollbar appears only if overflow
            />
          </div>
        </div>

        {/* RIGHT column: Feature panel preserved */}
        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel book={hovered ?? undefined} />
        </aside>
      </main>

      {/* Side menu preserved */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Submission popover (90% viewport), opens from hero button or + tile */}
      <SubmissionModal
        open={showModal}
        onClose={closeSubmission}
        onSave={(data) => {
          // TODO: persist data → add to your in-progress list
          closeSubmission();
        }}
      />
    </div>
  );
}
