import { useRef, useState, useCallback, useEffect } from "react"
import "./Home.css"
import { sampleBooks } from "../booksData"

import LikeButton from "@/components/LikeButton"
import StarButton from "@/components/StarButton"
import SaveButton from "@/components/SaveButton"

import SideMenu from "@/components/SideMenu"

type Book = {
  id: string
  title: string
  author?: string
  user?: string
  coverUrl?: string
  tags?: string[]
  rating?: string | number
  ratingCount?: number
  likes?: number
  bookmarks?: number
  currentChapter?: number
  totalChapters?: number
}

export default function Home() {
  const [books] = useState<Book[]>(sampleBooks)
  const [current, setCurrent] = useState(0)

  const count = books.length
  const center = count ? books[current] : null
  const mod = (x: number) => (count ? (x % count + count) % count : 0)

  // ─────────────────────────────────────────────────────────────
  // Per-book memory maps
  // ─────────────────────────────────────────────────────────────
  const [likedById, setLikedById] = useState<Record<string, boolean>>({})
  const [savedById, setSavedById] = useState<Record<string, boolean>>({})
  const [starredById, setStarredById] = useState<Record<string, boolean>>({})
  const [userRatingById, setUserRatingById] = useState<Record<string, number>>({})
  const [menuOpen, setMenuOpen] = useState(false)

  const centerId = center?.id ?? ""

  const liked = !!likedById[centerId]
  const saved = !!savedById[centerId]
  const starred = !!starredById[centerId]
  const userRating = userRatingById[centerId] ?? 0

  const displayLikes = (center?.likes ?? 0) + (liked ? 1 : 0)
  const displaySaves = (center?.bookmarks ?? 0) + (saved ? 1 : 0)

  const baseRating =
    typeof center?.rating === "string"
      ? parseFloat(String(center?.rating).split("/")[0])
      : Number(center?.rating ?? 0)

  const votes = Number((center as any)?.ratingCount ?? 0)
  const PRIOR_VOTES = 20

  let combinedRating = baseRating
  if (userRating > 0) {
    if (votes > 0) {
      combinedRating = (baseRating * votes + userRating) / (votes + 1)
    } else if (baseRating > 0) {
      combinedRating = (baseRating * PRIOR_VOTES + userRating) / (PRIOR_VOTES + 1)
    } else {
      combinedRating = userRating
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────
  const next = useCallback(() => {
    if (!count) return
    setCurrent(c => (c + 1) % count)
  }, [count])

  const prev = useCallback(() => {
    if (!count) return
    setCurrent(c => (c - 1 + count) % count)
  }, [count])

  // Global keyboard handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
        case "PageDown":
          e.preventDefault()
          e.stopPropagation()
          next()
          break
        case "ArrowLeft":
        case "a":
        case "A":
        case "PageUp":
          e.preventDefault()
          e.stopPropagation()
          prev()
          break
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault()
          e.stopPropagation()
          break
        case "Home":
          e.preventDefault()
          e.stopPropagation()
          if (count) setCurrent(0)
          break
        case "End":
          e.preventDefault()
          e.stopPropagation()
          if (count) setCurrent(count - 1)
          break
        case " ":
          e.preventDefault()
          e.stopPropagation()
          e.shiftKey ? prev() : next()
          break
        default:
          break
      }
    }
    window.addEventListener("keydown", onKey, { passive: false })
    return () => window.removeEventListener("keydown", onKey)
  }, [count, next, prev])

  // ─────────────────────────────────────────────────────────────
  // Drag / swipe
  // ─────────────────────────────────────────────────────────────
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragActiveRef = useRef(false)
  const dragStartXRef = useRef(0)
  const wasDraggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)


  

  const DRAG_START_THRESH = 6
  const SWIPE_NAV_THRESH  = 60

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // DO NOT capture yet — we only capture once it's truly a drag
    dragActiveRef.current = true
    dragStartXRef.current = e.clientX
    pointerIdRef.current = e.pointerId
    setIsDragging(false)
    setDragX(0)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragActiveRef.current) return
    const dx = e.clientX - dragStartXRef.current
    setDragX(dx)

    if (!isDragging && Math.abs(dx) > DRAG_START_THRESH) {
      // NOW it's a drag → capture so we own the rest of the gesture
      const pid = pointerIdRef.current
      if (pid != null) {
        (e.currentTarget as HTMLDivElement).setPointerCapture(pid)
      }
      setIsDragging(true)
    }
  }

  function endDrag() {
    if (!dragActiveRef.current) return
    dragActiveRef.current = false

    const dx = dragX
    const didSwipe = Math.abs(dx) > SWIPE_NAV_THRESH

    setIsDragging(false)
    setDragX(0)
    pointerIdRef.current = null  // clear pointer id

    if (didSwipe) {
      dx < 0 ? next() : prev()
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Flip: center book front/back
  // ─────────────────────────────────────────────────────────────
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    // reset flip whenever the current index changes
    setIsFlipped(false)
  }, [current])

  const onFlipClick = (e: React.MouseEvent | React.PointerEvent) => {
    // NEW: if this interaction turned into a drag, ignore the click
    if (wasDraggingRef.current) return

    e.stopPropagation()
    setIsFlipped(f => !f)
  }

  // ─────────────────────────────────────────────────────────────
  // Interaction handlers
  // ─────────────────────────────────────────────────────────────
  const toggleLike = useCallback(() => {
    if (!centerId) return
    setLikedById(m => ({ ...m, [centerId]: !m[centerId] }))
  }, [centerId])

  const toggleSave = useCallback(() => {
    if (!centerId) return
    setSavedById(m => ({ ...m, [centerId]: !m[centerId] }))
  }, [centerId])

  const onRate = useCallback((val: number) => {
    if (!centerId) return
    setStarredById(m => ({ ...m, [centerId]: val > 0 }))
    setUserRatingById(m => ({ ...m, [centerId]: val }))
  }, [centerId])

  return (
    <div className="app">
      {/* Top bar */}
      <header className="header">
        <h1 className="logo">
          Pick<span>M</span>e!
        </h1>
        <div className="header-icons">
          <div className="icon" aria-label="write">✏️</div>
          <div className="icon" aria-label="search">🔍</div>
          <button
            type="button"
            className="icon icon-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-haspopup="dialog"
            aria-controls="side-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? "X" : "☰"}
          </button>
        </div>
      </header>

      {/* Stage */}
      <main
        className="carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Book carousel"
      >
        {/* Metadata (fixed, left of center) */}
        <div className="metadata">
          <div className="meta-header">
            <div className="meta-avatar" aria-hidden>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="meta-username" title={center?.user ?? ""}>
              {center?.user ?? "Unknown User"}
            </p>
          </div>

          <hr className="meta-hr" />

          {/* Actions */}
          <div className="meta-actions">
            <LikeButton
              count={displayLikes}
              active={liked}
              onToggle={toggleLike}
            />
            <StarButton
              rating={combinedRating}
              userRating={userRating}
              active={userRating > 0}
              onRate={onRate}
            />
            <SaveButton
              count={displaySaves}
              active={saved}
              onToggle={toggleSave}
            />
          </div>

          <hr className="meta-hr" />

          <p className="meta-chapters">
            {(center?.currentChapter ?? 0)}/{center?.totalChapters ?? 0} Chapters
          </p>

          <hr className="meta-hr" />

          <ul className="meta-tags">
            {(center?.tags ?? []).map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>

        {/* Drag layer + cards */}
        <div
          className={`drag-layer${isDragging ? " dragging" : ""}`}
          style={{ transform: `translateX(${dragX}px)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          {count > 0 && (() => {
            const order = [
              { cls: "book left-off-1",  idx: mod(current - 2) },
              { cls: "book left-book",   idx: mod(current - 1) },
              { cls: "book main-book",   idx: mod(current + 0) },
              { cls: "book right-book",  idx: mod(current + 1) },
              { cls: "book right-off-1", idx: mod(current + 2) },
            ]
            return order.map(({ cls, idx }) => {
              const b = books[idx]
              const bg = b.coverUrl ? `url("${b.coverUrl}") center/cover no-repeat` : undefined
              const isCenter = idx === current
              return (
                <div key={b.id} className={cls} aria-hidden={cls !== "book main-book"}>
                  {/* 3D flip wrapper: only clickable on the center book */}
                  <div
                    className={`book-inner${isCenter && isFlipped ? " is-flipped" : ""}`}
                    onClick={isCenter ? onFlipClick : undefined}
                    role={isCenter ? "button" : undefined}
                    aria-pressed={isCenter ? isFlipped : undefined}
                    tabIndex={-1}
                  >
                    {/* FRONT */}
                    <div className="book-face book-front">
                      <div
                        className="book-placeholder"
                        style={{ background: bg }}
                        role="img"
                        aria-label={`${b.title} by ${b.author ?? "Unknown"}`}
                      >
                        {!b.coverUrl ? b.title : null}
                      </div>
                    </div>

                    {/* BACK (empty placeholder for now) */}
                    <div className="book-face book-back">
                      <div
                        className="book-placeholder back"
                        role="img"
                        aria-label={`${b.title} — back cover`}
                      >
                        {/* back cover img from backend later */}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          })()}
        </div>

        {/* Arrows */}
        <div className="vertical-arrows">
          <button
            type="button"
            className="arrow"
            aria-label="Next book"
            aria-keyshortcuts="ArrowRight Space"
            title="Next"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              next()
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
          >
            ›
          </button>
          <button
            type="button"
            className="arrow"
            aria-label="Previous book"
            aria-keyshortcuts="ArrowLeft Shift+Space"
            title="Previous"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              prev()
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
          >
            ‹
          </button>
        </div>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}