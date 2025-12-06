// src/pages/Submit.tsx
import { useMemo, useState } from "react";

import AppHeader from "@/components/AppHeader";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";
import SubmissionModal, { type SubmitFormData } from "@/components/SubmissionModal";

import { inProgressBooks, publishedBooks } from "@/SubmitData";

import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import SubmitFeaturePanel from "@/components/SubmitFeaturePanel";


import "./Library.css";
import "./Submit.css";

/* --- basic book shape matching what Library cards expect --- */
type LibBook = {
  id: string | number;
  title: string;
  author?: string;
  year?: string | number;
  coverUrl?: string | null;
  likes?: number;
  bookmarks?: number;
  rating?: number | string;
  userRating?: number;
  tags?: string[];
};

type Status = "inProgress" | "published";

type BookWithStatus = LibBook & { status: Status };

function toLibBook(b: any): LibBook {
  return {
    id: b.id,
    title: b.title ?? "",
    author: b.author ?? "",
    year: b.year ?? "",
    coverUrl: b.coverUrl ?? null,
    likes: typeof b.likes === "number" ? b.likes : 0,
    bookmarks:
      typeof b.bookmarks === "number"
        ? b.bookmarks
        : typeof b.saves === "number"
        ? b.saves
        : 0,
    rating:
      typeof b.rating === "string" || typeof b.rating === "number"
        ? b.rating
        : 0,
    userRating: typeof b.userRating === "number" ? b.userRating : 0,
    tags: Array.isArray(b.tags)
      ? b.tags
      : Array.isArray(b.subGenres)
      ? b.subGenres
      : [],
  };
}

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

export default function SubmitPage() {
  // merge both lists but tag them with status so we can filter by tab
  const allBooks = useMemo<BookWithStatus[]>(
    () => [
      ...inProgressBooks.map((b: any) => ({
        ...toLibBook(b),
        status: "inProgress" as const,
      })),
      ...publishedBooks.map((b: any) => ({
        ...toLibBook(b),
        status: "published" as const,
      })),
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<Status>("inProgress");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<BookWithStatus | null>(null);

  const visibleBooks = useMemo(
    () => allBooks.filter((b) => b.status === activeTab),
    [allBooks, activeTab]
  );

  const getBookById = (id: string | null) => {
    if (!id) return null;
    return allBooks.find((b) => String(b.id) === String(id)) || null;
  };

  const previewBook = (book: BookWithStatus) => setActiveBook(book);

  const selectBook = (book: BookWithStatus) => {
    const idStr = String(book.id);
    setSelectedBookId(idStr);
    setActiveBook(book);
  };

  const clearHover = () => {
    const sel = getBookById(selectedBookId);
    setActiveBook(sel || null);
  };

  // per-book like/save local state
  type BookState = {
    liked: boolean;
    saved: boolean;
    likeCount: number;
    saveCount: number;
  };

  const initialStates = useMemo(() => {
    const obj: Record<string, BookState> = {};
    for (const b of allBooks) {
      obj[b.id] = {
        liked: false,
        saved: false,
        likeCount: typeof b.likes === "number" ? b.likes : 0,
        saveCount: typeof b.bookmarks === "number" ? b.bookmarks : 0,
      };
    }
    return obj;
  }, [allBooks]);

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
        [id]: { ...st, liked: nextLiked, likeCount: nextLikeCount },
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
        [id]: { ...st, saved: nextSaved, saveCount: nextSaveCount },
      };
    });
  };

  const activeState = activeBook ? bookStates[String(activeBook.id)] : undefined;

  // submission modal
  const [showModal, setShowModal] = useState(false);
  const openSubmission = () => setShowModal(true);
  const closeSubmission = () => setShowModal(false);

  const handleSave = (data: SubmitFormData) => {
    // TODO: push into inProgress list when you wire up persistence
    console.log("Submit form saved:", data);
    closeSubmission();
  };

  return (
    <div className="library-app">
      {/* same header as Library */}
      <AppHeader onClickWrite={() => {}} onClickSearch={() => {}} />

      <main className="library-layout">
        {/* LEFT: hero + scroll, same structure as Library */}
        <div className="library-left">
          <section className="lib-hero" aria-label="Submit header">
            <div className="identity-cell" style={{ minWidth: 0 }}>
              <ProfileIdentity compact />
            </div>

            {/* center tabs: In progress / Published */}
            <nav className="lib-tabs" aria-label="Submission sections">
              <button
                type="button"
                className={
                  "lib-tab" + (activeTab === "inProgress" ? " is-active" : "")
                }
                onClick={() => setActiveTab("inProgress")}
              >
                In progress
              </button>
              <button
                type="button"
                className={
                  "lib-tab" + (activeTab === "published" ? " is-active" : "")
                }
                onClick={() => setActiveTab("published")}
              >
                Published
              </button>
            </nav>

            {/* right CTA: keep your Add book button */}
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

          {/* grid of covers, visually identical to Library cards */}
          <section
            className="lib-scroll"
            aria-label={
              activeTab === "inProgress"
                ? "In progress books"
                : "Published books"
            }
            onMouseLeave={clearHover}
          >
            <div className="lib-row">
              {visibleBooks.map((book) => {
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
                      aria-label={`Book card for ${book.title}`}
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
                        aria-label="Book details"
                        onMouseEnter={() => previewBook(book)}
                        style={{
                          overflow: "visible",
                          height: "auto",
                          minHeight: "0",
                          display: "grid",
                          gridTemplateRows: "auto auto auto auto auto",
                        }}
                      >
                        {/* Row 1: title */}
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

                        {/* Row 2: year */}
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

                        {/* Row 3: author */}
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

                        {/* Row 4: like / avg rating / save */}
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
                            className={`meta-icon-btn like ${
                              likeActive ? "is-active" : ""
                            }`}
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
                            className={`meta-icon-btn save ${
                              saveActive ? "is-active" : ""
                            }`}
                            glyphClass="meta-icon-glyph"
                            countClass="meta-icon-count"
                            active={saveActive}
                            count={saveCount}
                            onToggle={() => toggleSave(book.id)}
                            aria-label={saveActive ? "Unsave" : "Save"}
                          />
                        </div>

                        {/* Row 5: first genre tag */}
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

              {/* plus card to create a new project – only in In progress tab */}
              {activeTab === "inProgress" && (
                <div className="lib-col">
                  <button
                    type="button"
                    className="lib-card lib-card-add"
                    onClick={openSubmission}
                    aria-label="Add a new project"
                  >
                    <div className="lib-cover lib-cover-add" aria-hidden="true">
                      <span className="lib-cover-add-plus">+</span>
                    </div>
                  </button>
                </div>
              )}

              {/* filler cols to keep last row balanced visually */}
              <div className="lib-col" />
              <div className="lib-col" />
            </div>
          </section>
        </div>

        {/* RIGHT: Feature panel, exactly like Library */}
        {/* RIGHT: Submit-style feature panel (Write page right menu look) */}
        <aside className="library-feature" aria-label="Project details">
          <SubmitFeaturePanel book={activeBook || undefined} />
        </aside>

      </main>

      {/* Submission modal – opened by hero button and plus card */}
      <SubmissionModal open={showModal} onClose={closeSubmission} onSave={handleSave} />
    </div>
  );
}
