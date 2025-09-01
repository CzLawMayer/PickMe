// src/pages/Home.tsx (or .jsx)
import { useEffect, useRef } from 'react';
import './Home.css';
import { initCarousel } from '../carousel';
import { sampleBooks } from '../booksData';

export default function Home() {
  const carouselRef = useRef<{ next: () => void; prev: () => void } | null>(null);

  useEffect(() => {
    // In the future, replace `sampleBooks` with the array you fetch from your backend.
    const api = initCarousel(sampleBooks);
    carouselRef.current = api;
    return () => {
      // no cleanup needed; controller is headless
      carouselRef.current = null;
    };
  }, []);

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
        {/* EXTRA: far-left books (completely off-screen) */}
        <div className="book left-off-2" aria-hidden>
          <div className="book-placeholder" id="left-off-2">BOOK</div>
        </div>
        <div className="book left-off-1" aria-hidden>
          <div className="book-placeholder" id="left-off-1">BOOK</div>
        </div>

        {/* Left book */}
        <div className="book left-book">
          <div className="book-placeholder" id="left-book">BOOK</div>
        </div>

        {/* Metadata */}
        <div className="metadata">
          <div className="user-icon" aria-hidden>👤</div>
          <p className="username" id="meta-username">Names Brooklyn</p>
          <div className="icons">
            <div id="meta-likes">♡ 423</div>
            <div id="meta-rating">★ 4.5/5</div>
            <div id="meta-bookmarks">🔖 76</div>
          </div>
          <p className="chapters" id="meta-chapters">0/17 Chapters</p>
          <div className="tags" id="meta-tags">
            <span>Sci-Fi</span>
            <span>Young Adult</span>
            <span>Drama</span>
          </div>
        </div>

        {/* Center book */}
        <div className="book main-book">
          <div className="book-placeholder" id="center-book">MAIN BOOK</div>
        </div>

        {/* Right book */}
        <div className="book right-book">
          <div className="book-placeholder" id="right-book">BOOK</div>
        </div>

        {/* EXTRA: far-right books (completely off-screen) */}
        <div className="book right-off-1" aria-hidden>
          <div className="book-placeholder" id="right-off-1">BOOK</div>
        </div>
        <div className="book right-off-2" aria-hidden>
          <div className="book-placeholder" id="right-off-2">BOOK</div>
        </div>

        {/* Arrows independent of books */}
        <div className="vertical-arrows">
          <button
            type="button"
            className="arrow"
            aria-label="Previous book"
            title="Previous"
            onClick={() => carouselRef.current?.prev()}
          >
            ›
          </button>
          <button
            type="button"
            className="arrow"
            aria-label="Next book"
            title="Next"
            onClick={() => carouselRef.current?.next()}
          >
            ‹
          </button>
        </div>
      </main>
    </div>
  );
}
