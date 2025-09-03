import React from "react"

type IconStatProps = {
  icon: "favorite" | "star" | "bookmark"
  label: string
  count?: number | string
  active?: boolean
  onToggle?: () => void
  className?: string
  sizePx?: number // visual icon size
}

export default function IconStat({
  icon,
  label,
  count,
  active = false,
  onToggle,
  className,
  sizePx = 64,
}: IconStatProps) {
  // For accessibility we announce pressed state for toggle buttons
  return (
    <button
      type="button"
      className={`meta-icon-btn ${active ? "is-active" : ""} ${className ?? ""}`}
      aria-label={label}
      aria-pressed={active}
      onClick={onToggle}
    >
      <span
        className="material-symbols-outlined meta-icon-glyph"
        style={{
          // keep the glyph nice & crisp at display size
          // (we pass the size from CSS variables too)
          fontSize: sizePx,
          // baseline handled in CSS
        }}
      >
        {icon}
      </span>
      {typeof count !== "undefined" && (
        <span className="meta-icon-count">{count}</span>
      )}
    </button>
  )
}
