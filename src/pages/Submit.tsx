import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import "./Submit.css";

import { inProgressBooks, publishedBooks } from "@/SubmitData";

/** Minimal shape FeaturePanel expects */
type PanelBook = {
  id: string | number;
  title: string;
  author?: string;
  coverUrl?: string;
  likes?: number;
  rating?: number;
  bookmarks?: number;
  currentChapter?: number;
  totalChapters?: number;
  tags?: string[];
};

function toPanelBook(b: any): PanelBook {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    coverUrl: b.coverUrl,
    likes: b.likes ?? 0,
    rating: typeof b.rating === "string" ? parseFloat(b.rating) : (b.rating ?? 0),
    bookmarks: b.saves ?? 0,
    currentChapter: b.currentChapter ?? 0,
    totalChapters: b.numberOfChapters ?? (b.chapters?.length || 0),
    tags: [b.mainGenre, ...(b.subGenres || [])].filter(Boolean).slice(0, 6),
  };
}

/** Fit rail height so N tiles (2:3) + gaps fill width, up to a max height */
function useRailFit(booksCount: number) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [rowH, setRowH] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!railRef.current) return;

    const ratio = 2 / 3;                // book width = height * ratio
    const MIN_H = 160;                  // don’t go smaller than this
    const MAX_H_VH = 30;                // cap by viewport height (%)
    const MAX_H_ABS = 380;              // and by absolute pixels
    const ro = new ResizeObserver(compute);
    ro.observe(railRef.current);
    window.addEventListener("resize", compute);

    compute();

    function compute() {
      const el = railRef.current!;
      const railWidth = el.clientWidth;           // available width
      // Read the actual gap from CSS, fallback to 16
      const gapStr = getComputedStyle(el).getPropertyValue("--tile-gap").trim() || "16px";
      const gap = parseFloat(gapStr) || 16;

      // If no books, just use a pleasant default height
      if (!booksCount) {
        setRowH(220);
        return;
      }

      // Width taken by gaps between tiles
      const gapsWidth = Math.max(0, (booksCount - 1) * gap);

      // Width left for tiles
      const usable = Math.max(0, railWidth - gapsWidth);

      // If we want all N tiles to fit, each tile width = usable / N
      // Then tile height = tileWidth / ratio
      const targetHeightFromWidth = usable > 0 ? (usable / booksCount) / ratio : MIN_H;

      // Cap height by viewport + absolute max
      const capByVh = (Math.max(320, window.innerHeight) * MAX_H_VH) / 100;
      const HARD_MAX = Math.min(capByVh, MAX_H_ABS);

      // Choose height:
      // 1) try width-based height (fills the row)
      // 2) clamp to [MIN_H, HARD_MAX]
      const h = Math.max(MIN_H, Math.min(HARD_MAX, targetHeightFromWidth));

      setRowH(Math.round(h));
    }

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [booksCount]);

  return { railRef, rowH };
}

function BooksSection({
  title,
  books,
  onHoverBook,
  onLeaveAll,
  className = "",
}: {
  title: string;
  books: Array<PanelBook>;
  onHoverBook: (bk: PanelBook | null) => void;
  onLeaveAll: () => void;
  className?: string;
}) {
  const { railRef, rowH } = useRailFit(books.length);

  return (
    <section className={`submit-section ${className}`}>
        <div className="submit-head">
        <h2 className="submit-title">{title}</h2>
        <div className="submit-bars">
            <div className="bar bar-1" />
            <div className="bar bar-2" />
            <div className="bar bar-3" />
            <div className="bar bar-4" />
        </div>
        </div>


      <div
        className="books-rail"
        ref={railRef}
        onMouseLeave={onLeaveAll}
        style={
          rowH
            ? ({ ["--row-h" as any]: `${rowH}px` } as React.CSSProperties)
            : undefined
        }
        aria-label={`${title} books`}
      >
        <div className="books-track">
          {books.map((b) => (
            <button
              key={b.id}
              className="book-tile"
              aria-label={b.title}
              onMouseEnter={() => onHoverBook(b)}
              style={
                b.coverUrl
                  ? { backgroundImage: `url(${b.coverUrl})` }
                  : undefined
              }
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
  const pub = useMemo(() => publishedBooks.map(toPanelBook), []);

  return (
    <div className="submit-app">
      <AppHeader onClickWrite={() => {}} />

      <main className="submit-page">
        <div className="submit-grid">
          <div className="grid-left">
            <BooksSection
              title="In Progress"
              books={inProg}
              onHoverBook={(b) => setHovered(b)}
              onLeaveAll={() => setHovered(null)}
              className="inprogress"
            />
            <BooksSection
              title="Published"
              books={pub}
              onHoverBook={(b) => setHovered(b)}
              onLeaveAll={() => setHovered(null)}
              className="published"
            />
          </div>

          <aside className="feature-slot">
            <FeaturePanel book={hovered ?? undefined} />
          </aside>
        </div>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
