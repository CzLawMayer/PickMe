// src/carousel.js

/**
 * Headless Carousel Controller
 * - Manages current index
 * - Renders 7 visible/offscreen slots
 * - Updates metadata for the center book
 *
 * Slots (hard-coded IDs that already exist in your DOM):
 *   left-off-2, left-off-1, left-book, center-book, right-book, right-off-1, right-off-2
 *
 * To integrate with backend later, just pass your fetched array of books to initCarousel(books).
 */

const SLOT_IDS = [
  "left-off-2",
  "left-off-1",
  "left-book",
  "center-book",
  "right-book",
  "right-off-1",
  "right-off-2",
];

// Helpers
const mod = (n, m) => ((n % m) + m) % m;

function setBookIntoSlot(slotId, book) {
  const slot = document.getElementById(slotId);
  if (!slot) return;

  // Expecting your markup: <div class="book-placeholder" id="{slotId}">...</div>
  // We’ll set background and simple text fallback.
  slot.style.backgroundSize = "cover";
  slot.style.backgroundPosition = "center";
  slot.style.backgroundRepeat = "no-repeat";

  if (book?.coverUrl) {
    slot.style.backgroundImage = `url("${book.coverUrl}")`;
    slot.textContent = ""; // show just the cover
  } else {
    slot.style.backgroundImage = "none";
    slot.textContent = (book && (book.title || "BOOK")) || "BOOK";
  }

  // Accessibility
  slot.setAttribute("role", "img");
  slot.setAttribute(
    "aria-label",
    book ? `${book.title || "Untitled"} by ${book.author || "Unknown"}` : "Empty"
  );
}

function updateMetadata(book) {
  // Map your metadata IDs/classes to DOM
  const usernameEl = document.getElementById("meta-username");
  const likesEl = document.getElementById("meta-likes");
  const ratingEl = document.getElementById("meta-rating");
  const bookmarksEl = document.getElementById("meta-bookmarks");
  const chaptersEl = document.getElementById("meta-chapters");
  const tagsWrap = document.getElementById("meta-tags");

  if (!book) return;

  if (usernameEl) usernameEl.textContent = book.user || "Unknown User";
  if (likesEl) likesEl.textContent = `♡ ${book.likes ?? 0}`;
  if (ratingEl) ratingEl.textContent = `★ ${book.rating ?? "—"}`;
  if (bookmarksEl) bookmarksEl.textContent = `🔖 ${book.bookmarks ?? 0}`;
  if (chaptersEl) {
    const total = book.totalChapters ?? 0;
    const curr = book.currentChapter ?? 0;
    chaptersEl.textContent = `${curr}/${total} Chapters`;
  }

  if (tagsWrap) {
    tagsWrap.innerHTML = "";
    (book.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.textContent = t;
      tagsWrap.appendChild(span);
    });
  }
}

export function initCarousel(books) {
  const data = Array.isArray(books) ? books : [];
  let current = 0; // index of the "center" book

  function render() {
    if (!data.length) {
      // Clear slots to defaults
      SLOT_IDS.forEach((id) => setBookIntoSlot(id, null));
      updateMetadata(null);
      return;
    }

    // Offsets relative to current: -3..+3
    const offsets = [-3, -2, -1, 0, 1, 2, 3];

    offsets.forEach((offset, i) => {
      const idx = mod(current + offset, data.length);
      setBookIntoSlot(SLOT_IDS[i], data[idx]);
    });

    // Metadata = center book
    const centerIdx = mod(current, data.length);
    updateMetadata(data[centerIdx]);
  }

  function next() {
    if (data.length) {
      current = mod(current + 1, data.length);
      render();
    }
  }

  function prev() {
    if (data.length) {
      current = mod(current - 1, data.length);
      render();
    }
  }

  // Initial paint
  render();

  return { next, prev, getIndex: () => current, setIndex: (i) => { current = mod(i, data.length || 1); render(); } };
}
