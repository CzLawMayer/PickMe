import React from "react";

type StarButtonProps = {
  rating?: number | string;
  ratingCount?: number;
  hasUserReviewed?: boolean;
  active?: boolean;
  onOpenReviews?: () => void;

  /* ✅ new */
  variant?: "action" | "row";
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

function StarGlyph({ fillPct }: { fillPct: number }) {
  return (
    <span className="meta-rating-star" style={{ ["--fill" as any]: `${fillPct}%` }}>
      ★
    </span>
  );
}

export default function StarButton({
  rating,
  ratingCount,
  hasUserReviewed = false,
  active = false,
  onOpenReviews,
  variant = "action",
}: StarButtonProps) {
  const displayRating = clamp(coerceRating(rating), 0, 5);
  const isActive = active || hasUserReviewed;

  const open = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault?.();
    // @ts-ignore
    e.stopPropagation?.();
    onOpenReviews?.();
  };

  // ✅ New “row” variant: Rating: ★★★½☆ 4.5 (1284)
  if (variant === "row") {
    const stars = Array.from({ length: 5 }).map((_, i) => {
      const idx = i + 1;
      const fill =
        displayRating >= idx ? 100 : displayRating <= idx - 1 ? 0 : Math.round((displayRating - (idx - 1)) * 100);
      return <StarGlyph key={i} fillPct={fill} />;
    });

    return (
      <button
        type="button"
        className="meta-rating-rowbtn"
        aria-label="Open reviews"
        onClick={(e) => open(e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") open(e);
        }}
      >
        <span className="meta-rating-label">Rating:</span>
        <span className="meta-rating-stars" aria-hidden="true">
          {stars}
        </span>
        <span className="meta-rating-number">{displayRating.toFixed(1)}</span>
        {typeof ratingCount === "number" && (
          <span className="meta-rating-count">({ratingCount.toLocaleString()})</span>
        )}
      </button>
    );
  }

  // ✅ Existing “action” variant (kept)
  return (
    <button
      type="button"
      className={`meta-icon-btn star ${isActive ? "is-active" : ""}`}
      aria-pressed={isActive}
      aria-label="Open reviews"
      onClick={(e) => open(e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      }}
    >
      <span className="meta-icon-slot" aria-hidden="true">
        <span className="material-symbols-outlined meta-icon-glyph">star</span>
      </span>
      <span className="meta-icon-count">{displayRating.toFixed(1)}/5</span>
    </button>
  );
}