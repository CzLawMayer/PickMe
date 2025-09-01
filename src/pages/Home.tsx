import './Home.css';

export default function Home() {
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

      {/* Main stage */}
      <main className="carousel">
        {/* Left book */}
        <div className="book left-book">
          <div className="book-placeholder" id="left-book">BOOK</div>
        </div>

        {/* Metadata */}
        <div className="metadata">
          <div className="user-icon" aria-hidden>👤</div>
          <p className="username">Names Brooklyn</p>
          <div className="icons">
            <div>♡ 423</div>
            <div>★ 4.5/5</div>
            <div>🔖 76</div>
          </div>
          <p className="chapters">0/17 Chapters</p>
          <div className="tags">
            <span>Sci-Fi</span>
            <span>Young Adult</span>
            <span>Drama</span>
          </div>
        </div>

        {/* Center book */}
        <div className="book main-book">
          <div className="book-placeholder" id="center-book">MAIN BOOK</div>

          {/* Arrows as real buttons (visual only for now) */}
          <div className="vertical-arrows">
            <button
              type="button"
              className="arrow"
              aria-label="Previous book"
              title="Previous"
            >
              ›
            </button>
            <button
              type="button"
              className="arrow"
              aria-label="Next book"
              title="Next"
            >
              ‹
            </button>
          </div>
        </div>

        {/* Right book */}
        <div className="book right-book">
          <div className="book-placeholder" id="right-book">BOOK</div>
        </div>
      </main>
    </div>
  );
}
