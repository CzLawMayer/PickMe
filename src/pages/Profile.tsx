import { useState, useLayoutEffect, useRef, useState as useStateAlias } from "react";
import "./Profile.css";
import SideMenu from "@/components/SideMenu";
import LikeButton from "@/components/LikeButton";
import StarButton from "@/components/StarButton";
import SaveButton from "@/components/SaveButton";
import { Link } from "react-router-dom";
import ReadingHeatmap from "@/components/ReadingHeatmap";
import { profile, storyBooks, favoriteBooks, libraryBooks } from "@/profileData";
import { flushSync } from "react-dom";
import { useMemo } from "react";

import AppHeader from "@/components/AppHeader";
import ProfileBoard from "@/components/ProfileBoard";

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

      for (let i = 0; i < 18; i++) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = `${mid}px`;
        const fitsWidth = el.scrollWidth <= el.clientWidth;
        const isOneLine = el.scrollHeight <= el.clientHeight || el.getClientRects().length <= 1;
        if (fitsWidth && isOneLine) lo = mid + 1;
        else hi = mid - 1;
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

  // Fit text for name/handle
  const nameFit = useFitText(14, 42);
  const handleFit = useFitText(12, 28);

  /* =========================
     STORIES: dynamic slider
  ========================== */
  const storiesRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const [canScrollStories, setCanScrollStories] = useState(false);
  const [storiesProgress, setStoriesProgress] = useState(0);
  const [thumbPct, setThumbPct] = useState(1);

  const [activeBook, setActiveBook] = useState<any>(null);

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [titleLines, setTitleLines] = useState(2);

  type SelectionSource = "stories" | "favorites" | "library" | null;
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SelectionSource>(null);

  const getBookById = (id?: string | null) => {
    if (!id) return null;
    const sid = String(id);
    return (
      storyBooks().find((b) => String(b.id) === sid) ??
      favoriteBooks().find((b) => String(b.id) === sid) ??
      libraryBooks().find((b) => String(b.id) === sid) ??
      null
    );
  };

  // HOVER = preview in center (does NOT change selection)
  const previewBook = (book: any) => setActiveBook(book);

  // CLICK = select + stick in center
  const selectBook = (book: any, source: Exclude<SelectionSource, null>) => {
    setSelectedBookId(String(book.id));
    setSelectedSource(source);
    setActiveBook(book);
  };

  // On leaving a strip/shelf, restore the last selection
  const clearHover = () => {
    const selected = getBookById(selectedBookId);
    setActiveBook(selected ?? null);
  };

  // measure on book/title change and resize
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const compute = () => {
      const cs = getComputedStyle(el);
      const lineHeight = parseFloat(cs.lineHeight);
      const lines = Math.max(1, Math.round(el.scrollHeight / lineHeight));
      setTitleLines(Math.min(lines, 2));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [activeBook?.title]);

  const recomputeStories = () => {
    const vp = storiesRef.current;
    if (!vp) return;

    const count = vp.querySelectorAll(".stories-track .story-cover").length;

    const total = vp.scrollWidth;
    const visible = vp.clientWidth;
    const max = Math.max(0, total - visible);

    const show = count > 5 && max > 0.5;
    setCanScrollStories(show);

    setThumbPct(total > 0 ? visible / total : 1);
    setStoriesProgress(max ? vp.scrollLeft / max : 0);
  };

  const allStoryBooks = storyBooks();
  const allFavBooks = favoriteBooks();
  const allLibBooks = libraryBooks();
  const allBooks = [...allStoryBooks, ...allFavBooks, ...allLibBooks];

  const stats = useMemo(() => {
    const explicit = profile?.stats ?? {};

    const derivedBooksCompleted =
      allBooks.filter((b: any) => {
        const doneFlag = b.status === "completed" || b.completed === true;
        const byChapters =
          Number.isFinite(b?.currentChapter) &&
          Number.isFinite(b?.totalChapters) &&
          b.totalChapters > 0 &&
          b.currentChapter >= b.totalChapters;
        return doneFlag || byChapters;
      }).length || 0;

    const derivedChaptersRead = allBooks.reduce((sum: number, b: any) => {
      const read = Number.isFinite(b?.chaptersRead)
        ? b.chaptersRead
        : Number.isFinite(b?.currentChapter)
        ? b.currentChapter
        : 0;
      return sum + (read as number);
    }, 0);

    const derivedBooksSaved =
      allBooks.filter((b: any) => b?.saved === true || b?.isSaved === true || (b?.bookmarksByUser ?? 0) > 0)
        .length || 0;

    return {
      booksCompleted:
        Number.isFinite((explicit as any).booksCompleted) ? (explicit as any).booksCompleted : derivedBooksCompleted,
      chaptersRead:
        Number.isFinite((explicit as any).chaptersRead) ? (explicit as any).chaptersRead : derivedChaptersRead,
      booksSaved:
        Number.isFinite((explicit as any).booksSaved) ? (explicit as any).booksSaved : derivedBooksSaved,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.stats, allBooks.length]);

  // Wheel-to-horizontal for Stories viewport
  useLayoutEffect(() => {
    const el = storiesRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const hasOverflowX = el.scrollWidth > el.clientWidth;
      if (!hasOverflowX) return;

      const verticalDominates = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      if (verticalDominates) {
        e.preventDefault();
        const speed = e.shiftKey ? 2 : 1;
        el.scrollLeft += e.deltaY * speed;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as EventListener);
  }, []);

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

  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;
    const onScroll = () => recomputeStories();
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(recomputeStories);
    return () => cancelAnimationFrame(id);
  }, [profile.stories.length]);

  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;

    const imgs = Array.from(vp.querySelectorAll<HTMLElement>(".story-cover"));
    if (imgs.length === 0) return;

    let pending = imgs.length;
    const onDone = () => {
      pending -= 1;
      if (pending === 0) recomputeStories();
    };

    const unload: HTMLImageElement[] = [];
    imgs.forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.startsWith("url(") ? bg.match(/^url\(["']?(.*?)["']?\)$/) : null;
      const src = m?.[1];
      if (!src) return;
      const img = new Image();
      img.onload = onDone;
      img.onerror = onDone;
      img.src = src;
      unload.push(img);
    });

    if (unload.length === 0) recomputeStories();
    return () => {};
  }, [profile.stories]);

  const onDragAt = (clientX: number) => {
    const vp = storiesRef.current;
    const bar = progressRef.current;
    if (!vp || !bar) return;

    const rect = bar.getBoundingClientRect();
    const t = thumbPct;
    const x = clientX - rect.left;

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
      {/* FIXED HEADER SHELL (cannot shrink) */}
      <div className="profile-headerShell">
        <AppHeader
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((o) => !o)}
          onClickWrite={() => {}}
          onClickSearch={() => {}}
        />
      </div>

      {/* MAIN AREA (fills rest, cannot grow) */}
      <main className="profile-page">
        <div className="profile-grid">
          {/* LEFT — Row 1: Identity */}
          <section className="cell identity-cell">
            <div className="profile-identity">
              <div className="profile-card">
                <div className="profile-avatar" aria-hidden={true}>
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                        display: "block",
                      }}
                    />
                  ) : (
                    <svg width="96" height="96" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                      <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                      <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                <div className="profile-id" style={{ display: "grid", alignContent: "start" }}>
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
                    {profile.name}
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
                    @{profile.username}
                  </div>

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

          {/* LEFT — Row 2: Stories */}
          <section className="cell stories-cell section">
            <h2 className="section-title">Stories</h2>

            <div className="strip stories-strip" onMouseLeave={clearHover}>
              <div className="stories-viewport" ref={storiesRef} aria-label="Stories">
                <div className="stories-track">
                  {storyBooks().map((book) => (
                    <div
                      key={book.id}
                      className={"story-cover" + (selectedSource === "stories" && selectedBookId === String(book.id) ? " is-selected" : "")}
                      title={book.title}
                      aria-label={`Story: ${book.title}`}
                      tabIndex={0}
                      onMouseEnter={() => previewBook(book)}
                      onPointerDown={() => flushSync(() => selectBook(book, "stories"))}
                      onClick={() => selectBook(book, "stories")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectBook(book, "stories");
                        }
                      }}
                      style={{
                        backgroundImage: book.coverUrl ? `url(${book.coverUrl})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#1b1b1b",
                      }}
                    />
                  ))}
                </div>
              </div>

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
                    const step = vp.clientWidth * 0.1;
                    if (e.key === "ArrowRight") vp.scrollTo({ left: Math.min(vp.scrollLeft + step, max) });
                    if (e.key === "ArrowLeft") vp.scrollTo({ left: Math.max(vp.scrollLeft - step, 0) });
                  }}
                >
                  <div
                    className="stories-thumb"
                    style={{ width: `${thumbPct * 100}%`, left: `${storiesProgress * (100 - thumbPct * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* LEFT — Row 3: Favorites */}
          <section className="cell favorites-cell section">
            <h2 className="section-title">Favorites</h2>
            <div className="strip favorites-strip" onMouseLeave={clearHover}>
              <div className="favorites-grid">
                {favoriteBooks().slice(0, 5).map((book) => (
                  <div
                    key={book.id}
                    className={"fav-cover" + (selectedSource === "favorites" && selectedBookId === String(book.id) ? " is-selected" : "")}
                    title={book.title}
                    aria-label={`Favorite: ${book.title}`}
                    tabIndex={0}
                    onMouseEnter={() => previewBook(book)}
                    onPointerDown={() => flushSync(() => selectBook(book, "stories"))}
                    onClick={() => selectBook(book, "favorites")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectBook(book, "favorites");
                      }
                    }}
                    style={{
                      backgroundImage: book.coverUrl ? `url(${book.coverUrl})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: "#1b1b1b",
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* CENTER — spans all 3 rows */}
          <section className="cell feature-cell">
            <div className="feature-card">
              {activeBook ? (
                <div className="feature-stack">
                  {activeBook.coverUrl ? (
                    <div className="feature-cover-row">
                      <Link
                        to={`/?book=${encodeURIComponent(String(activeBook.id ?? ""))}`}
                        className="feature-cover-link"
                        aria-label={`Open "${activeBook.title}" on Home`}
                        title={`Open "${activeBook.title}" on Home`}
                      >
                        <div
                          className="feature-cover-placeholder"
                          aria-label={`${activeBook.title} cover`}
                          style={{
                            backgroundImage: `url(${activeBook.coverUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      </Link>

                      <Link
                        to={`/?book=${encodeURIComponent(String(activeBook.id ?? ""))}`}
                        className="feature-jump"
                        aria-label={`Go to "${activeBook.title}" on Home`}
                        title={`Go to "${activeBook.title}" on Home`}
                      >
                        ››
                      </Link>
                    </div>
                  ) : (
                    <div className="feature-cover-placeholder" aria-label="Featured book cover placeholder" />
                  )}

                  <div className="feature-info">
                    <div className={`feature-title-wrap ${titleLines === 1 ? "one-line" : ""}`}>
                      <h3 ref={titleRef} className="feature-title">
                        {activeBook.title}
                      </h3>
                    </div>

                    <hr className="meta-hr" />

                    <div className="feature-author">
                      <span className="meta-avatar--sm" aria-hidden={true}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                          <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                          <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="feature-author-name">{activeBook.author}</span>
                    </div>

                    <hr className="meta-hr" />

                    <div className="meta-actions">
                      <LikeButton className="meta-icon-btn like" count={activeBook.likes ?? 0} active={liked} onToggle={() => setLiked((v) => !v)} />
                      <StarButton
                        className="meta-icon-btn star"
                        rating={Number(activeBook.rating ?? 0)}
                        userRating={userRating}
                        active={userRating > 0}
                        onRate={(v: number) => setUserRating((prev) => (prev === v ? 0 : v))}
                      />
                      <SaveButton className="meta-icon-btn save" count={activeBook.bookmarks ?? 0} active={saved} onToggle={() => setSaved((v) => !v)} />
                    </div>

                    <hr className="meta-hr" />

                    <div className="align-left">
                      <p className="meta-chapters">
                        <span>
                          {(activeBook.currentChapter ?? 0)} / {(activeBook.totalChapters ?? 0)} Chapters
                        </span>
                      </p>
                    </div>

                    <hr className="meta-hr" />

                    <div className="align-left">
                      <div className="meta-tags-block">
                        <ul className="meta-tags meta-tags--outline">
                          {(activeBook?.tags ?? []).map((t: string) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="feature-stack">
                  <div className="feature-empty-inline" aria-label="No book selected">
                    <h3 className="brand-mark">
                      <span className="brand-p">P</span>ic<span className="brand-k">k</span>
                      <span className="brand-m">M</span>e<span className="brand-bang">!</span>
                    </h3>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT — Rows 1–2: ProfileBoard */}
          <section className="cell library-cell section">
            <ProfileBoard
              selectedBookId={selectedBookId}
              onPreviewBook={(book) => previewBook(book)}
              onSelectBook={(book) => selectBook(book, "library")}
              onClearHover={clearHover}
              initialTab="Library"
            />
          </section>

          {/* RIGHT — Row 3: Activity */}
          <section className="cell current-cell section">
            <h2 className="section-title">Activity</h2>
            <div className="strip current-strip">
              <div className="current-grid">
                <ReadingHeatmap year={new Date().getFullYear()} />
              </div>

              <div className="current-stats" role="group" aria-label="Reading stats">
                <div className="current-stat">
                  <div className="stat-label">Books completed</div>
                  <div className="stat-value">{stats.booksCompleted}</div>
                </div>
                <div className="current-stat">
                  <div className="stat-label">Chapters read</div>
                  <div className="stat-value">{stats.chaptersRead}</div>
                </div>
                <div className="current-stat">
                  <div className="stat-label">Books saved</div>
                  <div className="stat-value">{stats.booksSaved}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
