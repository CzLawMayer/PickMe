import React from "react"

type LikeButtonProps = {
  count?: number
  active?: boolean
  onToggle?: () => void
}

export default function LikeButton({
  count = 0,
  active = false,
  onToggle,
}: LikeButtonProps) {
  return (
    <button
      type="button"
      className={`meta-icon-btn like ${active ? "is-active" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span className="material-symbols-outlined meta-icon-glyph">
        favorite
      </span>
      <span className="meta-icon-count">{count}</span>
    </button>
  )
}
