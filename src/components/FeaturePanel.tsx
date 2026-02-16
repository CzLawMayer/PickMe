// src/components/FeaturePanel.tsx
import React, { useLayoutEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import LikeButton from "@/components/LikeButton";
import StarButton from "@/components/StarButton";
import SaveButton from "@/components/SaveButton";
import CommentButton from "@/components/CommentButton";

import "./FeaturePanel.css";


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

  // NEW: author avatar + author profile link (so it matches Profile page)
  authorAvatarUrl?: string;
  authorProfileTo?: string; // default "/profile"

  // NEW: comment/review affordances (so it matches Profile page)
  hasUserCommented?: boolean;
  hasUserReviewed?: boolean;
  onOpenComments?: () => void;
  onOpenReviews?: () => void;

  onToggleLike?: () => void;
  onToggleSave?: () => void;
  onRate?: (value: number) => void;

  emptyBrand?: React.ReactNode;
}

/**
 * “Library spine” palette (deeper/brighter bookish tones)
 * IMPORTANT: excludes the 4 brand colors:
 *   #fc5f2e, #d81b60, #6a1b9a, #1e88e5
 */
const BRAND_COLORS = new Set(["#fc5f2e", "#d81b60", "#6a1b9a", "#1e88e5"]);
const LIBRARY_SPINE_COLORS_RAW = [
  "#b11226",
  "#c0182a",
  "#8e0f1f",
  "#a4162a",
  "#7b0b1a",
  "#c8372d",
  "#9b1c31",
  "#6f0a18",

  "#4b136e",
  "#5a177f",
  "#3a0f5c",
  "#2f0b4a",

  "#0b2a5b",
  "#143a7a",
  "#1c4a9b",
  "#0a1f3f",
  "#2a3f75",

  "#b84b1f",
  "#a53a18",
  "#7a2a14",

  "#2a2a2e",
  "#1f1f23",
  "#3a2a2a",
] as const;

const LIBRARY_SPINE_COLORS = LIBRARY_SPINE_COLORS_RAW
  .map((c) => c.toLowerCase())
  .filter((c) => !BRAND_COLORS.has(c));

function hashToIndex(input: string, modulo: number) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, modulo);
}

const FeaturePanel: React.FC<FeaturePanelProps> = ({
  book,

  liked = false,
  saved = false,
  userRating = 0,

  authorAvatarUrl = "",
  authorProfileTo = "/profile",

  hasUserCommented = false,
  hasUserReviewed = false,
  onOpenComments,
  onOpenReviews,

  onToggleLike,
  onToggleSave,
  onRate,

  emptyBrand,
}) => {
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

  // Panel background: deterministic “library spine” color
  const panelBgColor = useMemo(() => {
    if (!book) return "#000";
    const idx = hashToIndex(String(book.id), LIBRARY_SPINE_COLORS.length);
    return LIBRARY_SPINE_COLORS[idx] ?? "#000";
  }, [book]);

  const Brand =
    emptyBrand ?? (
      <h3 className="brand-mark">
        <span className="brand-p">P</span>ic<span className="brand-k">k</span>
        <span className="brand-m">M</span>e<span className="brand-bang">!</span>
      </h3>
    );

  const avgRatingNum = book
    ? parseFloat(typeof book.rating === "string" ? book.rating : (book.rating ?? "0").toString())
    : 0;

  if (!book) {
    return (
      <div className="feature-card" style={{ backgroundColor: "#000" }}>
        <div className="feature-stack">
          <div className="feature-empty-inline" aria-label="No book selected">
            {Brand}
          </div>
        </div>
      </div>
    );
  }

  const bookIdParam = encodeURIComponent(String(book.id ?? ""));

  return (
    <div
      className="feature-card"
      style={{
        backgroundColor: panelBgColor,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
      }}
    >
      <div className="feature-stack">
        {/* Keep arrow LEFT (already working in your app) */}
        {book.coverUrl ? (
          <div className="feature-cover-row">
            <Link
              to={`/?book=${bookIdParam}`}
              className="feature-jump feature-jump--left"
              aria-label={`Go to "${book.title}" on Home`}
              title={`Go to "${book.title}" on Home`}
            >
              ‹‹
            </Link>

            <Link
              to={`/?book=${bookIdParam}`}
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
          </div>
        ) : (
          <div className="feature-cover-row">
            <Link
              to={`/?book=${bookIdParam}`}
              className="feature-jump feature-jump--left"
              aria-label={`Go to "${book.title}" on Home`}
              title={`Go to "${book.title}" on Home`}
            >
              ‹‹
            </Link>

            <div className="feature-cover-placeholder" aria-label="Featured book cover placeholder" style={{ background: "#000" }} />
          </div>
        )}

        <div className="feature-info">
          <div className={`feature-title-wrap ${titleLines === 1 ? "one-line" : ""}`}>
            <h3 ref={titleRef} className="feature-title">
              {book.title}
            </h3>
          </div>

          <hr className="meta-hr" />

          {/* AUTHOR ROW — profile picture like Profile page */}
          <div className="feature-author">
            <Link
              to={authorProfileTo}
              className="meta-avatar-link"
              aria-label="Open profile"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="meta-avatar--sm" aria-hidden={true}>
                {authorAvatarUrl ? (
                  <img src={authorAvatarUrl} alt="" />
                ) : (
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
                )}
              </span>
            </Link>

            <Link
              to={authorProfileTo}
              className="meta-username"
              title={book.author ?? ""}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="feature-author-name">{book.author}</span>
            </Link>
          </div>

          <hr className="meta-hr" />

          {/* META ACTIONS — 4 buttons (Like / Comment / Star / Save) like Profile page */}
          <div className="meta-actions">
            <LikeButton
              className="meta-icon-btn like"
              active={Boolean(liked)}
              count={book.likes ?? 0}
              onToggle={onToggleLike}
            />

            <CommentButton active={hasUserCommented} onOpenComments={() => onOpenComments?.()} />

            <StarButton
              className="meta-icon-btn star"
              rating={Number.isFinite(avgRatingNum) ? avgRatingNum : 0}
              userRating={userRating}
              active={userRating > 0}
              hasUserReviewed={hasUserReviewed}
              onOpenReviews={() => onOpenReviews?.()}
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
