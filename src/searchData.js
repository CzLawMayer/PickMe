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
  { name: "Cat-and-Mouse", aliases: ["Manhunt", "Chase"], description: "Hunter vs hunted with tight POV switches, traps, and escalating pursuit.", fontKey: "BLACKOPS", icon: "track_changes" },
  { name: "Cold Case", aliases: ["Unsolved", "Reopened Case"], description: "Old crimes revived with new evidence, old wounds, and long-delayed justice.", fontKey: "DMSERIF", icon: "history" },
  { name: "Conspiracy Thriller", aliases: ["Conspiracy", "Cover-Up"], description: "Hidden networks and big secrets where one clue becomes a web of lies.", fontKey: "BEBAS", icon: "travel_explore" },
  { name: "Corporate Thriller", aliases: ["Business Thriller", "Corporate Espionage"], description: "Money and power plots involving cover-ups, deals, and boardroom warfare.", fontKey: "RUBIKMONO", icon: "apartment" },
  { name: "Cozy Mystery", aliases: ["Cozy"], description: "Low-gore, high-charm sleuthing with small towns, quirky casts, and comfort reads.", fontKey: "ABRIL", icon: "coffee" },
  { name: "Crime", aliases: ["Crime Fiction"], description: "Criminal acts and consequences covering cops, courts, gangs, cons, and the underworld.", fontKey: "TEKO", icon: "gavel" },
  { name: "Cyber Thriller", aliases: ["Hacking Thriller", "Cybercrime"], description: "Digital danger with breaches, blackmail, surveillance, and online manhunts.", fontKey: "RUBIKMONO", icon: "memory" },
  { name: "Detective", aliases: ["Detective Mystery", "Sleuth"], description: "Case-led investigations by a detective, PI, or sleuth following leads and clues.", fontKey: "DMSERIF", icon: "search" },
  { name: "Domestic Thriller", aliases: ["Domestic Suspense"], description: "Danger at home involving relationships, families, and secrets behind closed doors.", fontKey: "BEBAS", icon: "home" },
  { name: "Gothic Mystery", aliases: ["Gothic", "Dark Gothic"], description: "Elegant dread with old houses, family curses, and atmosphere-heavy secrets.", fontKey: "CINZEL", icon: "castle" },
  { name: "Hardboiled", aliases: ["Hard-Boiled"], description: "Tough, cynical crime stories with violence, grit, and unsentimental heroes.", fontKey: "BLACKOPS", icon: "local_police" },
  { name: "Heist", aliases: ["Caper", "Robbery"], description: "Planning, tension, and execution with cons, crews, and high-risk scores.", fontKey: "TEKO", icon: "savings" },
  { name: "Historical Mystery", aliases: ["Period Mystery"], description: "Investigations set in the past with rich era detail and old-world intrigue.", fontKey: "CINZEL", icon: "hourglass_empty" },
  { name: "International Crime", aliases: ["Global Crime", "International Thriller"], description: "Cross-border cases involving cartels, trafficking, agencies, and worldwide stakes.", fontKey: "DMSERIF", icon: "public" },
  { name: "Kidnapping", aliases: ["Abduction", "Hostage"], description: "Time pressure and high peril involving rescues, negotiations, and survival decisions.", fontKey: "BLACKOPS", icon: "person_off" },
  { name: "Legal Thriller", aliases: ["Courtroom Thriller", "Legal"], description: "Trials, investigations, and power plays where the law is the battlefield.", fontKey: "BEBAS", icon: "balance" },
  { name: "Locked-Room Mystery", aliases: ["Closed Circle", "Impossible Crime"], description: "A crime that seems impossible, featuring sealed rooms, perfect alibis, and clever solutions.", fontKey: "ABRIL", icon: "lock" },
  { name: "Medical Thriller", aliases: ["Bio-Thriller", "Hospital Thriller"], description: "Medicine meets menace with outbreaks, ethics, and lethal secrets in healthcare.", fontKey: "RUBIKMONO", icon: "vaccines" },
  { name: "Missing Person", aliases: ["Disappearance", "Cold Trail"], description: "Vanished people and buried truths where searches uncover bigger secrets.", fontKey: "DMSERIF", icon: "person_search" },

  // changed to avoid same font as previous (no consecutive duplicates)
  { name: "Mystery", aliases: ["Murder Mystery", "Mystery Fiction"], description: "Clue-driven stories built around a central question of who did it, why, and how.", fontKey: "ABRIL", icon: "help" },

  { name: "Nordic Noir", aliases: ["Scandi Noir", "Scandinavian Noir"], description: "Bleak landscapes and social realism featuring cold crimes and colder truths.", fontKey: "CINZEL", icon: "ac_unit" },
  { name: "Noir", aliases: ["Neo-Noir"], description: "Moody, morally grey crime with fatal choices, sharp dialogue, and dark atmospheres.", fontKey: "UNIFRAKTUR", icon: "nightlight" },

  // changed to avoid same font as previous (no consecutive duplicates)
  { name: "Occult / Cult", aliases: ["Cult Thriller", "Occult"], description: "Rituals and shadow groups with creeping fear, hidden control, and belief-driven danger.", fontKey: "CINZEL", icon: "auto_awesome" },

  { name: "Police Procedural", aliases: ["Procedural", "Police"], description: "Realistic investigations featuring teams, evidence, interviews, and methodical casework.", fontKey: "TEKO", icon: "badge" },
  { name: "Political Thriller", aliases: ["Political Suspense"], description: "Power, corruption, and state-level danger involving elections, coups, and shadow deals.", fontKey: "BLACKOPS", icon: "account_balance" },
  { name: "Private Investigator", aliases: ["PI", "Private Eye"], description: "Gritty, personal cases solved outside the system with street-level mysteries and secrets.", fontKey: "DMSERIF", icon: "fingerprint" },
  { name: "Psychological Thriller", aliases: ["Mind Games", "Unreliable Narrator"], description: "Obsession and manipulation with twisty mental traps where reality is never stable.", fontKey: "BEBAS", icon: "psychology" },
  { name: "Revenge Thriller", aliases: ["Vengeance", "Payback"], description: "Retribution plots where justice is pursued outside the rules, often at a cost.", fontKey: "BLACKOPS", icon: "bolt" },
  { name: "Serial Killer", aliases: ["Killer Thriller"], description: "Predators, patterns, and profiling with dark stakes and relentless urgency.", fontKey: "BEBAS", icon: "dangerous" },
  { name: "Spy / Espionage", aliases: ["Espionage", "Spy Thriller"], description: "Moles, tradecraft, and secrets involving double agents and intelligence games.", fontKey: "BLACKOPS", icon: "visibility_off" },
  { name: "Supernatural Mystery", aliases: ["Paranormal Mystery"], description: "Investigations with uncanny elements such as ghosts, curses, and impossible clues.", fontKey: "CINZEL", icon: "dark_mode" },
  { name: "Survival Thriller", aliases: ["Survival", "Man vs Nature"], description: "Extreme situations focused on escape, endurance, and life-or-death problem solving.", fontKey: "BEBAS", icon: "hiking" },
  { name: "Suspense", aliases: ["Suspense Fiction"], description: "Tension-first storytelling with slow dread, looming threat, and nail-biting uncertainty.", fontKey: "DMSERIF", icon: "hourglass_top" },
  { name: "Tech Thriller", aliases: ["Techno-Thriller", "Science Thriller"], description: "High-stakes threats driven by technology, labs, weapons, systems, and breakthroughs.", fontKey: "RUBIKMONO", icon: "precision_manufacturing" },
  { name: "Thriller", aliases: ["Suspense Thriller"], description: "High-stakes, high-tension page-turners where danger escalates fast.", fontKey: "BEBAS", icon: "warning" },
  { name: "True Crime Inspired", aliases: ["Based on True Crime"], description: "Fiction echoing real cases with procedural detail, realism, and chilling plausibility.", fontKey: "TEKO", icon: "fact_check" },
  { name: "Whodunit", aliases: ["Who-Done-It"], description: "Classic puzzle mystery with suspects, red herrings, and a final reveal.", fontKey: "ABRIL", icon: "quiz" },

];


/* Derived list of names for carousels, etc. */
export const allGenres = genreCatalog.map((g) => g.name);

/* Helpers to canonicalize & describe */
function canonicalizeGenre(tag) {
  const t = String(tag).trim().toLowerCase();
  const hit = genreCatalog.find(
    (g) =>
      g.name.toLowerCase() === t ||
      (g.aliases && g.aliases.some((a) => a.toLowerCase() === t))
  );
  return hit ? hit.name : String(tag).trim();
}

export function getGenreDescription(name) {
  const n = canonicalizeGenre(name);
  return genreCatalog.find((g) => g.name === n)?.description;
}

export function getGenreIcon(name) {
  const n = canonicalizeGenre(name);
  return genreCatalog.find((g) => g.name === n)?.icon;
}

export function getGenreFontKey(name) {
  const n = canonicalizeGenre(name);
  return genreCatalog.find((g) => g.name === n)?.fontKey;
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
