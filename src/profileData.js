// src/profileData.js
import { sampleBooks } from "./booksData";

export const getBooksByIds = (ids) =>
  ids
    .map((id) => sampleBooks.find((b) => b.id === id))
    .filter(Boolean);

export const profile = {
  id: "user-001",
  name: "Diego Ballesteros",
  username: "Balls",
  avatarUrl: "/public/avatars/Diego.jpg",

  stories: [
    "bk-001", "bk-002", "bk-003", "bk-004", "bk-005",
    "bk-006", "bk-007", "bk-008", "bk-009", "bk-010", "bk-011"
  ],

  favorites: [
    "bk-045", "bk-008", "bk-011", "bk-009", "bk-001"
  ],

  // full public profile library (for showing on profile page etc.)
  library: [
    "bk-001","bk-002","bk-003","bk-004","bk-005",
    "bk-006","bk-007","bk-008","bk-009","bk-010",
    "bk-011","bk-012","bk-013","bk-014","bk-015",
    "bk-016","bk-017","bk-018","bk-019","bk-020",
    "bk-021","bk-022","bk-023","bk-024","bk-025",
    "bk-026","bk-027","bk-028","bk-029","bk-030",
    "bk-031","bk-032","bk-033","bk-034","bk-035",
    "bk-036","bk-037","bk-038","bk-039","bk-040",
    "bk-041","bk-042","bk-043","bk-044","bk-045"
  ],

  // personal library state (for the Library page)
  // includes per-book userRating (1-5)
  userLibrary: [
    { id: "bk-001", userRating: 4 },
    { id: "bk-002", userRating: 3 },
    { id: "bk-003", userRating: 5 },
    { id: "bk-004", userRating: 2 },
    { id: "bk-005", userRating: 0 },
    { id: "bk-006", userRating: 4 },
    { id: "bk-007", userRating: 1 },
    { id: "bk-008", userRating: 5 },
    { id: "bk-009", userRating: 0 },
    { id: "bk-010", userRating: 3 },

    { id: "bk-011", userRating: 2 },
    { id: "bk-012", userRating: 4 },
    { id: "bk-013", userRating: 5 },
    { id: "bk-014", userRating: 1 },
    { id: "bk-015", userRating: 2 },
    { id: "bk-016", userRating: 3 },
    { id: "bk-017", userRating: 5 },
    { id: "bk-018", userRating: 2 },
    { id: "bk-019", userRating: 4 },
    { id: "bk-020", userRating: 5 },

    { id: "bk-021", userRating: 3 },
    { id: "bk-022", userRating: 3 },
    { id: "bk-023", userRating: 5 },
    { id: "bk-024", userRating: 2 },
    { id: "bk-025", userRating: 4 },
    { id: "bk-026", userRating: 1 },
    { id: "bk-027", userRating: 5 },
    { id: "bk-028", userRating: 2 },
    { id: "bk-029", userRating: 3 },
    { id: "bk-030", userRating: 4 },

    { id: "bk-031", userRating: 2 },
    { id: "bk-032", userRating: 3 },
    { id: "bk-033", userRating: 4 },
    { id: "bk-034", userRating: 1 },
    { id: "bk-035", userRating: 4 },
    { id: "bk-036", userRating: 5 },
    { id: "bk-037", userRating: 3 },
    { id: "bk-038", userRating: 5 },
    { id: "bk-039", userRating: 2 },
    { id: "bk-040", userRating: 4 },

    { id: "bk-041", userRating: 3 },
    { id: "bk-042", userRating: 2 },
    { id: "bk-043", userRating: 5 },
    { id: "bk-044", userRating: 1 },
    { id: "bk-045", userRating: 4 }
  ],

  stats: {
    booksCompleted: 12,
    chaptersRead: 318,
    booksSaved: 48
  }
};

// helpers
export const favoriteBooks = () => getBooksByIds(profile.favorites);
export const storyBooks = () => getBooksByIds(profile.stories);
export const libraryBooks = () => getBooksByIds(profile.library);

// IMPORTANT: this merges each entry in userLibrary with the actual book data
export const userLibraryBooks = () => {
  return profile.userLibrary
    .map(({ id, userRating }) => {
      const book = sampleBooks.find((b) => b.id === id);
      if (!book) return null;
      return {
        ...book,
        userRating: userRating ?? 0
      };
    })
    .filter(Boolean);
};
