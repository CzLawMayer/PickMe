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
  backCoverUrl?: string 
  tags?: string[]
  rating?: string | number
  ratingCount?: number
  likes?: number
  bookmarks?: number
  currentChapter?: number
  totalChapters?: number
}

type BookView = "front" | "back" | "open"

export default function Home() {
  const [books] = useState<Book[]>(sampleBooks)
  const [current, setCurrent] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const [view, setView] = useState<BookView>("front")

  const count = books.length
  const center = count ? books[current] : null
  const mod = (x: number) => (count ? (x % count + count) % count : 0)

  useEffect(() => { setView("front") }, [current])

  // per-book memory
  const [likedById, setLikedById] = useState<Record<string, boolean>>({})
  const [savedById, setSavedById] = useState<Record<string, boolean>>({})
  const [starredById, setStarredById] = useState<Record<string, boolean>>({})
  const [userRatingById, setUserRatingById] = useState<Record<string, number>>({})
  const centerId = center?.id ?? ""
  const liked = !!likedById[centerId]
  const saved = !!savedById[centerId]
  const userRating = userRatingById[centerId] ?? 0

  const displayLikes = (center?.likes ?? 0) + (liked ? 1 : 0)
  const displaySaves = (center?.bookmarks ?? 0) + (saved ? 1 : 0)

  const baseRating =
    typeof center?.rating === "string"
      ? parseFloat(String(center?.rating).split("/")[0])
      : Number(center?.rating ?? 0)

  const votesRaw = center?.ratingCount ?? 0
  const votes = Number.isFinite(Number(votesRaw)) ? Number(votesRaw) : 0
  const PRIOR_VOTES = 20
  let combinedRating = baseRating
  if (userRating > 0) {
    combinedRating =
      votes > 0
        ? (baseRating * votes + userRating) / (votes + 1)
        : baseRating > 0
        ? (baseRating * PRIOR_VOTES + userRating) / (PRIOR_VOTES + 1)
        : userRating
  }

  // navigation
  const next = useCallback(() => { if (count) setCurrent(c => (c + 1) % count) }, [count])
  const prev = useCallback(() => { if (count) setCurrent(c => (c - 1 + count) % count) }, [count])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight": case "d": case "D": case "PageDown":
          e.preventDefault(); next(); break
        case "ArrowLeft": case "a": case "A": case "PageUp":
          e.preventDefault(); prev(); break
        case "ArrowUp": case "ArrowDown":
          e.preventDefault(); break
        case "Home":
          e.preventDefault(); if (count) setCurrent(0); break
        case "End":
          e.preventDefault(); if (count) setCurrent(count - 1); break
        case " ":
          e.preventDefault(); (e.shiftKey ? prev() : next()); break
      }
    }
    window.addEventListener("keydown", onKey, { passive: false })
    return () => window.removeEventListener("keydown", onKey)
  }, [count, next, prev])

  // drag/swipe
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragActiveRef = useRef(false)
  const dragStartXRef = useRef(0)
  const wasDraggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)

  const DRAG_START_THRESH = 6
  const SWIPE_NAV_THRESH  = 60

  const [flipFading, setFlipFading] = useState(false)
  const FLIP_FADE_MS = 260  // mild cross-fade window

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
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
      wasDraggingRef.current = true
      const pid = pointerIdRef.current
      if (pid != null) (e.currentTarget as HTMLDivElement).setPointerCapture(pid)
      setIsDragging(true)
    }
  }

  function endDrag(e?: React.PointerEvent<HTMLDivElement>) {
    if (!dragActiveRef.current) return
    dragActiveRef.current = false

    const pid = pointerIdRef.current
    if (pid != null && e?.currentTarget?.hasPointerCapture?.(pid)) {
      e.currentTarget.releasePointerCapture(pid)
    }

    const dx = dragX
    const didSwipe = Math.abs(dx) > SWIPE_NAV_THRESH

    setIsDragging(false)
    setDragX(0)
    pointerIdRef.current = null

    if (didSwipe) { dx < 0 ? next() : prev() }
    queueMicrotask(() => { wasDraggingRef.current = false })
  }

  // center click: front → back → open → back …
  const onCenterClick = (e: React.MouseEvent | React.PointerEvent) => {
    if (wasDraggingRef.current) return
    e.stopPropagation()

    setView(prev => {
      const next = prev === "front" ? "back" : prev === "back" ? "open" : "back"

      // cross-fade only for front <-> back transitions
      if ((prev === "front" && next === "back") || (prev === "back" && next === "front")) {
        setFlipFading(true)
        window.setTimeout(() => setFlipFading(false), FLIP_FADE_MS)
      }
      return next
    })
  }

  // actions
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
        <h1 className="logo">Pick<span>M</span>e!</h1>
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
        className={"carousel" + (view === "open" ? " is-opening" : "")}
        role="region"
        aria-roledescription="carousel"
        aria-label="Book carousel"
      >
        {/* Metadata */}
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

          <div className="meta-actions">
            <LikeButton count={displayLikes} active={liked} onToggle={toggleLike} />
            <StarButton rating={combinedRating} userRating={userRating} active={userRating > 0} onRate={onRate} />
            <SaveButton count={displaySaves} active={saved} onToggle={toggleSave} />
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
                  {(() => {
                    const isCenter = idx === current
                    const frontBg = b.coverUrl
                      ? `url("${b.coverUrl}") center/cover no-repeat, #2d2d2d`
                      : "#2d2d2d"
                    const backBg = b.backCoverUrl
                      ? `url("${b.backCoverUrl}") center/cover no-repeat, #2d2d2d`
                      : "#2d2d2d"

                    return (
                      <>
                        {/* Classic 3D flipper: two faces, front + back */}
                        <div
                          className={
                            "book-inner" +
                            (isCenter && (view === "back" || view === "open") ? " is-flipped" : "") +
                            (isCenter && view === "open" ? " is-open" : "") +
                            (isCenter && flipFading ? " flip-fading" : "")
                          }
                          onClick={isCenter ? onCenterClick : undefined}
                          role={isCenter ? "button" : undefined}
                          aria-label={
                            isCenter
                              ? view === "front"
                                ? "Show back cover"
                                : view === "back"
                                ? "Open book"
                                : "Close book"
                              : undefined
                          }
                          aria-pressed={isCenter ? (view !== "front") : undefined}
                          tabIndex={-1}
                        >
                          {/* FRONT face */}

                          <div
                            className="book-face book-front"
                            style={{
                              transform: "rotateY(0deg)",                 // explicit
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                              background: "#2d2d2d",                       // belt + suspenders fill
                            }}
                          >
                            <div className="face-fill" style={{ background: frontBg }}>
                              {!b.coverUrl ? b.title : null}
                            </div>
                          </div>

                          {/* BACK face */}
                          <div
                            className="book-face book-back"
                            style={{
                              transform: "rotateY(180deg)",                // *** critical ***
                              backfaceVisibility: "visible",                // render even if its back is facing
                              WebkitBackfaceVisibility: "visible",
                              background: "#2d2d2d",                        // paint the face itself
                            }}
                          >
                            <div className="face-fill" style={{ background: backBg }}>
                              {/* leave empty; you’ll style/populate later */}
                            </div>
                          </div>

                        </div>

                        {/* OPEN spread (two panes same size as the book) */}
                        {isCenter && (
                          <div
                            className={
                              "spread" +
                              (view === "open" ? " will-open is-open" : view === "back" ? " will-open" : "")
                            }
                            onClick={onCenterClick}
                            aria-hidden={view !== "open"}
                            aria-label={view === "open" ? "Close book" : undefined}
                          >
                            <div className="pane left" />
                            <div className="pane right" />
                          </div>
                        )}
                      </>
                    )
                  })()}
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
            onClick={(e) => { e.stopPropagation(); next(); (e.currentTarget as HTMLButtonElement).blur() }}
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
            onClick={(e) => { e.stopPropagation(); prev(); (e.currentTarget as HTMLButtonElement).blur() }}
          >
            ‹
          </button>
        </div>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
