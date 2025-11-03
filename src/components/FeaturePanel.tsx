// src/components/FeaturePanel.tsx
import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";

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
  rating?: number | string;
  bookmarks?: number;
  currentChapter?: number;
  totalChapters?: number;
  tags?: string[];
  userRating?: number;
};

export interface FeaturePanelProps {
  book?: Bookish | null;
  liked?: boolean;
  saved?: boolean;
  userRating?: number;
  onToggleLike?: () => void;
  onToggleSave?: () => void;
  onRate?: (value: number) => void;
  emptyBrand?: React.ReactNode;
}

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
  // ===== Title line measurement (unchanged) =====
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

  // ===== NEW: gradient rotation with readable overlay =====
  // Base colors you gave:
  const C1 = "#fc5f2e";
  const C2 = "#d81b60";
  const C3 = "#6a1b9a";
  const C4 = "#1e88e5";

  // Four tasteful, minimal gradients using those colors
  const gradientPalette = [
    `linear-gradient(135deg, ${C1} 0%, ${C2} 70%)`,
    `linear-gradient(135deg, ${C2} 0%, ${C3} 70%)`,
    `linear-gradient(135deg, ${C3} 0%, ${C4} 70%)`,
    `linear-gradient(135deg, ${C4} 0%, ${C1} 90%)`,
  ] as const;

  // We place a subtle dark overlay *above* the gradient for readability
  const overlay = `linear-gradient(0deg, rgba(0,0,0,0.42), rgba(0,0,0,0.42))`;

  const gradIdxRef = useRef(0);
  const prevBookIdRef = useRef<string | number | null>(null);
  const [panelBgImage, setPanelBgImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!book) return; // idle → keep default black (no gradient)
    const currId = book.id;
    if (currId !== prevBookIdRef.current) {
      const nextGrad = gradientPalette[gradIdxRef.current];
      // Multiple backgrounds: overlay first, gradient second
      setPanelBgImage(`${overlay}, ${nextGrad}`);
      gradIdxRef.current = (gradIdxRef.current + 1) % gradientPalette.length;
      prevBookIdRef.current = currId;
    }
  }, [book]);

  // ===== Empty-state brand (unchanged) =====
  const Brand =
    emptyBrand ?? (
      <h3 className="brand-mark">
        <span className="brand-p">P</span>ic<span className="brand-k">k</span>
        <span className="brand-m">M</span>e<span className="brand-bang">!</span>
      </h3>
    );

  // Normalize average rating input to number
  const avgRatingNum = book
    ? parseFloat(
        typeof book.rating === "string"
          ? book.rating
          : (book.rating ?? "0").toString()
      )
    : 0;

  if (!book) {
    // EMPTY (PickMe!) — stays black (no backgroundImage set)
    return (
      <div
        className="feature-card"
        style={{
          // keep a nice subtle transition for when the first book appears
          transition: "background-image 220ms ease, background 220ms ease",
        }}
      >
        <div className="feature-stack">
          <div className="feature-empty-inline" aria-label="No book selected">
            {Brand}
          </div>
        </div>
      </div>
    );
  }

  // We DO have a book: apply the rotating gradient (with overlay)
  return (
    <div
      className="feature-card"
      style={{
        backgroundColor: "#000", // fallback
        backgroundImage: panelBgImage,
        transition: "background-image 220ms ease, background 220ms ease",
        // small inner border for definition on bright gradients
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div className="feature-stack">
        {/* Cover row with link + jump arrow (unchanged) */}
        {book.coverUrl ? (
          <div className="feature-cover-row">
            <Link
              to={`/?book=${encodeURIComponent(String(book.id ?? ""))}`}
              className="feature-cover-link"
              aria-label={`Open "${book.title}" on Home`}
              title={`Open "${book.title}" on Home`}
            >
              <div
                className="feature-cover-placeholder"
                aria-label={`${book.title} cover`}
                style={{
                  backgroundImage: `url(${book.coverUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </Link>
            <Link
              to={`/?book=${encodeURIComponent(String(book.id ?? ""))}`}
              className="feature-jump"
              aria-label={`Go to "${book.title}" on Home`}
              title={`Go to "${book.title}" on Home`}
            >
              ‹‹
            </Link>
          </div>
        ) : (
          <div
            className="feature-cover-placeholder"
            aria-label="Featured book cover placeholder"
            style={{ background: "#000" }}
          />
        )}

        {/* Info block */}
        <div className="feature-info">
          <div className={`feature-title-wrap ${titleLines === 1 ? "one-line" : ""}`}>
            <h3 ref={titleRef} className="feature-title">
              {book.title}
            </h3>
          </div>

          <hr className="meta-hr" />

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

          <div className="meta-actions">
            <LikeButton
              className="meta-icon-btn like"
              active={Boolean(liked)}
              count={book.likes ?? 0}
              onToggle={onToggleLike}
            />
            <StarButton
              className="meta-icon-btn star"
              rating={Number.isFinite(avgRatingNum) ? avgRatingNum : 0}
              userRating={userRating}
              active={userRating > 0}
              onRate={(v: number) => onRate?.(v)}
            />
            <SaveButton
              className="meta-icon-btn save"
              active={Boolean(saved)}
              count={book.bookmarks ?? 0}
              onToggle={onToggleSave}
            />
          </div>

          <hr className="meta-hr" />

          {(Number.isFinite(book.currentChapter) ||
            Number.isFinite(book.totalChapters)) && (
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
    </div>
  );
};

export default FeaturePanel;
