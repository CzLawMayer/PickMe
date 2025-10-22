// src/profileData.js
import { sampleBooks } from "./booksData";

export const getBooksByIds = (ids) =>
  ids.map((id) => sampleBooks.find((b) => b.id === id)).filter(Boolean);

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

  stats: {
    booksCompleted: 12,
    chaptersRead: 318,
    booksSaved: 45
  }
};

export const favoriteBooks = () => getBooksByIds(profile.favorites);
export const storyBooks = () => getBooksByIds(profile.stories);
export const libraryBooks = () => getBooksByIds(profile.library);
