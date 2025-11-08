// src/searchData.js
// Lightweight search helpers + dummy users + unified genres list
// Usage:
//   import { searchBooks, searchUsers, searchGenres, quickSearch, allGenres, getGenreDescription, genreCounts } from "@/searchData";

import { sampleBooks } from "./booksData";

/* ---------------------------
   Fake user directory (deduped)
   --------------------------- */
export const usersDirectory = [
  { id: "u-001", name: "Diego Ballesteros", username: "Balls", avatarUrl: "/public/avatars/Diego.jpg", storiesWritten: 12, likesGiven: 1432 },
  { id: "u-002", name: "Maya Clarke", username: "GreyHarborFan", avatarUrl: "/public/avatars/maya.jpg", storiesWritten: 4, likesGiven: 298 },
  { id: "u-003", name: "Ravi Patel", username: "OrbitLover", avatarUrl: "/public/avatars/ravi.jpg", storiesWritten: 9, likesGiven: 764 },
  { id: "u-004", name: "Zoe Kim", username: "MoonWalker", avatarUrl: "/public/avatars/zoe.jpg", storiesWritten: 7, likesGiven: 512 },
  { id: "u-005", name: "Samir Ahmed", username: "TowerClimber", avatarUrl: "/public/avatars/samir.jpg", storiesWritten: 3, likesGiven: 221 },
  { id: "u-006", name: "Kei Ito", username: "NeonCity", avatarUrl: "/public/avatars/kei.jpg", storiesWritten: 6, likesGiven: 899 },
  { id: "u-007", name: "Daniela Cruz", username: "SaltyReader", avatarUrl: "/public/avatars/daniela.jpg", storiesWritten: 2, likesGiven: 145 },
  { id: "u-008", name: "Elena Novak", username: "GardenReader", avatarUrl: "/public/avatars/elena.jpg", storiesWritten: 5, likesGiven: 377 },
  { id: "u-009", name: "Tomas Rivera", username: "NeonWatcher", avatarUrl: "/public/avatars/tomas.jpg", storiesWritten: 11, likesGiven: 1204 },
  { id: "u-010", name: "Hanna Lindgren", username: "CartoFan", avatarUrl: "/public/avatars/hanna.jpg", storiesWritten: 1, likesGiven: 88 },
  { id: "u-011", name: "Leyla Demir", username: "HarborReader", avatarUrl: "/public/avatars/leyla.jpg", storiesWritten: 8, likesGiven: 654 },
  { id: "u-012", name: "Marco Ortega", username: "Skybound", avatarUrl: "/public/avatars/marco.jpg", storiesWritten: 10, likesGiven: 1002 },
  { id: "u-013", name: "Soojin Han", username: "MoonGazer", avatarUrl: "/public/avatars/soojin.jpg", storiesWritten: 6, likesGiven: 473 },
  { id: "u-014", name: "Kojo Adebayo", username: "RustWriter", avatarUrl: "/public/avatars/kojo.jpg", storiesWritten: 3, likesGiven: 231 },
  { id: "u-015", name: "Nikolai Petrov", username: "SwitchUser", avatarUrl: "/public/avatars/nikolai.jpg", storiesWritten: 14, likesGiven: 1560 },
  { id: "u-016", name: "Giulia Conte", username: "MidnightCook", avatarUrl: "/public/avatars/giulia.jpg", storiesWritten: 5, likesGiven: 412 },
  { id: "u-017", name: "Asha Leone", username: "CitySong", avatarUrl: "/public/avatars/asha.jpg", storiesWritten: 2, likesGiven: 207 },
  { id: "u-018", name: "Vera Ivanova", username: "SteppeWalker", avatarUrl: "/public/avatars/vera.jpg", storiesWritten: 9, likesGiven: 733 },
];

/* ---------------------------
   Canonical genre catalog
   (covers all tags used in sampleBooks)
   --------------------------- */
// Alphabetized, canonical genre catalog
export const genreCatalog = [
  { name: "Adventure", aliases: [], description: "Journeys and expeditions—travel, discovery, daring escapes, and big set pieces." },
  { name: "Anthology", aliases: [], description: "Collections of shorter works—often themed—by one or multiple authors." },
  { name: "Balls", aliases: [], description: "Playful, inside-joke tag from the sample dataset (treat as humor/experimental)." },
  { name: "Big Juicy Balls", aliases: [], description: "Even more playful variant of the above; use as a tongue-in-cheek humor tag." },
  { name: "Biography", aliases: ["Bio"], description: "A person’s life story told factually by another author." },
  { name: "Bruh", aliases: [], description: "Meme/ironic catch-all tag in the sample data; use for offbeat/humor filtering." },
  { name: "Coming of Age", aliases: ["Coming-of-Age"], description: "Growth arcs from youth to maturity—identity, firsts, and formative trials." },
  { name: "Contemporary", aliases: [], description: "Set in the present day with modern settings, culture, and concerns." },
  { name: "Crime", aliases: [], description: "Offenses and their fallout—heists, investigations, courts, and underworlds." },
  { name: "Cyberpunk", aliases: [], description: "High-tech/low-life: neon cities, hackers, megacorps, cyberspace, body mods." },
  { name: "Detective", aliases: [], description: "Case-driven investigations led by sleuths—private eyes, cops, or amateurs." },
  { name: "Drama", aliases: [], description: "Character-focused fiction about relationships, conflict, and personal stakes." },
  { name: "Dystopian", aliases: [], description: "Oppressive societies—surveillance, scarcity, control, and resistance." },
  { name: "Fantasy", aliases: [], description: "Magic, myth, or the supernatural—secondary worlds, quests, creatures, wonder." },
  { name: "Family Saga", aliases: [], description: "Multi-generation family stories—legacy, conflict, and changing times." },
  { name: "Historical Fiction", aliases: ["Hist Fic"], description: "Past eras rendered with researched detail—real events and imagined lives." },
  { name: "Horror", aliases: [], description: "Fiction designed to unsettle or terrify—monsters, hauntings, and dread." },
  { name: "Humor", aliases: ["Humour"], description: "Comedic tone and situations—witty, satirical, or absurd." },
  { name: "Literary", aliases: ["Literary Fiction", "Lit Fic"], description: "Style-forward, theme-driven fiction emphasizing prose, motif, and character." },
  { name: "Magical Realism", aliases: [], description: "Everyday reality infused with quiet, unquestioned magic; symbolic and lyrical." },
  { name: "Memoir", aliases: [], description: "A slice of the author’s own life—personal reflection and lived experience." },
  { name: "Music", aliases: [], description: "Stories centered on bands, records, scenes, or music culture as core setting." },
  { name: "Mystery", aliases: [], description: "Whodunits and investigations where clues, red herrings, and reveals drive the plot." },
  { name: "New Adult", aliases: ["NA"], description: "Early-adult life transitions—college, first jobs, independence, and intimacy." },
  { name: "Non-Fiction", aliases: ["Nonfiction", "Non Fiction"], description: "Fact-based prose—history, essays, reportage, science, self-reflective works." },
  { name: "Paranormal", aliases: [], description: "Supernatural elements—ghosts, psychics, cryptids—often crossing into romance or mystery." },
  { name: "Philosophy", aliases: [], description: "Ideas, ethics, and meaning—argumentative or narrative explorations of thought." },
  { name: "Poetry", aliases: [], description: "Verse forms—lyric, narrative, experimental—focused on rhythm, sound, and image." },
  { name: "Post-Apocalyptic", aliases: ["Postapocalyptic"], description: "After the fall—survival and rebuilding in the wake of catastrophe." },
  { name: "Psychological Thriller", aliases: [], description: "Mind games and unstable realities—twists, obsession, and unreliable narrators." },
  { name: "Romance", aliases: [], description: "Love-centric narratives with emotional arcs and HEA/HFN beats." },
  { name: "Science Fiction", aliases: ["Sci-Fi", "Sci Fi", "SF"], description: "Speculative stories driven by science/technology—space, AI, time, futures." },
  { name: "Self-Help", aliases: ["Self Help"], description: "Guidance for personal growth, habits, health, work, and relationships." },
  { name: "Short Stories", aliases: ["Short Story", "Shorts"], description: "Brief, self-contained narratives—often published in collections or mags." },
  { name: "Space Opera", aliases: [], description: "Big-canvas SF—galactic politics, fleets, empires, found families, destiny." },
  { name: "Steampunk", aliases: [], description: "Retro-futurism—steam power, gears, Victorian aesthetics, alt-history tech." },
  { name: "Thriller", aliases: [], description: "High-tension, high-stakes plots—danger, chases, conspiracies, page-turners." },
  { name: "Time Travel", aliases: [], description: "Chronological leaps—paradoxes, loops, timelines, and cause-and-effect puzzles." },
  { name: "Urban Fantasy", aliases: [], description: "Magic in modern cities—hidden societies, monsters next door, nocturnal quests." },
  { name: "Young Adult", aliases: ["YA"], description: "Coming-of-age tales with teen/young-adult protagonists and high emotion." },
];


/* Derived list of names for carousels, etc. */
export const allGenres = genreCatalog.map((g) => g.name);

/* Helpers to canonicalize & describe */
function canonicalizeGenre(tag) {
  const t = String(tag).trim().toLowerCase();
  const hit = genreCatalog.find(
    (g) => g.name.toLowerCase() === t || (g.aliases && g.aliases.some((a) => a.toLowerCase() === t))
  );
  return hit ? hit.name : String(tag).trim();
}
export function getGenreDescription(name) {
  const n = canonicalizeGenre(name);
  return genreCatalog.find((g) => g.name === n)?.description;
}

/* ---------------------------
   Genre counts (canonicalized)
   --------------------------- */
export function genreCounts() {
  const counts = new Map(); // name => { name, count }
  for (const b of sampleBooks) {
    for (const t of b.tags || []) {
      const name = canonicalizeGenre(t);
      const prev = counts.get(name)?.count || 0;
      counts.set(name, { name, count: prev + 1 });
    }
  }
  // Ensure every catalog genre appears at least with 0
  for (const g of genreCatalog) {
    if (!counts.has(g.name)) counts.set(g.name, { name: g.name, count: 0 });
  }
  return Array.from(counts.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

/* ---------------------------
   Search helpers
   --------------------------- */
function fold(s = "") {
  return String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
function tokens(q) {
  return fold(q).split(/\s+/).filter(Boolean);
}
function wordBoundaryMatcher(token) {
  return new RegExp(`(?:^|\\b)${token}`, "i");
}
function anyFieldMatchesStrict(fields, qTokens) {
  return fields.some((raw) => {
    const f = fold(raw);
    return qTokens.every((t) => wordBoundaryMatcher(t).test(f));
  });
}

/* Books & Users search (unchanged logic) */
export function searchBooks(query, limit = Infinity) {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return [];
  return sampleBooks
    .filter((b) => anyFieldMatchesStrict([b.title, b.author, ...(b.tags || [])], qTokens))
    .slice(0, limit);
}
export function searchUsers(query, limit = Infinity) {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return [];
  return usersDirectory
    .filter((u) => anyFieldMatchesStrict([u.name, u.username], qTokens))
    .slice(0, limit);
}

/* Genres search using canonical catalog */
export function searchGenres(query, limit = Infinity) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return genreCounts().slice(0, limit);

  const names = genreCatalog
    .filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.aliases && g.aliases.some((a) => a.toLowerCase().includes(q))) ||
        (g.description && g.description.toLowerCase().includes(q))
    )
    .map((g) => g.name);

  const set = new Set(names.map((n) => n.toLowerCase()));
  return genreCounts()
    .filter((entry) => set.has(entry.name.toLowerCase()))
    .slice(0, limit);
}

/* Optional: quickSearch mux */
export function quickSearch(query, limitPerType = 8) {
  return {
    books: searchBooks(query, limitPerType),
    users: searchUsers(query, limitPerType),
    genres: searchGenres(query, limitPerType),
  };
}
