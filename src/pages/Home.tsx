import { useRef, useState, useCallback, useEffect } from "react"
import "./Home.css"
import { sampleBooks } from "../booksData"

import LikeButton from "@/components/LikeButton"
import StarButton from "@/components/StarButton"
import SaveButton from "@/components/SaveButton"

import SideMenu from "@/components/SideMenu"

// ---------- Types ----------
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
  dedication?: string
  chapters?: string[] // optional list of chapter titles
}

type BookView = "front" | "back" | "open"

// ---------- Component ----------
export default function Home() {
  // data
  const [books] = useState<Book[]>(Array.isArray(sampleBooks) ? sampleBooks : [])
  const count = books.length

  // selection / ui
  const [current, setCurrent] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  // book state
  const [view, setView] = useState<BookView>("front")
  const [isOpening, setIsOpening] = useState(false)
  const [page, setPage] = useState(0)   // 👈 moved up here

  // reader menu (bottom sheet) — only used while book is open
  const [readerMenuOpen, setReaderMenuOpen] = useState(false)

  // Close the reader menu any time we leave "open" view
  useEffect(() => {
    if (view !== "open") setReaderMenuOpen(false)
  }, [view])

  // Close the reader menu on Escape
  useEffect(() => {
    if (!readerMenuOpen) return
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setReaderMenuOpen(false)
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [readerMenuOpen])

  const center: Book | null = count ? books[mod(current, count)] : null
  const isOpenLayout = view === "open" || isOpening

  // when switching books, go back to the front cover
  useEffect(() => {
    setView("front")
    setPage(0)
  }, [current])

  // ---------- Per-book toggles ----------
  const [likedById, setLikedById] = useState<Record<string, boolean>>({})
  const [savedById, setSavedById] = useState<Record<string, boolean>>({})
  const [userRatingById, setUserRatingById] = useState<Record<string, number>>({})

  const centerId = center?.id ?? ""
  const liked = !!(centerId && likedById[centerId])
  const saved = !!(centerId && savedById[centerId])
  const userRating = centerId ? (userRatingById[centerId] ?? 0) : 0

  const displayLikes = (center?.likes ?? 0) + (liked ? 1 : 0)
  const displaySaves = (center?.bookmarks ?? 0) + (saved ? 1 : 0)

  const baseRating =
    typeof center?.rating === "string"
      ? parseFloat(String(center?.rating).split("/")[0] || "0")
      : Number(center?.rating ?? 0)

  const votesRaw = center?.ratingCount ?? 0
  const votes = Number.isFinite(Number(votesRaw)) ? Number(votesRaw) : 0
  const PRIOR_VOTES = 20
  const combinedRating =
    userRating > 0
      ? votes > 0
        ? (baseRating * votes + userRating) / (votes + 1)
        : baseRating > 0
        ? (baseRating * PRIOR_VOTES + userRating) / (PRIOR_VOTES + 1)
        : userRating
      : baseRating

  // ---------- Carousel nav (closed) ----------
  const next = useCallback(() => {
    if (!count) return
    setCurrent((c) => mod(c + 1, count))
  }, [count])

  const prev = useCallback(() => {
    if (!count) return
    setCurrent((c) => mod(c - 1, count))
  }, [count])

  // ---------- Pages model (open) ----------
  // page 0 = dedication (left)
  // page 1 = table of contents (right)
  // page 2.. = chapters, 1 chapter per page
  const chapterCount = (() => {
    if (!center) return 0
    if (Array.isArray(center.chapters) && center.chapters.length > 0) return center.chapters.length
    const n = Number(center.totalChapters ?? 0)
    return Number.isFinite(n) && n > 0 ? n : 0
  })()

  const chapterTitles: string[] = (() => {
    if (center && Array.isArray(center.chapters) && center.chapters.length === chapterCount) {
      return center.chapters.slice()
    }
    return Array.from({ length: chapterCount }, (_, i) => `Chapter ${i + 1}`)
  })()

  // total pages & bounds
  const totalPages = 2 + chapterCount
  const maxLeftPage = lastEven(totalPages - 1) // last even ≤ totalPages-1

  const clampToSpread = useCallback(
    (p: number) => Math.max(0, Math.min(p, Math.max(0, maxLeftPage))),
    [maxLeftPage]
  )

  // page flipping when "open": step by 2 (left page index)
  const turnPage = useCallback(
    (dir: 1 | -1) => setPage((p) => clampToSpread(p + 2 * dir)),
    [clampToSpread]
  )

  const gotoChapter = useCallback(
    (k: number) => {
      // chapter k (1-based) -> page k+1; ensure left page is even
      const p = k + 1
      const left = p % 2 === 0 ? p : p - 1
      setPage(clampToSpread(left))
    },
    [clampToSpread]
  )

  const atStart = page <= 0
  const atEnd = page >= maxLeftPage

  // ---------- Flip cross-fade ----------
  const [flipFading, setFlipFading] = useState(false)
  const FLIP_FADE_MS = 260

  const returnToCover = useCallback(() => {
    setPage(0)
    setFlipFading(true)
    window.setTimeout(() => setFlipFading(false), FLIP_FADE_MS)
    setView("front")
  }, []) // duration constant is fine to omit in deps

  // ---------- Keyboard ----------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
        case "PageDown":
          e.preventDefault()
          if (view === "open") turnPage(1)
          else next()
          break
        case "ArrowLeft":
        case "a":
        case "A":
        case "PageUp":
          e.preventDefault()
          if (view === "open") turnPage(-1)
          else prev()
          break
        case "Home":
          e.preventDefault()
          if (view === "open") setPage(0)
          else if (count) setCurrent(0)
          break
        case "End":
          e.preventDefault()
          if (view === "open") setPage(maxLeftPage)
          else if (count) setCurrent(count - 1)
          break
        case " ":
          e.preventDefault()
          if (view === "open") turnPage(e.shiftKey ? -1 : 1)
          else (e.shiftKey ? prev() : next())
          break
      }
    }
    window.addEventListener("keydown", onKey, { passive: false })
    return () => window.removeEventListener("keydown", onKey)
  }, [count, view, next, prev, turnPage, maxLeftPage])

  // ---------- Drag / swipe ----------
// ---------- Drag / swipe ----------
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragActiveRef = useRef(false)
  const dragStartXRef = useRef(0)
  const wasDraggingRef = useRef(false as boolean)
  const pointerIdRef = useRef<number | null>(null)

  // --- Suppress accidental clicks on the open spread after a drag ---
  const spreadDownRef = useRef<{ x: number; y: number } | null>(null)
  const spreadDraggedRef = useRef(false)
  const SPREAD_CLICK_MOVE_THRESH = 8 // px

  function onSpreadPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    spreadDownRef.current = { x: e.clientX, y: e.clientY }
    spreadDraggedRef.current = false
  }

  function onSpreadPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = spreadDownRef.current
    if (!d) return
    const dx = Math.abs(e.clientX - d.x)
    const dy = Math.abs(e.clientY - d.y)
    // mark as dragged if moved enough; the *upcoming click* must be ignored
    spreadDraggedRef.current =
      dx > SPREAD_CLICK_MOVE_THRESH || dy > SPREAD_CLICK_MOVE_THRESH

    // clear on the next macrotask, AFTER click fires
    setTimeout(() => {
      spreadDownRef.current = null
      spreadDraggedRef.current = false
    }, 0)
  }

  function onSpreadClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (spreadDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation() // block the click so onCenterClick won’t fire
    }
  }

  const DRAG_START_THRESH = 6
  const SWIPE_NAV_THRESH = 60

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (view === "open") return // 🚫 block dragging while open
    dragActiveRef.current = true
    dragStartXRef.current = e.clientX
    pointerIdRef.current = e.pointerId
    setIsDragging(false)
    setDragX(0)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (view === "open") return // 🚫 guard
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
    if (view === "open") return
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
    if (didSwipe) {
      if (dx < 0) {
        view === "open" ? turnPage(1) : next()
      } else {
        view === "open" ? turnPage(-1) : prev()
      }
    }
    queueMicrotask(() => {
      wasDraggingRef.current = false
    })
  }
// ---------- Center click (front → back → open → back …) ----------


  // ---------- Center click (front → back → open → back …) ----------
  const onCenterClick = (e: React.MouseEvent | React.PointerEvent) => {
    if (spreadDraggedRef.current) return
    if (wasDraggingRef.current) return
    e.stopPropagation()
    setView((prev) => {
      const nextView: BookView =
        prev === "front" ? "back" : prev === "back" ? "open" : "back"

      // Kick off open choreography when going back → open
      if (prev === "back" && nextView === "open") {
        setPage(0)
        setIsOpening(true)
        const OPEN_TOTAL_MS = 800 // slide + unfold (match your CSS)
        window.setTimeout(() => setIsOpening(false), OPEN_TOTAL_MS)
      }

      // Cross-fade when front/back toggling
      if (
        (prev === "front" && nextView === "back") ||
        (prev === "back" && nextView === "front")
      ) {
        setFlipFading(true)
        window.setTimeout(() => setFlipFading(false), FLIP_FADE_MS)
      }

      return nextView
    })
  }

  // ---------- Actions ----------
  const toggleLike = useCallback(() => {
    if (!centerId) return
    setLikedById((m) => ({ ...m, [centerId]: !m[centerId] }))
  }, [centerId])

  const toggleSave = useCallback(() => {
    if (!centerId) return
    setSavedById((m) => ({ ...m, [centerId]: !m[centerId] }))
  }, [centerId])

  const onRate = useCallback(
    (val: number) => {
      if (!centerId) return
      setUserRatingById((m) => ({ ...m, [centerId]: val }))
    },
    [centerId]
  )

  // ---------- Render ----------
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
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "X" : "☰"}
          </button>
        </div>
      </header>

      {/* Stage */}
      <main
        className={
          "carousel" +
          (isOpenLayout ? " is-opened" : "") +   // persistent while open
          (isOpening ? " is-opening" : "")       // only during opening animation
        }
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
          className={`drag-layer${isDragging ? " dragging" : ""}` + (view === "open" ? " disabled" : "")}
          style={{ transform: `translateX(${dragX}px)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          {count > 0 && (() => {
            const order = [
              { cls: "book left-off-1",  idx: mod(current - 2, count) },
              { cls: "book left-book",   idx: mod(current - 1, count) },
              { cls: "book main-book",   idx: mod(current + 0, count) },
              { cls: "book right-book",  idx: mod(current + 1, count) },
              { cls: "book right-off-1", idx: mod(current + 2, count) },
            ]
            return order.map(({ cls, idx }) => {
              const b = books[idx]
              const isCenter = idx === mod(current, count)

              const frontBg = b.coverUrl
                ? `url("${b.coverUrl}") center/cover no-repeat, #2d2d2d`
                : "#2d2d2d"
              const backBg = b.backCoverUrl
                ? `url("${b.backCoverUrl}") center/cover no-repeat, #2d2d2d`
                : "#2d2d2d"

              return (
                <div key={b.id} className={cls} aria-hidden={!isCenter}>
                  {/* Closed flipper: front/back */}
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
                    <div className="book-face book-front">
                      <div className="face-fill" style={{ background: frontBg }}>
                        {!b.coverUrl ? b.title : null}
                      </div>
                    </div>

                    {/* BACK face */}
                    <div className="book-face book-back">
                      <div className="face-fill" style={{ background: backBg }} />
                    </div>
                  </div>

                  {/* OPEN spread */}
                  {isCenter && (
                    <div
                      className={
                        "spread" +
                        (view === "open" ? " will-open is-open" : view === "back" ? " will-open" : "")
                      }
                      onPointerDown={onSpreadPointerDown}   // ← add this
                      onPointerUp={onSpreadPointerUp}       // ← add this
                      onClickCapture={onSpreadClickCapture}
                      onClick={onCenterClick}
                      aria-hidden={view !== "open"}
                      aria-label={view === "open" ? "Close book" : undefined}
                    >
                      {/* LEFT pane (page == even number) */}
                      <div
                        className="pane left"
                        onClick={(e) => { e.stopPropagation(); if (view === "open") turnPage(-1) }}
                      >
                        {page === 0 ? (
                          // Dedication (page 0)
                          <div className="dedication">
                            <div className="dedication-text">
                              {typeof center?.dedication === "string" && center.dedication.trim()
                                ? center.dedication
                                : "— Dedication —"}
                            </div>
                          </div>
                        ) : (
                          (() => {
                            if (page >= 2) {
                              const chapIdx = page - 2 // 0-based
                              if (chapIdx >= 0 && chapIdx < chapterCount) {
                                return (
                                  <div className="chapter-page">
                                    <h2 className="chapter-title">{chapterTitles[chapIdx]}</h2>
                                    <div className="chapter-body">
                                      <p>(Chapter {chapIdx + 1} content goes here.)</p>
                                    </div>
                                  </div>
                                )
                              }
                            }
                            return <div className="page-blank" aria-hidden="true" />
                          })()
                        )}
                      </div>

                      {/* RIGHT pane (page+1) */}
                      <div
                        className="pane right"
                        onClick={(e) => { e.stopPropagation(); if (view === "open") turnPage(1) }}
                      >
                        {page === 0 ? (
                          // Table of Contents (page 1)
                          <div className="toc">
                            <h3 className="toc-title">Contents</h3>
                            <ol className="toc-list">
                              {chapterTitles.map((t, i) => (
                                <li key={i}>
                                  <button
                                    type="button"
                                    className="toc-link"
                                    onClick={(e) => { e.stopPropagation(); gotoChapter(i + 1) }}
                                    aria-label={`Go to ${t}`}
                                    title={`Go to ${t}`}
                                  >
                                    <span className="toc-chapter">{t}</span>
                                    <span className="toc-dots" aria-hidden>…………………………………………</span>
                                    <span className="toc-page">{i + 2}</span>
                                  </button>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : (
                          (() => {
                            const rightPage = page + 1
                            if (rightPage >= 2) {
                              const chapIdx = rightPage - 2
                              if (chapIdx >= 0 && chapIdx < chapterCount) {
                                return (
                                  <div className="chapter-page">
                                    <h2 className="chapter-title">{chapterTitles[chapIdx]}</h2>
                                    <div className="chapter-body">
                                      <p>(Chapter {chapIdx + 1} content continues here.)</p>
                                    </div>
                                  </div>
                                )
                              }
                            }
                            return <div className="page-blank" aria-hidden="true" />
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>

        {/* Arrows */}
        <div className="vertical-arrows">
          {/* TOP: Next / Page→ */}
          <button
            type="button"
            className="arrow"
            aria-label={view === "open" ? "Next page" : "Next book"}
            aria-keyshortcuts="ArrowRight Space"
            title={view === "open" ? (atEnd ? "Last page" : "Next page") : "Next"}
            disabled={view === "open" && atEnd}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (view === "open") turnPage(1)
              else next()
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
          >
            ›
          </button>

          {/* MIDDLE: Cover (only when OPEN) */}
          {view === "open" && (
            <button
              type="button"
              className="arrow arrow--cover"
              aria-label="Return to cover"
              title="Cover"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                returnToCover()
                ;(e.currentTarget as HTMLButtonElement).blur()
              }}
            >
              ⟲
            </button>
          )}

          {/* BOTTOM: Prev / Page← */}
          <button
            type="button"
            className="arrow"
            aria-label={view === "open" ? "Previous page" : "Previous book"}
            aria-keyshortcuts="ArrowLeft Shift+Space"
            title={view === "open" ? (atStart ? "First page" : "Previous page") : "Previous"}
            disabled={view === "open" && atStart}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (view === "open") turnPage(-1)
              else prev()
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
          >
            ‹
          </button>
        </div>

        {view === "open" && (
  <div className={"reader-menu" + (readerMenuOpen ? " is-open" : "")}>
    {/* Toggle button (chevron) */}
    <button
      type="button"
      className="reader-menu-toggle"
      aria-label={readerMenuOpen ? "Hide reader menu" : "Show reader menu"}
      aria-expanded={readerMenuOpen}
      onClick={(e) => {
        e.stopPropagation()
        setReaderMenuOpen(o => !o)
      }}
    >
      <span className="reader-menu-chevron" aria-hidden>⌃</span>
    </button>

    {/* Sliding panel */}
    <div
      className="reader-menu-panel"
      role="menu"
      aria-hidden={!readerMenuOpen}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="reader-menu-grid">
        {/* 7 placeholder actions (we’ll wire these later) */}
        <button className="reader-menu-item" role="menuitem" aria-label="Font size">A</button>
        <button className="reader-menu-item" role="menuitem" aria-label="Font">F</button>
        <button className="reader-menu-item" role="menuitem" aria-label="Light / Dark">☀︎</button>
        <button className="reader-menu-item" role="menuitem" aria-label="Dictionary">📖</button>
        <button className="reader-menu-item" role="menuitem" aria-label="Notes">✍︎</button>
        <button className="reader-menu-item" role="menuitem" aria-label="Line height">↕︎</button>
        <button className="reader-menu-item" role="menuitem" aria-label="Text to Speech">🔊</button>
      </div>
    </div>
  </div>
)}

      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}

// ---------- helpers ----------
function mod(x: number, n: number) {
  // safe modulo for negatives
  return n ? ((x % n) + n) % n : 0
}
function lastEven(n: number) {
  if (!Number.isFinite(n)) return 0
  const m = Math.max(0, Math.floor(n))
  return m % 2 === 0 ? m : m - 1
}
