import React, { useEffect, useRef, useState } from "react"

type StarButtonProps = {
  /** Aggregated rating to display (e.g., combinedRating from Home.tsx) */
  rating?: number | string
  /** User’s own rating (1..5). Used for color + popover default, NOT for display text */
  userRating?: number
  /** Optional active style (usually derived from !!userRating) */
  active?: boolean
  /** Called when the user picks 1..5 */
  onRate?: (value: number) => void
}

function coerceRating(value: number | string | undefined | null): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const num = parseFloat(value.split("/")[0].trim())
    return Number.isFinite(num) ? num : 0
  }
  return 0
}

export default function StarButton({
  rating,
  userRating,
  active = false,
  onRate,
}: StarButtonProps) {
  const [open, setOpen] = useState(false)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)

  // ALWAYS display the aggregated rating passed in via `rating`
  const displayRating = coerceRating(rating)

  // Close on outside click / ESC
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
      setHoverValue(null)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        setHoverValue(null)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  // Keyboard support for the popover
  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (["ArrowLeft", "ArrowRight", "Enter", " "].includes(e.key)) e.preventDefault()

    if (e.key === "ArrowRight") {
      setHoverValue(v => {
        const base = v ?? (userRating ?? 0)
        return Math.min(5, Math.max(1, base + 1))
      })
    } else if (e.key === "ArrowLeft") {
      setHoverValue(v => {
        const base = v ?? (userRating ?? 0)
        return Math.min(5, Math.max(1, base - 1))
      })
    } else if (e.key === "Enter" || e.key === " ") {
      const val = hoverValue ?? userRating ?? 5
      onRate?.(val)
      setOpen(false)
      setHoverValue(null)
    }
  }

  const isActive = active || (userRating ?? 0) > 0

  return (
    <button
      type="button"
      ref={btnRef}
      className={`meta-icon-btn star ${isActive ? "is-active" : ""}`}
      aria-pressed={isActive}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(o => !o)}
      onKeyDown={onKeyDown}
    >
      {/* Main star icon */}
      <span className="material-symbols-outlined meta-icon-glyph">star</span>
      {/* Display the aggregated rating only */}
      <span className="meta-icon-count">{displayRating.toFixed(1)}/5</span>

      {/* Popover with 5 selectable stars */}
      {open && (
        <div ref={popRef} className="star-popover" role="dialog" aria-label="Rate this book">
          <div
            className="star-row"
            role="radiogroup"
            aria-label="Set rating from 1 to 5 stars"
            onMouseLeave={() => setHoverValue(null)}  // reset only when leaving the row
            >
            {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverValue ?? userRating ?? 0) >= n
                return (
                <button
                    key={n}
                    type="button"
                    className="star-item"
                    role="radio"
                    aria-checked={(userRating ?? 0) === n}
                    onMouseEnter={() => setHoverValue(n)}
                    onClick={(e) => {
                    e.stopPropagation()
                    onRate?.(n)
                    setOpen(false)
                    setHoverValue(null)
                    }}
                >
                    <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: 28,
                        ["--ms-fill" as any]: filled ? 1 : 0,
                        color: filled ? "#f2ac15" : "inherit",
                    }}
                    >
                    star
                    </span>
                </button>
                )
            })}
            </div>



          <div className="star-hint">
            {hoverValue ? `${hoverValue}/5` : (userRating ? `${userRating}/5` : "Choose rating")}
          </div>
        </div>
      )}
    </button>
  )
}
