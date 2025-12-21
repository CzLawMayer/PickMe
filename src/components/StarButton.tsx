import React from "react";

type StarButtonProps = {
  rating?: number | string;

  // this should be TRUE when the CURRENT USER has a review for the current book
  hasUserReviewed?: boolean;

  // optional extra active flag if you already use it elsewhere
  active?: boolean;

  // Home should implement this:
  // - open the book (if not open)
  // - open the sidebar (if closed)
  // - set sidebar tab to "reviews"
  onOpenReviews?: () => void;
};

function coerceRating(value: number | string | undefined | null): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const num = parseFloat(value.split("/")[0].trim());
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

export default function StarButton({
  rating,
  hasUserReviewed = false,
  active = false,
  onOpenReviews,
}: StarButtonProps) {
  const displayRating = coerceRating(rating);

  // Filled only if user has reviewed (or active explicitly passed)
  const isActive = active || hasUserReviewed;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenReviews?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onOpenReviews?.();
    }
  };

  return (
    <button
      type="button"
      className={`meta-icon-btn star ${isActive ? "is-active" : ""}`}
      aria-pressed={isActive}
      aria-label="Open reviews"
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <span className="material-symbols-outlined meta-icon-glyph">star</span>
      <span className="meta-icon-count">{displayRating.toFixed(1)}/5</span>
    </button>
  );
}
