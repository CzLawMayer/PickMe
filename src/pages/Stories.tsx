import { useState, useMemo, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";

import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";
import { profile, userStoriesBooks } from "@/profileData";

import "./Library.css";

import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";

// tiny helper for the personal stars row on row 5
function UserRatingStars({ value }: { value: number }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        lineHeight: 1,
        fontSize: "16px",
        width: "100%",
        justifyContent: "flex-start",
        fontWeight: 600,
        minHeight: "16px",
        color: "inherit",
      }}
      aria-label={`Your rating: ${value || 0} out of 5`}
    >
      {stars.map((n) => {
        const filled = value >= n;
        return (
          <span
            key={n}
            className={filled ? "user-star star-filled" : "user-star star-empty"}
            style={{ fontSize: "16px", lineHeight: 1, display: "block" }}
            aria-hidden="true"
          >
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

export default function StoriesPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // full list of user's stories (exact 1:1 structure with userLibraryBooks)
  const books = userStoriesBooks();

  // =========================
  // FEATURE PANEL / SELECTION LOGIC (same as Library)
  // =========================
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<any | null>(null);

  const getBookById = (id: string | null) => {
    if (!id) return null;
    return books.find((b) => String(b.id) === String(id)) || null;
  };

  const previewBook = (book: any) => {
    setActiveBook(book);
  };

  const selectBook = (book: any) => {
    const idStr = String(book.id);
    setSelectedBookId(idStr);
    setActiveBook(book);
  };

  const clearHover = () => {
    const sel = getBookById(selectedBookId);
    setActiveBook(sel || null);
  };

  // genre pill color helper (same as Library)
  function colorFromString(seed: string) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) % 360;
    }
    const bg = `hsl(${h} 70% 50% / 0.16)`;
    const border = `hsl(${h} 70% 50% / 0.38)`;
    const text = `hsl(${h} 85% 92%)`;
    return { bg, border, text };
  }

  type SortKey = "recent" | "title" | "author" | "rating" | "likes" | "saves";

  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const sortBtnRef = useRef<HTMLButtonElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  const applySort = (k: SortKey) => {
    setSortKey(k);
    setSortOpen(false);
  };

  // keep stable original order as “recently added”
  const booksWithIndex = useMemo(
    () => books.map((b, i) => ({ ...b, __index: i })),
    [books]
  );

  const sortedBooks = useMemo(() => {
    const arr = [...booksWithIndex];

    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const str = (v: unknown) => (typeof v === "string" ? v : "");

    switch (sortKey) {
      case "title":
        arr.sort((a, b) => str(a.title).localeCompare(str(b.title)));
        break;
      case "author":
        arr.sort((a, b) => str(a.author).localeCompare(str(b.author)));
        break;
      case "rating":
        arr.sort((a, b) => num(b.rating) - num(a.rating));
        break;
      case "likes":
        arr.sort((a, b) => num(b.likes) - num(a.likes));
        break;
      case "saves":
        arr.sort((a, b) => num(b.bookmarks) - num(a.bookmarks));
        break;
      case "recent":
      default:
        arr.sort((a, b) => a.__index - b.__index);
    }
    return arr;
  }, [booksWithIndex, sortKey]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // close on outside click / Esc (for both search and sort)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        searchOpen &&
        !searchMenuRef.current?.contains(t) &&
        !searchBtnRef.current?.contains(t)
      ) {
        setSearchOpen(false);
      }
      if (
        sortOpen &&
        !sortMenuRef.current?.contains(t) &&
        !sortBtnRef.current?.contains(t)
      ) {
        setSortOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [searchOpen, sortOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  const displayedBooks = useMemo(() => {
    if (!searchQuery.trim()) return sortedBooks;
    const q = searchQuery.trim().toLowerCase();
    return sortedBooks.filter((b) => {
      const t = (b.title ?? "").toLowerCase();
      const a = (b.author ?? "").toLowerCase();
      return t.includes(q) || a.includes(q);
    });
  }, [sortedBooks, searchQuery]);

  // =========================
  // PER-BOOK LIKE / SAVE STATE (same as Library)
  // =========================
  type BookState = {
    liked: boolean;
    saved: boolean;
    likeCount: number;
    saveCount: number;
  };

  const initialStates = useMemo(() => {
    const obj: Record<string, BookState> = {};
    for (const b of books) {
      obj[b.id] = {
        liked: false,
        saved: false,
        likeCount: typeof b.likes === "number" ? b.likes : 0,
        saveCount: typeof b.bookmarks === "number" ? b.bookmarks : 0,
      };
    }
    return obj;
  }, [books]);

  const [bookStates, setBookStates] = useState<Record<string, BookState>>(
    initialStates
  );

  const toggleLike = (bookId: string | number) => {
    setBookStates((prev) => {
      const id = String(bookId);
      const st = prev[id];
      if (!st) return prev;
      const nextLiked = !st.liked;
      const nextLikeCount = nextLiked
        ? st.likeCount + 1
        : Math.max(0, st.likeCount - 1);

      return {
        ...prev,
        [id]: {
          ...st,
          liked: nextLiked,
          likeCount: nextLikeCount,
        },
      };
    });
  };

  const toggleSave = (bookId: string | number) => {
    setBookStates((prev) => {
      const id = String(bookId);
      const st = prev[id];
      if (!st) return prev;
      const nextSaved = !st.saved;
      const nextSaveCount = nextSaved
        ? st.saveCount + 1
        : Math.max(0, st.saveCount - 1);

      return {
        ...prev,
        [id]: {
          ...st,
          saved: nextSaved,
          saveCount: nextSaveCount,
        },
      };
    });
  };

  const activeState = activeBook
    ? bookStates[String(activeBook.id)]
    : undefined;

  return (
    <div className="library-app">
      {/* ===== HEADER (top banner + menu) ===== */}
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

      {/* ===== BODY LAYOUT ===== */}
      <main className="library-layout">
        {/* LEFT SIDE: hero + scroll area */}
        <div className="library-left">
          {/* --- Hero (identity + tabs + CTA/search/sort) --- */}
          <section className="lib-hero" aria-label="Library header">
            <div className="identity-cell" style={{ minWidth: 0 }}>
              <ProfileIdentity compact />
            </div>

            {/* Tab order exactly as you set everywhere */}
            <nav className="lib-tabs" aria-label="Library sections">
              <NavLink to="/library" className="lib-tab">
                Library
              </NavLink>
              <NavLink to="/stories" end className="lib-tab">
                Stories
              </NavLink>
              <NavLink to="/read" className="lib-tab">
                Read
              </NavLink>
              <NavLink to="/reviews" className="lib-tab">
                Reviews
              </NavLink>
            </nav>

            <div className="lib-hero-cta">
              {/* SEARCH ICON BUTTON */}
              <button
                type="button"
                ref={searchBtnRef}
                className="lib-cta lib-cta--icon lib-search-btn"
                aria-haspopup="dialog"
                aria-expanded={searchOpen}
                aria-label="Search stories"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  search
                </span>
              </button>

              {/* FILTER / SORT BUTTON */}
              <button
                type="button"
                ref={sortBtnRef}
                className="lib-cta lib-cta--icon lib-filter-btn"
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                aria-label="Sort stories"
                onClick={() => setSortOpen((v) => !v)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  filter_list
                </span>
              </button>

              {/* SEARCH MENU POPOVER */}
              {searchOpen && (
                <div className="lib-search-menu" ref={searchMenuRef}>
                  <div className="lib-search-field has-clear">
                    <input
                      ref={searchInputRef}
                      className="lib-search-input"
                      type="text"
                      placeholder="Search by title or author…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="lib-search-clear--inside"
                      aria-label="Clear search"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        close
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* SORT MENU POPOVER */}
              {sortOpen && (
                <div
                  ref={sortMenuRef}
                  className="lib-filter-menu"
                  role="menu"
                  aria-label="Sort stories"
                >
                  <button role="menuitem" className="lib-filter-item" onClick={() => applySort("recent")}>
                    Recently added
                  </button>
                  <button role="menuitem" className="lib-filter-item" onClick={() => applySort("title")}>
                    Title (A–Z)
                  </button>
                  <button role="menuitem" className="lib-filter-item" onClick={() => applySort("author")}>
                    Author (A–Z)
                  </button>
                  <button role="menuitem" className="lib-filter-item" onClick={() => applySort("rating")}>
                    Rating (high → low)
                  </button>
                  <button role="menuitem" className="lib-filter-item" onClick={() => applySort("likes")}>
                    Likes (high → low)
                  </button>
                  <button role="menuitem" className="lib-filter-item" onClick={() => applySort("saves")}>
                    Saves (high → low)
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* --- Scrollable grid (identical DOM) --- */}
          <section
            className="lib-scroll"
            aria-label="Your stories"
            onMouseLeave={clearHover}
          >
            <div className="lib-row">
              {displayedBooks.map((book) => {
                const st = bookStates[String(book.id)];
                const likeActive = st?.liked ?? false;
                const saveActive = st?.saved ?? false;
                const likeCount = st?.likeCount ?? 0;
                const saveCount = st?.saveCount ?? 0;

                const avgRatingNum = parseFloat(
                  typeof book.rating === "string"
                    ? book.rating
                    : (book.rating ?? "0").toString()
                );

                const coverIsSelected =
                  selectedBookId === String(book.id) ? " is-selected" : "";

                return (
                  <div key={book.id} className="lib-col">
                    <div
                      className="lib-card"
                      aria-label={`Story card for ${book.title}`}
                      onMouseEnter={() => previewBook(book)}
                      onFocus={() => previewBook(book)}
                      onClick={() => selectBook(book)}
                    >
                      {/* COVER */}
                      <div
                        className={`lib-cover${coverIsSelected}`}
                        aria-label={`${book.title} cover`}
                        onMouseEnter={() => previewBook(book)}
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
                              borderRadius: 0,
                            }}
                          />
                        ) : null}
                      </div>

                      {/* DETAILS */}
                      <div
                        className="lib-details"
                        aria-label="Story details"
                        onMouseEnter={() => previewBook(book)}
                        style={{
                          overflow: "visible",
                          height: "auto",
                          minHeight: "0",
                          display: "grid",
                          gridTemplateRows: "auto auto auto auto auto",
                        }}
                      >
                        {/* 1) title */}
                        <div
                          className="lib-line lib-title-line"
                          title={book.title}
                          style={{
                            fontSize: "clamp(16px,1.6vw,20px)",
                            fontWeight: 700,
                            lineHeight: 1.15,
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            overflowWrap: "break-word",
                          }}
                        >
                          {book.title || "—"}
                        </div>

                        {/* 2) year */}
                        <div
                          className="lib-line lib-year-line"
                          style={{
                            marginTop: "6px",
                            fontSize: "12px",
                            lineHeight: 1.2,
                          }}
                        >
                          {book.year ? book.year : "—"}
                        </div>

                        {/* 3) author */}
                        <div
                          className="lib-line lib-author-line"
                          title={book.author}
                          style={{
                            fontSize: "13px",
                            lineHeight: 1.3,
                            color: "rgba(255,255,255,0.7)",
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            overflowWrap: "break-word",
                          }}
                        >
                          {book.author || "—"}
                        </div>

                        {/* 4) actions */}
                        <div
                          className="lib-row lib-row-actions is-inline"
                          role="group"
                          aria-label="Likes, rating, saves"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            overflow: "hidden",
                            marginTop: "10px",
                            marginBottom: "4px",
                          }}
                          onMouseEnter={() => previewBook(book)}
                        >
                          <LikeButton
                            className={`meta-icon-btn like ${likeActive ? "is-active" : ""}`}
                            glyphClass="meta-icon-glyph"
                            countClass="meta-icon-count"
                            active={likeActive}
                            count={likeCount}
                            onToggle={() => toggleLike(book.id)}
                            aria-label={likeActive ? "Unlike" : "Like"}
                          />

                          <button
                            type="button"
                            className={`meta-icon-btn star ${
                              (book.userRating ?? 0) > 0 ? "is-active" : ""
                            }`}
                            aria-pressed={(book.userRating ?? 0) > 0}
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

                          <SaveButton
                            className={`meta-icon-btn save ${saveActive ? "is-active" : ""}`}
                            glyphClass="meta-icon-glyph"
                            countClass="meta-icon-count"
                            active={saveActive}
                            count={saveCount}
                            onToggle={() => toggleSave(book.id)}
                            aria-label={saveActive ? "Unsave" : "Save"}
                          />
                        </div>

                        {/* 5) user's own stars */}
                        <div
                          className="lib-line user-stars-row"
                          onMouseEnter={() => previewBook(book)}
                        >
                          <div className="user-rating-inline">
                            <span className="user-rating-avatar" aria-hidden="true">
                              <img
                                src={
                                  (profile as any)?.avatarUrl ||
                                  (profile as any)?.photo ||
                                  (profile as any)?.avatar ||
                                  ""
                                }
                                alt=""
                              />
                            </span>
                            <span
                              className="user-stars-wrap"
                              aria-label={`Your rating for ${book.title}`}
                            >
                              <UserRatingStars value={book.userRating ?? 0} />
                            </span>
                          </div>
                        </div>

                        {/* 6) first tag as genre pill */}
                        <div
                          className="lib-line lib-genre-row"
                          onMouseEnter={() => previewBook(book)}
                        >
                          {Array.isArray(book.tags) && book.tags.length > 0
                            ? (() => {
                                const tag = book.tags[0];
                                const c = colorFromString(tag);
                                return (
                                  <span
                                    className="genre-pill"
                                    title={tag}
                                    style={{
                                      backgroundColor: c.bg,
                                      borderColor: c.border,
                                      color: c.text,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                );
                              })()
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* filler cols for last row balance */}
              <div className="lib-col" />
              <div className="lib-col" />
              <div className="lib-col" />
            </div>
          </section>
        </div>

        {/* RIGHT SIDE: Feature panel */}
        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel
            book={activeBook || undefined}
            liked={activeState?.liked ?? false}
            saved={activeState?.saved ?? false}
            userRating={activeBook?.userRating ?? 0}
            onToggleLike={() => {
              if (activeBook) toggleLike(activeBook.id);
            }}
            onToggleSave={() => {
              if (activeBook) toggleSave(activeBook.id);
            }}
            onRate={(val) => {
              // future: update per-story userRating map here
              console.log("rate", activeBook?.id, val);
            }}
          />
        </aside>
      </main>

      {/* Side menu overlay panel */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
