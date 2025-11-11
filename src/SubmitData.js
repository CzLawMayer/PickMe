// /src/SubmitData.js

/** ---------- Types (JSDoc for IDEs) ----------
 * @typedef {Object} Chapter
 * @property {string|null} title
 * @property {string} content
 *
 * @typedef {Object} SubmitBook
 * @property {string} id
 * @property {string} title
 * @property {string} author
 * @property {string} date            // ISO yyyy-mm-dd
 * @property {string} copyright
 * @property {string} language
 * @property {string} mainGenre
 * @property {string[]} subGenres
 * @property {string|null} isbn
 * @property {"yes"|"no"} nsfw
 * @property {"yes"|"no"} allowComments
 * @property {number} numberOfChapters
 * @property {Chapter[]} chapters
 * @property {string} summary
 * @property {number} likes
 * @property {number} rating          // 0..5
 * @property {number} saves
 * @property {string} coverUrl
 * @property {string} backCoverUrl
 * @property {number} [currentChapter] // optional progress helper
 */

/* -------------------------------------------------
   In-Progress: make up 1 book (counts all set to 0)
   ------------------------------------------------- */
export const inProgressBooks =
/** @type {SubmitBook[]} */([
  {
    id: "sub-001",
    title: "Echoes of the Amber City",
    author: "Dana Quill",
    date: "2025-11-08",
    copyright: "© 2025 Dana Quill",
    language: "English",
    mainGenre: "Fantasy",
    subGenres: ["Adventure", "Mystery", "Coming-of-Age"],
    isbn: null,                       // optional; not assigned yet
    nsfw: "no",
    allowComments: "yes",
    numberOfChapters: 12,
    chapters: Array.from({ length: 12 }, (_, i) => ({
      title: null,                    // you can rename later; defaults like "Chapter 1"
      content: ""                     // you’ll fill this
    })),
    summary:
      "An apprentice mapmaker discovers living cartography beneath a desert metropolis and must chart a route before the city’s memory turns to sand.",
    likes: 0,
    rating: 0,
    saves: 0,
    coverUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    backCoverUrl:
      "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?q=80&w=1200&auto=format&fit=crop",
    currentChapter: 0
  }
]);

/* -------------------------------------------------
   Published: bk-001 (filled in with plausible data)
   ------------------------------------------------- */
export const publishedBooks =
/** @type {SubmitBook[]} */([
  {
    id: "bk-001",
    title: "The Paper Astronomer",
    author: "L. V. Marrow",
    date: "2023-06-14",
    copyright: "© 2023 L. V. Marrow",
    language: "English",
    mainGenre: "Science Fiction",
    subGenres: ["Literary", "Adventure", "Speculative", "Drama"],
    isbn: "978-1-4028-9462-6",
    nsfw: "no",
    allowComments: "yes",
    numberOfChapters: 28,
    chapters: Array.from({ length: 28 }, (_, i) => ({
      title: null,                    // treat as “Chapter N” if null
      content: ""                     // not required for your rails
    })),
    summary:
      "An ex-librarian reverse-engineers a crashed probe’s star charts using origami and ink, then folds a nation toward the sky.",
    likes: 4128,
    rating: 4.6,
    saves: 2337,
    coverUrl:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop",
    backCoverUrl:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop",
    currentChapter: 28                // completed
  }
]);

/* -------------------------------------------------
   Helpers for display/testing (Stories rail shape)
   ------------------------------------------------- */

/** Map SubmitBook -> minimal card your Stories rail expects */
const toStoryItem = (b) => ({
  id: b.id,
  title: b.title,             // you said you won’t show titles on the tiles; fine to include
  author: b.author,
  coverUrl: b.coverUrl,
  tags: [b.mainGenre, ...(b.subGenres || [])].slice(0, 5).filter(Boolean),
  likes: b.likes ?? 0,
  rating: Number(b.rating ?? 0),
  bookmarks: b.saves ?? 0,
  totalChapters: b.numberOfChapters ?? (b.chapters?.length || 0),
  currentChapter: b.currentChapter ?? 0
});

/** Arrays ready for your Stories strip */
export const submitInProgressAsStories = () => inProgressBooks.map(toStoryItem);
export const submitPublishedAsStories  = () => publishedBooks.map(toStoryItem);

/** Quick aggregator if needed elsewhere */
export const allSubmitBooks = () => ({
  inProgress: inProgressBooks,
  published: publishedBooks
});
