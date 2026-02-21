// src/importer/splitChapters.ts

export type ChapterDraft = {
  id: string;
  title: string;
  content: string;
};

export type SplitOptions = {
  /**
   * If you know the book title or author, pass them in to improve header/footer stripping.
   * Not required; algorithm works without it.
   */
  hintTitle?: string;
  hintAuthor?: string;

  /**
   * Controls false positives vs sensitivity.
   * Raise minWordsPerChapter to reduce "random" splits.
   */
  minWordsPerChapter?: number;

  /**
   * If no headings are detected, we fallback to chunking by structure.
   * This controls roughly how many fallback chapters we create.
   */
  maxFallbackChapters?: number;

  /**
   * Max words for fallback chapters (soft target).
   */
  fallbackTargetWords?: number;
};

/**
 * "Elite" splitting entry-point:
 * - Normalizes text
 * - Strips repeating headers/footers and page numbers
 * - Detects chapter markers (CHAPTER X, PART X, PROLOGUE, numeric-only headings)
 * - Splits into chapters and cleans each chapter
 */
export function splitIntoChapters(rawText: string, opts: SplitOptions = {}): ChapterDraft[] {
  const options = {
    hintTitle: opts.hintTitle ?? "",
    hintAuthor: opts.hintAuthor ?? "",
    minWordsPerChapter: clampInt(opts.minWordsPerChapter ?? 160, 60, 600),
    maxFallbackChapters: clampInt(opts.maxFallbackChapters ?? 12, 3, 40),
    fallbackTargetWords: clampInt(opts.fallbackTargetWords ?? 1800, 900, 4000),
  };

  const normalized = normalizeText(rawText);
  if (!normalized.trim()) {
    return [{ id: crypto.randomUUID(), title: "Chapter 1", content: "" }];
  }

  // Phase 1: line reconstruction and global cleanup
  const baseLines = normalized.split("\n").map((l) => l.replace(/[ \t]+/g, " ").trimEnd());

  // Phase 2: detect repeating header/footer lines across the entire document
  const cleanedLines = stripGlobalNoise(baseLines, {
    hintTitle: options.hintTitle,
    hintAuthor: options.hintAuthor,
  });

  // Phase 3: normalize paragraph spacing again
  const cleanedText = cleanedLines
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Phase 4: chapter marker detection
  const lines = cleanedText.split("\n");
  const markers = detectChapterMarkers(lines);

  // Phase 5: split by markers if we have good ones
  const chaptersFromMarkers = splitByMarkers(lines, markers, options.minWordsPerChapter);

  // If it looks good, return it
  if (chaptersFromMarkers.length >= 2) return finalize(chaptersFromMarkers);

  // Otherwise fallback: structure-based chunking (non-random)
  const fallback = fallbackSplit(cleanedText, options.maxFallbackChapters, options.fallbackTargetWords);
  return finalize(fallback);
}

/**
 * A convenient import helper (optional) that returns a ready /write project:
 * - Uses the splitter
 * - Builds default submission metadata
 */
export function importTextToProject(params: {
  text: string;
  fileName?: string;
  hintTitle?: string;
  hintAuthor?: string;
}): {
  submission: { title: string; author: string; dedication: string; coverFile: null; backCoverFile: null };
  chapters: { id: string; title: string; content: string }[];
} {
  const fileBase = (params.fileName ?? "").replace(/\.[^/.]+$/, "").trim();
  const title = (params.hintTitle?.trim() || fileBase || "Untitled").trim();
  const author = (params.hintAuthor?.trim() || "").trim();

  const chapters = splitIntoChapters(params.text, {
    hintTitle: params.hintTitle,
    hintAuthor: params.hintAuthor,
  });

  return {
    submission: {
      title,
      author,
      dedication: "",
      coverFile: null,
      backCoverFile: null,
    },
    chapters: chapters.map((c) => ({ id: crypto.randomUUID(), title: c.title, content: c.content })),
  };
}

/* =========================================
   Phase 0: Normalization
========================================= */

function normalizeText(t: string) {
  return (t ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* =========================================
   Phase 1/2: Strip headers, footers, page numbers, repeated noise
========================================= */

function stripGlobalNoise(lines: string[], hints: { hintTitle: string; hintAuthor: string }) {
  // We find short lines that repeat frequently; those are often headers/footers.
  // We also detect page-number-ish lines and “Page x” patterns.
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[•·]+/g, "")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^\p{L}\p{N}\s\-/:.]/gu, ""); // keep letters/numbers/basic punctuation

  const hintTitleKey = hints.hintTitle ? norm(hints.hintTitle) : "";
  const hintAuthorKey = hints.hintAuthor ? norm(hints.hintAuthor) : "";

  // Count occurrences of candidate short lines
  const freq = new Map<string, { count: number; example: string }>();

  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;

    // short-ish lines are more likely to be headers/footers
    if (t.length > 70) continue;

    const k = norm(t);
    if (!k) continue;

    const obj = freq.get(k);
    if (obj) obj.count += 1;
    else freq.set(k, { count: 1, example: t });
  }

  const totalLines = Math.max(1, lines.filter((x) => x.trim()).length);
  const repeatThreshold = Math.max(6, Math.floor(totalLines * 0.02)); // 2% of non-empty lines, min 6

  const repeating = new Set<string>();
  for (const [k, v] of freq.entries()) {
    if (v.count >= repeatThreshold) repeating.add(k);
  }

  // Additionally add hint title/author if provided
  if (hintTitleKey) repeating.add(hintTitleKey);
  if (hintAuthorKey) repeating.add(hintAuthorKey);

  const isPageNumberLike = (s: string) => {
    const t = s.trim();

    // pure number
    if (/^\d{1,5}$/.test(t)) return true;

    // "Page 12" / "page 12"
    if (/^page\s+\d{1,5}$/i.test(t)) return true;

    // "12/300" or "12 / 300"
    if (/^\d{1,5}\s*\/\s*\d{1,6}$/.test(t)) return true;

    return false;
  };

  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();

    if (!t) {
      out.push(""); // keep blanks (structure matters)
      continue;
    }

    const k = norm(t);

    // Strip repeating header/footer lines
    if (repeating.has(k)) continue;

    // Strip obvious page numbers, but only if they look isolated-ish
    // (single token line is the common extraction pattern)
    if (isPageNumberLike(t)) {
      const prev = (lines[i - 1] ?? "").trim();
      const next = (lines[i + 1] ?? "").trim();
      // If near blank boundary, it’s almost certainly footer/header
      if (!prev || !next) continue;
      // If neighbor is a repeating header/footer, strip it too
      if (repeating.has(norm(prev)) || repeating.has(norm(next))) continue;
      // If the number is large (>= 40), likely page number rather than chapter number
      const n = parseInt(t, 10);
      if (Number.isFinite(n) && n >= 40) continue;
      // Otherwise: keep it (could be legit “chapter 1” marker) — marker detection handles it.
    }

    out.push(raw);
  }

  // Compress ridiculous blank runs
  return out.join("\n").replace(/\n{4,}/g, "\n\n\n").split("\n");
}

/* =========================================
   Phase 4: Marker detection
========================================= */

type MarkerKind = "chapter" | "part" | "special" | "numberOnly";
type Marker = { lineIndex: number; title: string; kind: MarkerKind; score: number };

function detectChapterMarkers(lines: string[]): Marker[] {
  const markers: Marker[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = (lines[i] ?? "").trim();
    if (!raw) continue;

    // Headings are usually short
    if (raw.length > 90) continue;

    const s = normalizeHeading(raw);

    const special = parseSpecialHeading(s);
    if (special) {
      markers.push({
        lineIndex: i,
        title: special,
        kind: "special",
        score: scoreMarker(lines, i, "special"),
      });
      continue;
    }

    const chapter = parseChapterHeading(s);
    if (chapter) {
      markers.push({
        lineIndex: i,
        title: chapter,
        kind: "chapter",
        score: scoreMarker(lines, i, "chapter"),
      });
      continue;
    }

    const part = parsePartHeading(s);
    if (part) {
      markers.push({
        lineIndex: i,
        title: part,
        kind: "part",
        score: scoreMarker(lines, i, "part"),
      });
      continue;
    }

    const numberOnly = parseNumberOnlyHeading(s);
    if (numberOnly) {
      markers.push({
        lineIndex: i,
        title: numberOnly,
        kind: "numberOnly",
        score: scoreMarker(lines, i, "numberOnly"),
      });
      continue;
    }
  }

  // Merge two-line headings:
  // e.g. "CHAPTER 1" then "The Arrival" (subtitle) on the next line.
  const merged = mergeSubtitleLines(lines, markers);

  // Filter by score thresholds: numberOnly needs higher confidence
  const filtered = merged.filter((m) => {
    if (m.kind === "numberOnly") return m.score >= 0.82;
    if (m.kind === "special") return m.score >= 0.55;
    return m.score >= 0.60;
  });

  // Remove markers that are too close together (common PDF noise)
  return dedupeCloseMarkers(filtered, 2);
}

function normalizeHeading(s: string) {
  return s.replace(/\s+/g, " ").replace(/[•·]+/g, "").trim();
}

function parseSpecialHeading(s: string): string | null {
  const t = s.trim().replace(/[:.\-–—]+$/, "").trim().toLowerCase();
  const map: Record<string, string> = {
    prologue: "Prologue",
    epilogue: "Epilogue",
    foreword: "Foreword",
    afterword: "Afterword",
    preface: "Preface",
    introduction: "Introduction",
    acknowledgements: "Acknowledgements",
    acknowledgement: "Acknowledgements",
  };
  return map[t] ?? null;
}

function parseChapterHeading(s: string): string | null {
  // CHAPTER 1
  // Chapter One
  // CHAPTER I
  // CHAPTER 12: Title
  const m = s.match(/^(chapter)\s+(.+?)(?:\s*[:\-–—]\s*(.+))?$/i);
  if (!m) return null;

  const n = (m[2] ?? "").trim();
  if (!looksLikeChapterNumber(n)) return null;

  const rest = (m[3] ?? "").trim();
  const base = `Chapter ${normalizeChapterNumber(n)}`;
  return rest ? `${base}: ${rest}` : base;
}

function parsePartHeading(s: string): string | null {
  const m = s.match(/^(part)\s+(.+?)(?:\s*[:\-–—]\s*(.+))?$/i);
  if (!m) return null;

  const n = (m[2] ?? "").trim();
  if (!looksLikeChapterNumber(n)) return null;

  const rest = (m[3] ?? "").trim();
  const base = `Part ${normalizeChapterNumber(n)}`;
  return rest ? `${base}: ${rest}` : base;
}

function parseNumberOnlyHeading(s: string): string | null {
  // "1" / "2" / "10"
  const t = s.trim();
  if (!/^\d{1,3}$/.test(t)) return null;

  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n <= 0) return null;

  // Reject large “chapters” — almost always page numbers
  if (n >= 60) return null;

  return `Chapter ${n}`;
}

function looksLikeChapterNumber(n: string) {
  const t = n.trim().toLowerCase();

  // numeric
  if (/^\d{1,3}$/.test(t)) return true;

  // roman
  if (/^[ivxlcdm]{1,10}$/.test(t)) return true;

  // word numbers
  return NUMBER_WORDS.has(t);
}

function normalizeChapterNumber(n: string) {
  const t = n.trim();

  if (/^\d{1,3}$/.test(t)) return String(parseInt(t, 10));
  if (/^[ivxlcdm]{1,10}$/i.test(t)) return t.toUpperCase();

  const lower = t.toLowerCase();
  if (NUMBER_WORDS.has(lower)) return lower[0].toUpperCase() + lower.slice(1);

  return t;
}

const NUMBER_WORDS = new Set([
  "one","two","three","four","five","six","seven","eight","nine","ten",
  "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty",
]);

function scoreMarker(lines: string[], idx: number, kind: MarkerKind): number {
  const here = (lines[idx] ?? "").trim();
  const prev = (lines[idx - 1] ?? "").trim();
  const next = (lines[idx + 1] ?? "").trim();

  const prevBlank = !prev;
  const nextBlank = !next;

  const nextNonEmptyIdx = findNextNonEmpty(lines, idx + 1);
  const nextNonEmpty = nextNonEmptyIdx >= 0 ? (lines[nextNonEmptyIdx] ?? "").trim() : "";

  let score = 0;

  // Base weight
  if (kind === "chapter" || kind === "part") score += 0.45;
  else if (kind === "special") score += 0.40;
  else score += 0.25; // numberOnly

  // Surrounding whitespace patterns
  if (prevBlank) score += 0.18;
  if (nextBlank) score += 0.18;

  // Heading-like shape
  if (here.length <= 28) score += 0.08;
  else if (here.length <= 60) score += 0.04;

  // Penalize sentence-y endings for numeric-only headings
  if (kind === "numberOnly") {
    if (/[a-z0-9,;:)"”'’]$/i.test((lines[idx - 1] ?? "").trim()) && !prevBlank) score -= 0.25;
    // If followed immediately by prose on the next non-empty line, that’s good.
    if (looksLikeProseStart(nextNonEmpty)) score += 0.15;
  } else {
    // For explicit headings, require that prose appears soon
    if (looksLikeProseStart(nextNonEmpty)) score += 0.10;
  }

  // If marker is followed by "TO NEXT CHAPTER" or similar, that is NOT a chapter boundary.
  // (Some ebooks embed these strings inside paragraphs.)
  if (/to next chapter/i.test(here)) score -= 0.35;
  if (/to next chapter/i.test(nextNonEmpty)) score -= 0.20;

  return clamp01(score);
}

function looksLikeProseStart(s: string) {
  const t = s.trim();
  if (!t) return false;
  // prose often begins with a letter or quote
  return /^[A-Za-z"“'‘(\[]/.test(t);
}

function findNextNonEmpty(lines: string[], start: number) {
  for (let i = start; i < lines.length; i++) {
    if ((lines[i] ?? "").trim()) return i;
  }
  return -1;
}

function mergeSubtitleLines(lines: string[], markers: Marker[]) {
  const out: Marker[] = [];
  const byIdx = new Map<number, Marker>();
  for (const m of markers) byIdx.set(m.lineIndex, m);

  for (const m of markers.sort((a, b) => a.lineIndex - b.lineIndex)) {
    if (out.length === 0) {
      out.push(m);
      continue;
    }

    const prev = out[out.length - 1];
    if (m.lineIndex === prev.lineIndex) continue;

    // If previous is chapter/part and next line is short subtitle (not prose)
    if ((prev.kind === "chapter" || prev.kind === "part") && m.lineIndex === prev.lineIndex + 1) {
      const subtitle = (lines[m.lineIndex] ?? "").trim();
      if (subtitle && subtitle.length <= 60 && !looksLikeProseStart(subtitle) && !/:/.test(prev.title)) {
        prev.title = `${prev.title}: ${subtitle}`;
        prev.score = Math.max(prev.score, m.score);
        continue;
      }
    }

    out.push(m);
  }

  return out;
}

function dedupeCloseMarkers(markers: Marker[], distance: number) {
  if (markers.length <= 1) return markers;
  const sorted = markers.slice().sort((a, b) => a.lineIndex - b.lineIndex);

  const out: Marker[] = [];
  for (const m of sorted) {
    const last = out[out.length - 1];
    if (!last) {
      out.push(m);
      continue;
    }
    if (m.lineIndex - last.lineIndex <= distance) {
      // keep the stronger marker
      if (m.score > last.score) out[out.length - 1] = m;
      continue;
    }
    out.push(m);
  }
  return out;
}

/* =========================================
   Phase 5: Splitting
========================================= */

function splitByMarkers(lines: string[], markers: Marker[], minWordsPerChapter: number): ChapterDraft[] {
  if (markers.length === 0) return [];

  const sorted = markers.slice().sort((a, b) => a.lineIndex - b.lineIndex);

  // Guard: If markers are mostly numberOnly but not sequential-ish, it’s likely noise.
  if (mostlyNumberOnly(sorted) && !seemsSequentialNumbers(sorted)) {
    return [];
  }

  const segments: { title: string; content: string }[] = [];

  // Optional preface content before first marker (only if meaningful)
  const first = sorted[0].lineIndex;
  if (first > 0) {
    const pre = lines.slice(0, first).join("\n").trim();
    if (countWords(pre) >= Math.max(80, Math.floor(minWordsPerChapter * 0.5))) {
      segments.push({ title: "Preface", content: pre });
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i].lineIndex;
    const end = i + 1 < sorted.length ? sorted[i + 1].lineIndex : lines.length;

    // content starts after the marker line
    const content = lines.slice(start + 1, end).join("\n").trim();
    const cleaned = cleanChapterBody(content);

    const wc = countWords(cleaned);
    const kind = sorted[i].kind;

    const minWords = kind === "special" ? Math.floor(minWordsPerChapter * 0.6) : minWordsPerChapter;

    // Reject tiny chapters: merge into previous if possible
    if (wc < minWords) {
      if (segments.length > 0 && cleaned) {
        segments[segments.length - 1].content = `${segments[segments.length - 1].content}\n\n${cleaned}`.trim();
      }
      continue;
    }

    segments.push({ title: sorted[i].title, content: cleaned });
  }

  if (segments.length < 2) return [];

  return segments.map((s) => ({
    id: crypto.randomUUID(),
    title: s.title.trim() || "Chapter",
    content: normalizeText(s.content),
  }));
}

function cleanChapterBody(content: string) {
  // Remove stray “to next chapter” artifacts if they appear as standalone lines
  const lines = content.split("\n").map((l) => l.trimEnd());
  const out: string[] = [];
  for (const l of lines) {
    const t = l.trim();
    if (/^to next chapter$/i.test(t)) continue;
    out.push(l);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function mostlyNumberOnly(markers: Marker[]) {
  const n = markers.length;
  if (n === 0) return false;
  const count = markers.filter((m) => m.kind === "numberOnly").length;
  return count / n >= 0.7;
}

function seemsSequentialNumbers(markers: Marker[]) {
  // If numberOnly markers are chapters, they usually increase gradually.
  const nums = markers
    .filter((m) => m.kind === "numberOnly")
    .map((m) => parseInt(m.title.replace(/[^\d]/g, ""), 10))
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);

  if (nums.length < 3) return true;

  let goodSteps = 0;
  let totalSteps = 0;

  for (let i = 1; i < nums.length; i++) {
    const d = nums[i] - nums[i - 1];
    totalSteps++;
    if (d === 1 || d === 0) goodSteps++;
  }

  // allow occasional weirdness, but mostly sequential
  return goodSteps / totalSteps >= 0.65;
}

/* =========================================
   Fallback: structure-based splitting (not random)
========================================= */

function fallbackSplit(text: string, maxChapters: number, targetWords: number): ChapterDraft[] {
  // Split by paragraphs (double newline)
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const totalWords = countWords(text);
  const ideal = clampInt(Math.floor(totalWords / maxChapters), Math.floor(targetWords * 0.7), Math.floor(targetWords * 1.2));

  const out: ChapterDraft[] = [];
  let buf: string[] = [];
  let bufWords = 0;

  const push = () => {
    const content = buf.join("\n\n").trim();
    if (!content) return;
    out.push({
      id: crypto.randomUUID(),
      title: `Chapter ${out.length + 1}`,
      content,
    });
    buf = [];
    bufWords = 0;
  };

  for (const p of paras) {
    const w = countWords(p);

    // Prefer splitting at a strong boundary (end of section) rather than strict word count
    const endsStrong = /[.?!]"?\s*$/.test(p) || /\*\*\*\s*$/.test(p);

    if (bufWords >= ideal && endsStrong) {
      push();
    }

    buf.push(p);
    bufWords += w;

    if (bufWords >= ideal * 1.35) push();
  }
  push();

  // Never return fewer than 1
  if (out.length === 0) {
    return [{ id: crypto.randomUUID(), title: "Chapter 1", content: text.trim() }];
  }

  return out;
}

/* =========================================
   Finalize
========================================= */

function finalize(chapters: ChapterDraft[]) {
  // Final pass: remove empties, normalize title, and normalize content.
  const cleaned = chapters
    .map((c, i) => ({
      ...c,
      title: (c.title || `Chapter ${i + 1}`).trim(),
      content: normalizeText(c.content),
    }))
    .filter((c) => c.content.trim().length > 0);

  // If somehow everything got stripped, keep whole thing as 1 chapter
  if (cleaned.length === 0) {
    return [{ id: crypto.randomUUID(), title: "Chapter 1", content: "" }];
  }
  return cleaned;
}

/* =========================================
   Utils
========================================= */

function countWords(s: string) {
  const t = (s || "").trim();
  if (!t) return 0;
  const m = t.match(/\S+/g);
  return m ? m.length : 0;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function clampInt(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}