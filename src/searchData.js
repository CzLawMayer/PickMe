// src/searchData.js
// Lightweight search helpers + dummy users + unified genres list
// Usage:
//   import { searchBooks, searchUsers, searchGenres, quickSearch } from "@/searchData";

import { sampleBooks } from "./booksData";

/* ---------------------------
   Fake user directory
   --------------------------- */
export const usersDirectory = [
  {
    id: "u-001",
    name: "Diego Ballesteros",
    username: "Balls",
    avatarUrl: "/public/avatars/Diego.jpg",
    storiesWritten: 12,
    likesGiven: 1432,
  },
  {
    id: "u-002",
    name: "Maya Clarke",
    username: "GreyHarborFan",
    avatarUrl: "/public/avatars/maya.jpg",
    storiesWritten: 4,
    likesGiven: 298,
  },
  {
    id: "u-003",
    name: "Ravi Patel",
    username: "OrbitLover",
    avatarUrl: "/public/avatars/ravi.jpg",
    storiesWritten: 9,
    likesGiven: 764,
  },
  {
    id: "u-004",
    name: "Zoe Kim",
    username: "MoonWalker",
    avatarUrl: "/public/avatars/zoe.jpg",
    storiesWritten: 7,
    likesGiven: 512,
  },
  {
    id: "u-005",
    name: "Samir Ahmed",
    username: "TowerClimber",
    avatarUrl: "/public/avatars/samir.jpg",
    storiesWritten: 3,
    likesGiven: 221,
  },
  {
    id: "u-006",
    name: "Kei Ito",
    username: "NeonCity",
    avatarUrl: "/public/avatars/kei.jpg",
    storiesWritten: 6,
    likesGiven: 899,
  },
  {
    id: "u-007",
    name: "Daniela Cruz",
    username: "SaltyReader",
    avatarUrl: "/public/avatars/daniela.jpg",
    storiesWritten: 2,
    likesGiven: 145,
  },
  {
    id: "u-008",
    name: "Elena Novak",
    username: "GardenReader",
    avatarUrl: "/public/avatars/elena.jpg",
    storiesWritten: 5,
    likesGiven: 377,
  },
  {
    id: "u-009",
    name: "Tomas Rivera",
    username: "NeonWatcher",
    avatarUrl: "/public/avatars/tomas.jpg",
    storiesWritten: 11,
    likesGiven: 1204,
  },
  {
    id: "u-010",
    name: "Hanna Lindgren",
    username: "CartoFan",
    avatarUrl: "/public/avatars/hanna.jpg",
    storiesWritten: 1,
    likesGiven: 88,
  },
  {
    id: "u-011",
    name: "Leyla Demir",
    username: "HarborReader",
    avatarUrl: "/public/avatars/leyla.jpg",
    storiesWritten: 8,
    likesGiven: 654,
  },
  {
    id: "u-012",
    name: "Marco Ortega",
    username: "Skybound",
    avatarUrl: "/public/avatars/marco.jpg",
    storiesWritten: 10,
    likesGiven: 1002,
  },
  {
    id: "u-013",
    name: "Soojin Han",
    username: "MoonGazer",
    avatarUrl: "/public/avatars/soojin.jpg",
    storiesWritten: 6,
    likesGiven: 473,
  },
  {
    id: "u-014",
    name: "Kojo Adebayo",
    username: "RustWriter",
    avatarUrl: "/public/avatars/kojo.jpg",
    storiesWritten: 3,
    likesGiven: 231,
  },
  {
    id: "u-015",
    name: "Nikolai Petrov",
    username: "SwitchUser",
    avatarUrl: "/public/avatars/nikolai.jpg",
    storiesWritten: 14,
    likesGiven: 1560,
  },
  {
    id: "u-016",
    name: "Giulia Conte",
    username: "MidnightCook",
    avatarUrl: "/public/avatars/giulia.jpg",
    storiesWritten: 5,
    likesGiven: 412,
  },
  {
    id: "u-017",
    name: "Asha Leone",
    username: "CitySong",
    avatarUrl: "/public/avatars/asha.jpg",
    storiesWritten: 2,
    likesGiven: 207,
  },
  {
    id: "u-018",
    name: "Vera Ivanova",
    username: "SteppeWalker",
    avatarUrl: "/public/avatars/vera.jpg",
    storiesWritten: 9,
    likesGiven: 733,
  },
  {
    id: "u-001",
    name: "Diego Ballesteros",
    username: "Balls",
    avatarUrl: "/public/avatars/Diego.jpg",
    storiesWritten: 12,
    likesGiven: 1432,
  },
  {
    id: "u-002",
    name: "Maya Clarke",
    username: "GreyHarborFan",
    avatarUrl: "/public/avatars/maya.jpg",
    storiesWritten: 4,
    likesGiven: 298,
  },
  {
    id: "u-003",
    name: "Ravi Patel",
    username: "OrbitLover",
    avatarUrl: "/public/avatars/ravi.jpg",
    storiesWritten: 9,
    likesGiven: 764,
  },
  {
    id: "u-004",
    name: "Zoe Kim",
    username: "MoonWalker",
    avatarUrl: "/public/avatars/zoe.jpg",
    storiesWritten: 7,
    likesGiven: 512,
  },
  {
    id: "u-005",
    name: "Samir Ahmed",
    username: "TowerClimber",
    avatarUrl: "/public/avatars/samir.jpg",
    storiesWritten: 3,
    likesGiven: 221,
  },
  {
    id: "u-006",
    name: "Kei Ito",
    username: "NeonCity",
    avatarUrl: "/public/avatars/kei.jpg",
    storiesWritten: 6,
    likesGiven: 899,
  },
  {
    id: "u-007",
    name: "Daniela Cruz",
    username: "SaltyReader",
    avatarUrl: "/public/avatars/daniela.jpg",
    storiesWritten: 2,
    likesGiven: 145,
  },
  {
    id: "u-008",
    name: "Elena Novak",
    username: "GardenReader",
    avatarUrl: "/public/avatars/elena.jpg",
    storiesWritten: 5,
    likesGiven: 377,
  },
  {
    id: "u-009",
    name: "Tomas Rivera",
    username: "NeonWatcher",
    avatarUrl: "/public/avatars/tomas.jpg",
    storiesWritten: 11,
    likesGiven: 1204,
  },
  {
    id: "u-010",
    name: "Hanna Lindgren",
    username: "CartoFan",
    avatarUrl: "/public/avatars/hanna.jpg",
    storiesWritten: 1,
    likesGiven: 88,
  },
  {
    id: "u-011",
    name: "Leyla Demir",
    username: "HarborReader",
    avatarUrl: "/public/avatars/leyla.jpg",
    storiesWritten: 8,
    likesGiven: 654,
  },
  {
    id: "u-012",
    name: "Marco Ortega",
    username: "Skybound",
    avatarUrl: "/public/avatars/marco.jpg",
    storiesWritten: 10,
    likesGiven: 1002,
  },
  {
    id: "u-013",
    name: "Soojin Han",
    username: "MoonGazer",
    avatarUrl: "/public/avatars/soojin.jpg",
    storiesWritten: 6,
    likesGiven: 473,
  },
  {
    id: "u-014",
    name: "Kojo Adebayo",
    username: "RustWriter",
    avatarUrl: "/public/avatars/kojo.jpg",
    storiesWritten: 3,
    likesGiven: 231,
  },
  {
    id: "u-015",
    name: "Nikolai Petrov",
    username: "SwitchUser",
    avatarUrl: "/public/avatars/nikolai.jpg",
    storiesWritten: 14,
    likesGiven: 1560,
  },
  {
    id: "u-016",
    name: "Giulia Conte",
    username: "MidnightCook",
    avatarUrl: "/public/avatars/giulia.jpg",
    storiesWritten: 5,
    likesGiven: 412,
  },
  {
    id: "u-017",
    name: "Asha Leone",
    username: "CitySong",
    avatarUrl: "/public/avatars/asha.jpg",
    storiesWritten: 2,
    likesGiven: 207,
  },
  {
    id: "u-018",
    name: "Vera Ivanova",
    username: "SteppeWalker",
    avatarUrl: "/public/avatars/vera.jpg",
    storiesWritten: 9,
    likesGiven: 733,
  },
];

/* ---------------------------
   Genres (existing + popular)
   --------------------------- */

// Collect tags already present in sampleBooks
const tagsFromBooks = (() => {
  const seen = new Map(); // lowerCase => originalCased
  for (const b of sampleBooks) {
    for (const t of (b.tags || [])) {
      const key = String(t).toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, String(t).trim());
    }
  }
  return Array.from(seen.values());
})();

// ~30 popular genres to enrich the list
const extraPopularGenres = [
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Historical Fiction",
  "Literary Fiction",
  "Young Adult",
  "New Adult",
  "Dystopian",
  "Post-Apocalyptic",
  "Urban Fantasy",
  "Paranormal",
  "Magical Realism",
  "Adventure",
  "Crime",
  "Detective",
  "Psychological Thriller",
  "Cyberpunk",
  "Steampunk",
  "Space Opera",
  "Time Travel",
  "Contemporary",
  "Humor",
  "Family Saga",
  "Coming of Age",
  "Memoir",
  "Non-Fiction",
  "Biography",
  "Self-Help",
  "Poetry",
  "Short Stories",
  "Anthology",
];

// Merge & de-dupe while keeping original casing of first encounter
function dedupeKeepCasing(list) {
  const out = [];
  const seen = new Set();
  for (const g of list) {
    const key = String(g).toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(String(g).trim());
    }
  }
  return out;
}

export const allGenres = dedupeKeepCasing([...tagsFromBooks, ...extraPopularGenres]).sort((a, b) =>
  a.localeCompare(b)
);

// Count how often each genre/tag appears in sampleBooks
export function genreCounts() {
  const counts = new Map(); // genreLower => { name, count }
  for (const b of sampleBooks) {
    for (const t of (b.tags || [])) {
      const name = String(t).trim();
      const key = name.toLowerCase();
      const prev = counts.get(key)?.count || 0;
      counts.set(key, { name, count: prev + 1 });
    }
  }
  // Ensure every genre in allGenres exists in the map (at least count 0)
  for (const g of allGenres) {
    const key = g.toLowerCase();
    if (!counts.has(key)) counts.set(key, { name: g, count: 0 });
  }
  return Array.from(counts.values()).sort((a, b) =>
    b.count - a.count || a.name.localeCompare(b.name)
  );
}

/* ---------------------------
   Search helpers
   --------------------------- */

// searchData.js

function fold(s = "") {
  return String(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // remove accents
    .toLowerCase()
    .trim();
}
function tokens(q) {
  return fold(q).split(/\s+/).filter(Boolean);
}
function wordBoundaryMatcher(token) {
  // require token to start at a word boundary (or start of string)
  return new RegExp(`(?:^|\\b)${token}`, "i");
}
function anyFieldMatchesStrict(fields, qTokens) {
  // A result matches if ANY single field contains ALL tokens at word boundaries
  return fields.some((raw) => {
    const f = fold(raw);
    return qTokens.every((t) => wordBoundaryMatcher(t).test(f));
  });
}

export function searchBooks(query, limit = Infinity) {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return [];
  return sampleBooks
    .filter((b) =>
      anyFieldMatchesStrict([b.title, b.author, ...(b.tags || [])], qTokens)
    )
    .slice(0, limit);
}

export function searchUsers(query, limit = Infinity) {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return [];
  return usersDirectory
    .filter((u) => anyFieldMatchesStrict([u.name, u.username], qTokens))
    .slice(0, limit);
}

export function searchGenres(query, limit = Infinity) {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return genreCounts().slice(0, limit);
  return genreCounts()
    .filter((g) => anyFieldMatchesStrict([g.name], qTokens))
    .slice(0, limit);
}
