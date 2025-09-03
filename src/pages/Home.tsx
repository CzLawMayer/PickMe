import { useRef, useState } from "react"
import "./Home.css"
import { sampleBooks } from "../booksData"

// Reusable icon buttons (you said these files already exist)
import LikeButton from "@/components/LikeButton"
import StarButton from "@/components/StarButton"
import SaveButton from "@/components/SaveButton"

type Book = {
  id: string
  title: string
  author?: string
  user?: string
  coverUrl?: string
  tags?: string[]
  rating?: string | number
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

  // arrows (top = next, bottom = prev)
  const next = () => setCurrent((c) => (c + 1) % count)
  const prev = () => setCurrent((c) => (c - 1 + count) % count)

  // keyboard support
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case "ArrowRight":
      case "d":
      case "D":
      case "PageDown":
        e.preventDefault()
        next()
        break
      case "ArrowLeft":
      case "a":
      case "A":
      case "PageUp":
        e.preventDefault()
        prev()
        break
      case "Home":
        e.preventDefault()
        if (count) setCurrent(0)
        break
      case "End":
        e.preventDefault()
        if (count) setCurrent(count - 1)
        break
      case " ":
        e.preventDefault()
        e.shiftKey ? prev() : next()
        break
    }
  }

  // drag/swipe support
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragActiveRef = useRef(false)
  const dragStartXRef = useRef(0)

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    dragActiveRef.current = true
    setIsDragging(true)
    dragStartXRef.current = e.clientX
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragActiveRef.current) return
    const dx = e.clientX - dragStartXRef.current
    setDragX(dx)
  }
  function endDrag() {
    if (!dragActiveRef.current) return
    dragActiveRef.current = false
    const dx = dragX
    setIsDragging(false)
    setDragX(0)
    const THRESH = 60
    if (Math.abs(dx) > THRESH) {
      dx < 0 ? next() : prev()
    }
  }

  // helpers for metadata display
  const ratingText =
    center?.rating != null && center?.rating !== ""
      ? `${center?.rating}/5`
      : "—"

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
          <div className="icon" aria-label="menu">☰</div>
        </div>
      </header>

      {/* Stage */}
      <main
        className="carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Book carousel"
        tabIndex={0}
        onKeyDownCapture={handleKeyDown}
      >
        {/* Metadata (fixed, left of center) */}
        <div className="metadata">
          {/* Avatar + username */}
          <div className="meta-header">
            <div className="meta-avatar" aria-hidden>
              {/* Inline outlined person-in-circle to match mock */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="meta-username">{center?.user ?? "Unknown User"}</p>
          </div>

          <hr className="meta-hr" />

          {/* Actions: Like / Star / Save (big outlined icons with counts) */}
          <div className="meta-actions">
            <LikeButton
              count={center?.likes ?? 0}
              active={false}
              onToggle={() => {/* hook up later */}}
            />
            <StarButton
              ratingText={ratingText}
              active={false}
              onToggle={() => {/* hook up later */}}
            />
            <SaveButton
              count={center?.bookmarks ?? 0}
              active={false}
              onToggle={() => {/* hook up later */}}
            />
          </div>

          <hr className="meta-hr" />

          {/* Chapters */}
          <p className="meta-chapters">
            {(center?.currentChapter ?? 0)}/{center?.totalChapters ?? 0} Chapters
          </p>

          <hr className="meta-hr" />

          {/* Tags stacked */}
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
              return (
                <div key={b.id} className={cls} aria-hidden={cls !== "book main-book"}>
                  <div
                    className="book-placeholder"
                    style={{ background: bg }}
                    role="img"
                    aria-label={`${b.title} by ${b.author ?? "Unknown"}`}
                  >
                    {!b.coverUrl ? b.title : null}
                  </div>
                </div>
              )
            })
          })()}
        </div>

        {/* Arrows (top = next, bottom = prev) */}
        <div className="vertical-arrows">
          <button
            type="button"
            className="arrow"
            aria-label="Next book"
            aria-keyshortcuts="ArrowRight Space"
            title="Next"
            onClick={next}
          >
            ›
          </button>
          <button
            type="button"
            className="arrow"
            aria-label="Previous book"
            aria-keyshortcuts="ArrowLeft Shift+Space"
            title="Previous"
            onClick={prev}
          >
            ‹
          </button>
        </div>
      </main>
    </div>
  )
}
