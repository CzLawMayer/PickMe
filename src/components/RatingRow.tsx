import React from "react";

type RatingRowProps = {
  rating?: number | string;
  ratingCount?: number;
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function RatingRow({ rating, ratingCount, onOpenReviews }: RatingRowProps) {
  const r = clamp(coerceRating(rating), 0, 5);

  const stars = Array.from({ length: 5 }).map((_, i) => {
    const idx = i + 1;
    const fill =
      r >= idx ? 100 : r <= idx - 1 ? 0 : Math.round((r - (idx - 1)) * 100);

    return (
      <span key={i} className="meta-rating-star" style={{ ["--fill" as any]: `${fill}%` }}>
        ★
      </span>
    );
  });

  return (
    <button
      type="button"
      className="meta-rating-rowbtn"
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
      <span className="meta-rating-label">Rating:</span>
      <span className="meta-rating-stars" aria-hidden="true">
        {stars}
      </span>

      <span className="meta-rating-number">{r.toFixed(1)}/5</span>

      {typeof ratingCount === "number" && (
        <span className="meta-rating-count">({ratingCount.toLocaleString()})</span>
      )}
    </button>
  );
}