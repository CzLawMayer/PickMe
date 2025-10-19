import { useState, useLayoutEffect, useRef, useState as useStateAlias } from "react";
import "./Profile.css";
import SideMenu from "@/components/SideMenu";
import LikeButton from "@/components/LikeButton";
import StarButton from "@/components/StarButton";
import SaveButton from "@/components/SaveButton";
import { Link } from "react-router-dom";

/* --- Tiny hook to auto-fit text to its line without reflowing layout --- */
function useFitText(minPx = 12, maxPx = 48) {
  const ref = useRef<HTMLElement | null>(null);
  const [size, setSize] = useStateAlias(maxPx);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const parent = el.parentElement;
      if (!parent) return;

      let lo = minPx;
      let hi = maxPx;

      // Binary search the largest size that fits on one line
      for (let i = 0; i < 18; i++) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = `${mid}px`;
        // one-line fit check
        const fitsWidth = el.scrollWidth <= el.clientWidth;
        const isOneLine = el.scrollHeight <= el.clientHeight || el.getClientRects().length <= 1;
        if (fitsWidth && isOneLine) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      const finalSize = Math.max(minPx, hi);
      el.style.fontSize = `${finalSize}px`;
      setSize(finalSize);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [minPx, maxPx]);

  return { ref, fontSize: size };
}

export default function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Local state for the metadata actions
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Rating combination with UI-friendly formatting
  const baseRating = 4.2;
  const priorVotes = 20;
  const combinedRatingRaw =
    userRating > 0
      ? (baseRating * priorVotes + userRating) / (priorVotes + 1)
      : baseRating;
  const combinedRating = Number(combinedRatingRaw.toFixed(1));

  // Fit text for name/handle (max sizes are sane defaults; tune as you like)
  const nameFit = useFitText(14, 42);
  const handleFit = useFitText(12, 28);

  /* =========================
     STORIES: dynamic slider
  ========================== */
  const storiesRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const [canScrollStories, setCanScrollStories] = useState(false); // show/hide pill
  const [storiesProgress, setStoriesProgress] = useState(0);       // 0..1
  const [thumbPct, setThumbPct] = useState(1);                     // 0..1
  const [storiesCount, setStoriesCount] = useState(0);             // number of covers

  // Recompute scrollability, thumb size, and progress
  const recomputeStories = () => {
    const vp = storiesRef.current;
    if (!vp) return;

    const count = vp.querySelectorAll(".stories-track .story-cover").length;
    setStoriesCount(count);

    const total = vp.scrollWidth;
    const visible = vp.clientWidth;
    const max = Math.max(0, total - visible);

    // pill appears only if there are >5 covers AND overflow exists
    const show = count > 5 && max > 0.5;
    setCanScrollStories(show);

    // thumb size exactly equals visible/total (proportional)
    setThumbPct(total > 0 ? visible / total : 1);

    // position 0..1
    setStoriesProgress(max ? vp.scrollLeft / max : 0);
  };

  // mount + resize + element size change
  useLayoutEffect(() => {
    recomputeStories();
    const onResize = () => recomputeStories();
    window.addEventListener("resize", onResize);

    const vp = storiesRef.current;
    let ro: ResizeObserver | undefined;
    if (vp) {
      ro = new ResizeObserver(recomputeStories);
      ro.observe(vp);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, []);

  // keep pill in sync with natural horizontal scrolling
  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;
    const onScroll = () => recomputeStories();
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, []);

  // Drag handling for the pill
  const onDragAt = (clientX: number) => {
    const vp = storiesRef.current;
    const bar = progressRef.current;
    if (!vp || !bar) return;

    const rect = bar.getBoundingClientRect();
    const t = thumbPct; // 0..1
    const x = clientX - rect.left;

    // usable track width once the thumb width is considered
    const usable = rect.width * (1 - t);
    const clamped = Math.max(0, Math.min(usable, x - (t * rect.width) / 2));
    const ratio = usable > 0 ? clamped / usable : 0;

    const max = vp.scrollWidth - vp.clientWidth;
    vp.scrollTo({ left: ratio * max });
  };

  const onPointerDownPill = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    progressRef.current?.setPointerCapture(e.pointerId);
    onDragAt(e.clientX);
  };
  const onPointerMovePill = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    onDragAt(e.clientX);
  };
  const onPointerUpPill = () => {
    draggingRef.current = false;
  };

  return (
    <div className="profile-app">
      {/* Top bar (same as Home) */}
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

      <main className="profile-page">
        {/* Global 3×3 grid: rows = [top | middle | bottom], cols = [L | C | R] */}
        <div className="profile-grid">

          {/* LEFT — Row 1: Identity */}
          <section className="cell identity-cell">
            <div className="profile-identity">
              <div className="profile-card">
                <div className="profile-avatar" aria-hidden={true}>
                  <svg width="96" height="96" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                    <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                    <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="profile-id" style={{ display: "grid", alignContent: "start" }}>
                  {/* These auto-fit to the available width/line via useFitText */}
                  <h2
                    className="profile-name"
                    ref={nameFit.ref as React.RefObject<HTMLHeadingElement>}
                    style={{
                      margin: "0 0 2px",
                      fontWeight: 800,
                      lineHeight: 1.05,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Diego Ballesteros
                  </h2>

                  <div
                    className="profile-handle"
                    ref={handleFit.ref as React.RefObject<HTMLDivElement>}
                    style={{
                      margin: "0 0 8px",
                      opacity: 0.8,
                      fontWeight: 600,
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    @NamesBrooklyn
                  </div>

                  {/* Color bars: left-aligned and exactly 75% of row width */}
                  <div
                    className="profile-bars"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      height: 8,
                      gap: 0,
                      width: "75%",
                      marginLeft: 0,
                      justifySelf: "start",
                    }}
                  >
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

            <div className="strip stories-strip">
              {/* Viewport that horizontally scrolls */}
              <div className="stories-viewport" ref={storiesRef} aria-label="Stories">
                <div className="stories-track">
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="story-cover" aria-label="Story placeholder" />
                  ))}
                </div>
              </div>

              {/* Custom pill slider — only if needed */}
              {canScrollStories && (
                <div
                  className="stories-progress"
                  ref={progressRef}
                  role="slider"
                  aria-label="Scroll stories"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(storiesProgress * 100)}
                  tabIndex={0}
                  onPointerDown={onPointerDownPill}
                  onPointerMove={onPointerMovePill}
                  onPointerUp={onPointerUpPill}
                  onPointerCancel={onPointerUpPill}
                  onKeyDown={(e) => {
                    const vp = storiesRef.current;
                    if (!vp) return;
                    const max = vp.scrollWidth - vp.clientWidth;
                    const step = vp.clientWidth * 0.1; // 10% step with arrows
                    if (e.key === "ArrowRight") vp.scrollTo({ left: Math.min(vp.scrollLeft + step, max) });
                    if (e.key === "ArrowLeft")  vp.scrollTo({ left: Math.max(vp.scrollLeft - step, 0) });
                  }}
                >
                  <div
                    className="stories-thumb"
                    style={{
                      width: `${thumbPct * 100}%`,
                      left: `${storiesProgress * (100 - thumbPct * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* LEFT — Row 3: Top 5 Favorites (title + black box fills the row) */}
          <section className="cell favorites-cell section">
            <h2 className="section-title">Top 5 Favorites</h2>
            <div className="strip favorites-strip">
              <div className="favorites-grid">
                <div className="fav-cover" aria-label="Favorite book placeholder" />
                <div className="fav-cover" aria-label="Favorite book placeholder" />
                <div className="fav-cover" aria-label="Favorite book placeholder" />
                <div className="fav-cover" aria-label="Favorite book placeholder" />
                <div className="fav-cover" aria-label="Favorite book placeholder" />
              </div>
            </div>
          </section>

          {/* CENTER — spans all 3 rows */}
          <section className="cell feature-cell">
            <div className="feature-card">
              <div className="feature-stack">
                <div className="feature-cover-placeholder" aria-label="Featured book cover placeholder" />
                <div className="feature-info">
                  <h3 className="feature-title">Everything To Get More and Balls</h3>

                  <hr className="meta-hr" />

                  <div className="feature-author">
                    <span className="meta-avatar--sm" aria-hidden={true}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                        <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                        <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="feature-author-name">Author Name</span>
                  </div>

                  <hr className="meta-hr" />

                  {/* Actions: pass class hooks so your CSS can center icon+count */}
                  <div className="meta-actions">
                    <LikeButton
                      className="meta-icon-btn like"
                      count={(liked ? 1 : 0) + 127}
                      active={liked}
                      onToggle={() => setLiked((v) => !v)}
                    />
                    <StarButton
                      className="meta-icon-btn star"
                      rating={combinedRating}
                      userRating={userRating}
                      active={userRating > 0}
                      onRate={(v: number) => setUserRating((prev) => (prev === v ? 0 : v))}
                    />
                    <SaveButton
                      className="meta-icon-btn save"
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
                    <ul className="meta-tags meta-tags--outline">
                      <li>Fantasy</li>
                      <li>Adventure</li>
                      <li>Mystery</li>
                      <li>Young Adult</li>
                      <li>Magic</li>
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
              {/* Row 1 */}
              <div className="shelf-row" role="row">
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
              </div>

              {/* Row 2 */}
              <div className="shelf-row" role="row">
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
              </div>

              {/* Row 3 */}
              <div className="shelf-row" role="row">
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
                <div className="book-spine" />
              </div>
            </div>
          </section>

          {/* RIGHT — Row 3: Currently Reading (title + black box fills the row) */}
          <section className="cell current-cell section">
            <h2 className="section-title">Currently Reading</h2>
            <div className="strip current-strip">
              <div className="current-grid">
                <div className="cur-cover" aria-label="Currently reading placeholder" />
                <div className="cur-cover" aria-label="Currently reading placeholder" />
                <div className="cur-cover" aria-label="Currently reading placeholder" />
                <div className="cur-cover" aria-label="Currently reading placeholder" />
                <div className="cur-cover" aria-label="Currently reading placeholder" />
              </div>
            </div>
          </section>
        </div>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}