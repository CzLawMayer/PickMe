import React from "react";

type StarButtonProps = {
  rating?: number | string;
  hasUserReviewed?: boolean;
  active?: boolean;
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
  const isActive = active || hasUserReviewed;

  return (
    <button
      type="button"
      className={`meta-icon-btn star ${isActive ? "is-active" : ""}`}
      aria-pressed={isActive}
      aria-label="Open reviews"
      onClick={(e) => {
        e.stopPropagation();
        onOpenReviews?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onOpenReviews?.();
        }
      }}
    >
      <span className="meta-icon-slot" aria-hidden="true">
        <span className="material-symbols-outlined meta-icon-glyph">star</span>
      </span>
      <span className="meta-icon-count">{displayRating.toFixed(1)}/5</span>
    </button>
  );
}
