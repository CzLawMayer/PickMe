import { useState, useLayoutEffect, useRef, useState as useStateAlias } from "react";
import "./Profile.css";
import SideMenu from "@/components/SideMenu";
import LikeButton from "@/components/LikeButton";
import StarButton from "@/components/StarButton";
import SaveButton from "@/components/SaveButton";

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


  const storiesRef = useRef<HTMLDivElement | null>(null);
  const [storiesPos, setStoriesPos] = useState(0); // 0..100


  // ratio of visible area to total scrollable (0..1). If >=1, no slider.
  const [storiesRatio, setStoriesRatio] = useState(1);


  const progressRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const [canScrollStories, setCanScrollStories] = useState(false); // show/hide pill
  const [storiesProgress, setStoriesProgress] = useState(0);       // 0..1
  const [thumbPct, setThumbPct] = useState(0.5);                   // visible/total (0..1)

  // compute scrollability, thumb size, and progress
  const recomputeStories = () => {
    const vp = storiesRef.current;
    if (!vp) return;
    const total = vp.scrollWidth;
    const visible = vp.clientWidth;
    const max = Math.max(0, total - visible);
    setCanScrollStories(max > 1);               // show only if content wider than viewport
    setThumbPct(Math.max(0.08, Math.min(1, visible / total))); // min 8% for usability
    setStoriesProgress(max ? vp.scrollLeft / max : 0);
  };

  // mount + resize listeners
  useLayoutEffect(() => {
    recomputeStories();
    const onResize = () => recomputeStories();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // keep pill synced when user scrolls naturally
  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;
    const onScroll = () => recomputeStories();
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, []);


  // Update ratio on mount + resize + whenever the viewport size changes
  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;

    const compute = () => {
      const ratio = vp.scrollWidth > 0 ? vp.clientWidth / vp.scrollWidth : 1;
      setStoriesRatio(Math.min(1, Math.max(0, ratio)));
    };

    compute();

    // Track element size changes precisely
    const ro = new ResizeObserver(compute);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  // Drag handling for the pill
  const draggingRef = useRef(false);
  const onDragAt = (clientX: number) => {
    const vp = storiesRef.current;
    const track = document.querySelector(".stories-pill") as HTMLDivElement | null;
    if (!vp || !track) return;

    const rect = track.getBoundingClientRect();
    const ratio = storiesRatio;                            // viewport / total
    const relative = (clientX - rect.left) / rect.width;  // 0..1 across track
    // Left edge of the thumb moves from 0..(1 - ratio)
    const newEdge = Math.min(1 - ratio, Math.max(0, relative - ratio / 2));
    const pos = (newEdge / Math.max(1e-6, 1 - ratio)) * 100; // 0..100 scroll %
    setStoriesPos(pos);

    const max = vp.scrollWidth - vp.clientWidth;
    vp.scrollTo({ left: (pos / 100) * max, behavior: "smooth" });
  };
  const onMouseDownPill = (e: React.MouseEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    onDragAt(e.clientX);
    const onMove = (ev: MouseEvent) => draggingRef.current && onDragAt(ev.clientX);
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  };
  const onTouchStartPill = (e: React.TouchEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    onDragAt(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) =>
      draggingRef.current && onDragAt(ev.touches[0].clientX);
    const onEnd = () => {
      draggingRef.current = false;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { once: true });
    window.addEventListener("touchcancel", onEnd, { once: true });
  };


  // Keep slider synced when user scrolls with mouse/trackpad
  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;
    const onScroll = () => {
      const max = vp.scrollWidth - vp.clientWidth;
      const ratio = max > 0 ? vp.scrollLeft / max : 0;
      setStoriesPos(Math.round(ratio * 100));
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, []);

  // Keep position aligned on resize
  useLayoutEffect(() => {
    const onResize = () => {
      const vp = storiesRef.current;
      if (!vp) return;
      const max = vp.scrollWidth - vp.clientWidth;
      const left = (storiesPos / 100) * max;
      vp.scrollTo({ left });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [storiesPos]);

  // On mount, align to current storiesPos
  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;
    const max = vp.scrollWidth - vp.clientWidth;
    vp.scrollLeft = (storiesPos / 100) * max;
  }, []);


  return (
    <div className="profile-app">
      {/* Top bar (same as Home) */}
      <header className="header">
        <h1 className="logo">
          Pick<span>M</span>e!
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
                    ggggggjjjjjjjjllloomwww
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
                    @username
                  </div>

                  {/* Color bars: right-aligned and exactly 75% of row width */}
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
                  {/* 10 placeholders */}
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                  <div className="story-cover" aria-label="Story placeholder" />
                </div>
              </div>

              {/* Bottom slider control (pages of 5) */}
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
                  onPointerDown={(e) => {
                    progressRef.current?.setPointerCapture(e.pointerId);
                    isDraggingRef.current = true;
                    const bar = progressRef.current!;
                    const vp = storiesRef.current!;
                    const rect = bar.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const ratio = Math.max(0, Math.min(1, (x - (thumbPct * rect.width) / 2) / (rect.width - thumbPct * rect.width)));
                    const max = vp.scrollWidth - vp.clientWidth;
                    vp.scrollTo({ left: ratio * max});
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingRef.current) return;
                    const bar = progressRef.current!;
                    const vp = storiesRef.current!;
                    const rect = bar.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const ratio = Math.max(0, Math.min(1, (x - (thumbPct * rect.width) / 2) / (rect.width - thumbPct * rect.width)));
                    const max = vp.scrollWidth - vp.clientWidth;
                    vp.scrollTo({ left: ratio * max });
                  }}
                  onPointerUp={() => { isDraggingRef.current = false; }}
                  onPointerCancel={() => { isDraggingRef.current = false; }}
                  onKeyDown={(e) => {
                    const vp = storiesRef.current;
                    if (!vp) return;
                    const max = vp.scrollWidth - vp.clientWidth;
                    const step = vp.clientWidth * 0.1; // 10% step with arrows
                    if (e.key === "ArrowRight") vp.scrollTo({ left: Math.min(vp.scrollLeft + step, max)});
                    if (e.key === "ArrowLeft")  vp.scrollTo({ left: Math.max(vp.scrollLeft - step, 0)});
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
              <div className="shelf-row" role="row" />
              <div className="shelf-row" role="row" />
              <div className="shelf-row" role="row" />
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
