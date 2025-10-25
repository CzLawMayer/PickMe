// src/components/FeaturePanel.tsx
import React, { useLayoutEffect, useRef, useState } from "react";
import LikeButton from "@/components/LikeButton";
import StarButton from "@/components/StarButton";
import SaveButton from "@/components/SaveButton";

/** Minimal shape your pages can pass in. Extend as needed. */
export type Bookish = {
  id: string | number;
  title: string;
  author?: string;
  coverUrl?: string | null;
  likes?: number;
  rating?: number;          // average rating (0–5)
  bookmarks?: number;       // total saves
  currentChapter?: number;
  totalChapters?: number;
  tags?: string[];
};

/** Props to control the panel’s behavior and actions */
export interface FeaturePanelProps {
  /** The book to display. If null/undefined, shows empty state brand. */
  book?: Bookish | null;

  /** UI state toggles (from parent) */
  liked?: boolean;
  saved?: boolean;
  userRating?: number;      // the user’s own rating, 0–5

  /** Action callbacks (optional) */
  onToggleLike?: () => void;
  onToggleSave?: () => void;
  onRate?: (value: number) => void;

  /** Optional: custom empty-state brand (defaults to PickMe! with colored letters) */
  emptyBrand?: React.ReactNode;
}

/** Center feature panel used on Profile and other pages */
const FeaturePanel: React.FC<FeaturePanelProps> = ({
  book,
  liked = false,
  saved = false,
  userRating = 0,
  onToggleLike,
  onToggleSave,
  onRate,
  emptyBrand,
}) => {
  // Measure title lines to toggle the centering class (one-line vs two-line)
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [titleLines, setTitleLines] = useState(2);

  useLayoutEffect(() => {
    if (!book || !titleRef.current) return;
    const el = titleRef.current;
    const compute = () => {
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight || "1.1");
      const lines = Math.max(1, Math.round(el.scrollHeight / lh));
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
  }, [book?.title]);

  // Empty-state brand (fallback)
  const Brand = emptyBrand ?? (
    <h3 className="brand-mark">
      <span className="brand-p">P</span>ic<span className="brand-k">k</span>
      <span className="brand-m">M</span>e<span className="brand-bang">!</span>
    </h3>
  );

  return (
    <div className="feature-card">
      {book ? (
        <div className="feature-stack">
          {/* Cover */}
          {book.coverUrl ? (
            <div
              className="feature-cover-placeholder"
              aria-label={`${book.title} cover`}
              style={{
                backgroundImage: `url(${book.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : (
            <div
              className="feature-cover-placeholder"
              aria-label="Featured book cover placeholder"
              style={{ background: "#000" }}
            />
          )}

          {/* Info */}
          <div className="feature-info">
            {/* Title (clamped to 2 lines, centered if single line) */}
            <div className={`feature-title-wrap ${titleLines === 1 ? "one-line" : ""}`}>
              <h3 ref={titleRef} className="feature-title">
                {book.title}
              </h3>
            </div>

            <hr className="meta-hr" />

            {/* Author */}
            {(book.author ?? "").trim() !== "" && (
              <>
                <div className="feature-author">
                  <span className="meta-avatar--sm" aria-hidden={true}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                      <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                      <path
                        d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="feature-author-name">{book.author}</span>
                </div>

                <hr className="meta-hr" />
              </>
            )}

            {/* Actions */}
            <div className="meta-actions">
              <LikeButton
                className="meta-icon-btn like"
                count={book.likes ?? 0}
                active={liked}
                onToggle={onToggleLike}
              />
              <StarButton
                className="meta-icon-btn star"
                rating={Number(book.rating ?? 0)}
                userRating={userRating}
                active={userRating > 0}
                onRate={(v: number) => onRate?.(v)}
              />
              <SaveButton
                className="meta-icon-btn save"
                count={book.bookmarks ?? 0}
                active={saved}
                onToggle={onToggleSave}
              />
            </div>

            <hr className="meta-hr" />

            {/* Chapters */}
            {(Number.isFinite(book.currentChapter) || Number.isFinite(book.totalChapters)) && (
              <>
                <div className="align-left">
                  <p className="meta-chapters">
                    <span>
                      {(book.currentChapter ?? 0)} / {(book.totalChapters ?? 0)} Chapters
                    </span>
                  </p>
                </div>
                <hr className="meta-hr" />
              </>
            )}

            {/* Genres */}
            <div className="align-left">
              <div className="meta-tags-block">
                <ul className="meta-tags meta-tags--outline">
                  {(book.tags ?? []).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // EMPTY (uses same stack width so layout remains identical)
        <div className="feature-stack">
          <div className="feature-empty-inline" aria-label="No book selected">
            {Brand}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturePanel;
