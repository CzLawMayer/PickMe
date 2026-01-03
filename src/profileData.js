// src/profileData.js
import { sampleBooks } from "./booksData";

export const getBooksByIds = (ids) =>
  ids
    .map((id) => sampleBooks.find((b) => b.id === id))
    .filter(Boolean);

export const profile = {
  id: "user-001",
  name: "Diego Ballesteros",
  username: "NamesBrooklyn",
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

  userRead: [
    { id: "bk-003", userRating: 5 },
    { id: "bk-005", userRating: 4 },
    { id: "bk-008", userRating: 5 },
    { id: "bk-011", userRating: 4 },
    { id: "bk-014", userRating: 3 },
    { id: "bk-017", userRating: 5 },
    { id: "bk-020", userRating: 5 },
    { id: "bk-023", userRating: 5 },
    { id: "bk-026", userRating: 3 },
    { id: "bk-028", userRating: 4 },
    { id: "bk-030", userRating: 4 },
    { id: "bk-033", userRating: 4 },
    { id: "bk-036", userRating: 5 },
    { id: "bk-040", userRating: 4 },
    { id: "bk-043", userRating: 5 }
  ],

  userStories: [
    { id: "bk-001", userRating: 5 } // same shape as userRead
  ],

// --- Add inside `export const profile = { ... }` ---
  userReviews: [
    {
      id: "bk-001",
      userRating: 5,
      reviews: [
        "Raw and weirdly tender—the voices feel alive. Every chapter feels like peeling back another layer of the human condition, exposing something fragile and real underneath all the noise. The author doesn’t rush to make you understand the characters; instead, they let you sit with them, watch their contradictions, and draw your own conclusions. That patience makes every emotional beat hit twice as hard.",
        "There’s this undercurrent of quiet tension running through the story—like something unspoken vibrating just beneath the surface. It’s not built on dramatic twists, but on the slow realization that these small, intimate moments are what shape people. The dialogue feels unscripted and imperfect in the best possible way; people interrupt, hesitate, trail off—and yet those pauses say more than any carefully written speech could.",
        "The pacing does falter a little around the midpoint, drifting into side stories that seem detached at first. But once the threads start coming together, it’s clear that those detours were essential—they’re where the story’s heart beats strongest. By the time the final chapter arrives, everything that felt scattered finds its gravity again, and it lands with a quiet, devastating precision.",
        "What stays with me most is the empathy. Even when characters make mistakes or act selfishly, the writing refuses to judge them. It’s almost uncomfortable at times—like holding a mirror to your own failings—but it’s also deeply human. By the end, I didn’t just care about the characters; I felt responsible for understanding them. That’s rare. This book doesn’t just tell a story—it changes how you listen to people."
      ]
    },

    {
      id: "bk-003",
      userRating: 4,
      reviews: [
        "Big ideas without losing the characters.",
        "Worldbuilding is slick, could’ve used one more edit pass."
      ]
    },
    {
      id: "bk-005",
      userRating: 3,
      reviews: [
        "Classic fantasy beats done cleanly.",
        "Enjoyable, if a bit paint-by-numbers."
      ]
    },
    {
      id: "bk-008",
      userRating: 5,
      reviews: [
        "Beautiful, quiet, and surprisingly funny.",
        "The last chapter stuck with me all week."
      ]
    },
    {
      id: "bk-009",
      userRating: 4,
      reviews: [
        "Neon grime + moral ambiguity = yes.",
        "Action scenes are cinematic without being confusing."
      ]
    },
    {
      id: "bk-002",
      userRating: 4,
      reviews: [
        "Soft sci-fi with heart; loved the found-family vibe.",
        "Some tech jargon, but it stays readable."
      ]
    },
    {
      id: "bk-004",
      userRating: 5,
      reviews: [
        "Cyberpunk with actual feelings—rare.",
        "Sharp dialogue; I highlighted a dozen lines."
      ]
    },
    {
      id: "bk-011",
      userRating: 4,
      reviews: [
        "Ambitious scope that mostly pays off.",
        "Middle act drifts, finale re-hooks you."
      ]
    },
    {
      id: "bk-007",
      userRating: 5,
      reviews: [
        "Adventure that feels *big* without bloat.",
        "Set-pieces are imaginative and memorable."
      ]
    },
    {
      id: "bk-012",
      userRating: 5,
      reviews: [
        "Slick concept, tight execution—loved it.",
        "Kept me up late; zero regrets."
      ]
    }
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

export const userReadBooks = () => {
  return profile.userRead
    .map(({ id, userRating }) => {
      const book = sampleBooks.find((b) => b.id === id);
      if (!book) return null;
      return {
        ...book,
        userRating: userRating ?? 0,
      };
    })
    .filter(Boolean);
};


// --- Add below your existing helpers ---

// Returns the reviewed books joined with their data and reviews
export const userReviewBooks = () => {
  if (!Array.isArray(profile.userReviews)) return [];
  return profile.userReviews
    .map(({ id, userRating, reviews }) => {
      const book = sampleBooks.find((b) => b.id === id);
      if (!book) return null;
      const reviewsArr = Array.isArray(reviews) ? reviews : [];
      return {
        ...book,
        userRating: userRating ?? 0,
        reviews: reviewsArr,          // keep full list
        review: reviewsArr[0] || ""   // <- add this line
      };
    })
    .filter(Boolean);
};

export const userStoriesBooks = () => {
  return profile.userStories
    .map(({ id, userRating }) => {
      const book = sampleBooks.find((b) => b.id === id);
      if (!book) return null;
      return {
        ...book,
        userRating: userRating ?? 0,
      };
    })
    .filter(Boolean);
};
