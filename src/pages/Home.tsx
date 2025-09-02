import { useState } from "react"
import "./Home.css"
import { sampleBooks } from "../booksData"

type Book = {
  id: string
  title: string
  author?: string
  user?: string
  coverUrl?: string
  tags?: string[]
  rating?: string
  likes?: number
  bookmarks?: number
  currentChapter?: number
  totalChapters?: number
}

export default function Home() {
  const [books] = useState<Book[]>(sampleBooks)
  const [current, setCurrent] = useState(0)

  const count = books.length
  const next = () => setCurrent((c) => (c + 1) % count)
  const prev = () => setCurrent((c) => (c - 1 + count) % count)

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  // Make keys work even when buttons/links inside the region are focused
  switch (e.key) {
    case "ArrowRight":
    case "d":
    case "D":
      e.preventDefault()
      next()
      break
    case "ArrowLeft":
    case "a":
    case "A":
      e.preventDefault()
      prev()
      break
    case "PageDown":
      e.preventDefault()
      next()
      break
    case "PageUp":
      e.preventDefault()
      prev()
      break
    case "End":
      e.preventDefault()
      if (count) setCurrent(count - 1)
      break
    case "Home":
      e.preventDefault()
      if (count) setCurrent(0)
      break
    case " ":
      // Space = next, Shift+Space = previous (mirrors browser scrolling behavior)
      e.preventDefault()
      e.shiftKey ? prev() : next()
      break
  }
}

  const center = books[current] ?? null

  // helper to wrap indexes
  const mod = (x: number) => (count ? (x % count + count) % count : 0)

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
      <main className="carousel" role="region" aria-label="Book carousel" tabIndex={0} onKeyDown={handleKeyDown} aria-roledescription="carousel">
        {/* Metadata (fixed, left of center) */}
        <div className="metadata">
          <div className="user-icon" aria-hidden>👤</div>
          <p className="username">{center?.user ?? "Unknown User"}</p>
          <div className="icons">
            <div>♡ {center?.likes ?? 0}</div>
            <div>★ {center?.rating ?? "—"}</div>
            <div>🔖 {center?.bookmarks ?? 0}</div>
          </div>
          <p className="chapters">
            {(center?.currentChapter ?? 0)}/{center?.totalChapters ?? 0} Chapters
          </p>
          <div className="tags">
            {(center?.tags ?? []).map((t) => <span key={t}>{t}</span>)}
          </div>
        </div>

        {/* --- CARDS (CENTER + SIDE PEEKS) --- */}
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

        {/* Arrows (fixed; do not move with slides) */}
        <div className="vertical-arrows">
          <button
            type="button"
            className="arrow"
            aria-label="Next book"
            title="Previous"
            onClick={next}
          >
            ›
          </button>
          <button
            type="button"
            className="arrow"
            aria-label="Previous book"
            title="Next"
            onClick={prev}
          >
            ‹
          </button>
        </div>
      </main>
    </div>
  )
}
