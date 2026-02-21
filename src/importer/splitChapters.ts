// src/importer/splitChapters.ts
export type ChapterDraft = {
  id: string;
  title: string;
  content: string;
};

type Options = {
  fileName?: string;
  maxFallbackChapters?: number;
};

/**
 * Professional splitting strategy:
 * 1) Prefer explicit headings ("Chapter 1", "CHAPTER I", "Part One", etc.)
 * 2) If not enough headings found, fall back to chunking by length
 * 3) Always return something usable + editable in preview
 */
export function splitIntoChapters(text: string, opts: Options = {}): ChapterDraft[] {
  const cleaned = (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!cleaned) {
    return [
      { id: crypto.randomUUID(), title: "Chapter 1", content: "" }
    ];
  }

  const lines = cleaned.split("\n");
  const markers = detectChapterMarkers(lines);

  // If we found enough markers, use them
  if (markers.length >= 2) {
    const out: ChapterDraft[] = [];
    for (let i = 0; i < markers.length; i++) {
      const cur = markers[i];
      const next = markers[i + 1];
      const start = cur.lineIndex + 1;
      const end = next ? next.lineIndex : lines.length;

      const content = lines.slice(start, end).join("\n").trim();
      out.push({
        id: crypto.randomUUID(),
        title: cur.title,
        content,
      });
    }

    // Filter empty chapters but keep at least 1
    const nonEmpty = out.filter((c) => c.content.trim().length > 0);
    return nonEmpty.length > 0 ? nonEmpty : out;
  }

  // Otherwise: fallback chunking
  return fallbackChunking(cleaned, opts.maxFallbackChapters ?? 12);
}

function detectChapterMarkers(lines: string[]) {
  const markers: { lineIndex: number; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const s = raw.trim();
    if (!s) continue;

    // Heuristics:
    // - short lines
    // - surrounded by blank lines often
    // - matches common chapter patterns
    if (s.length > 70) continue;

    const prevBlank = i === 0 ? true : !lines[i - 1].trim();
    const nextBlank = i === lines.length - 1 ? true : !lines[i + 1].trim();

    const looksLikeHeading =
      isChapterHeading(s) ||
      isPartHeading(s) ||
      isAllCapsHeading(s);

    if (looksLikeHeading && (prevBlank || nextBlank)) {
      markers.push({ lineIndex: i, title: normalizeHeading(s) });
    }
  }

  // If the first marker is very late, consider prepending an intro chapter
  if (markers.length > 0 && markers[0].lineIndex > 20) {
    markers.unshift({ lineIndex: -1, title: "Prologue" });
  }

  // Deduplicate near-duplicates
  return squashCloseMarkers(markers);
}

function squashCloseMarkers(m: { lineIndex: number; title: string }[]) {
  const out: { lineIndex: number; title: string }[] = [];
  for (const mk of m) {
    const last = out[out.length - 1];
    if (!last) {
      out.push(mk);
      continue;
    }
    // if markers within 2 lines, keep the earlier one
    if (mk.lineIndex - last.lineIndex <= 2) continue;
    out.push(mk);
  }
  return out;
}

function isChapterHeading(s: string) {
  // Chapter 1 / CHAPTER I / Chapter One
  return /^chapter\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(s);
}

function isPartHeading(s: string) {
  // Part One / PART I
  return /^part\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(s);
}

function isAllCapsHeading(s: string) {
  // Often PDFs have headings like "THE BEGINNING"
  // keep it conservative: at least 6 chars, mostly letters/spaces, all caps
  if (s.length < 6) return false;
  if (!/^[A-Z0-9\s:'"’-]+$/.test(s)) return false;
  // avoid lines that look like normal sentences
  if (/[a-z]/.test(s)) return false;
  return true;
}

function normalizeHeading(s: string) {
  // Keep original casing for mixed-case headings, but trim
  return s.trim();
}

function fallbackChunking(text: string, maxChapters: number) {
  const targetChars = Math.max(3500, Math.min(9000, Math.floor(text.length / Math.max(1, maxChapters))));
  const chunks: ChapterDraft[] = [];

  let cursor = 0;
  let n = 1;

  while (cursor < text.length && chunks.length < maxChapters) {
    let end = Math.min(text.length, cursor + targetChars);

    // Try to break at a paragraph boundary
    const slice = text.slice(cursor, end);
    const lastBreak = Math.max(
      slice.lastIndexOf("\n\n"),
      slice.lastIndexOf("\n \n")
    );

    if (lastBreak > 500) {
      end = cursor + lastBreak;
    }

    const content = text.slice(cursor, end).trim();
    if (content.length > 0) {
      chunks.push({
        id: crypto.randomUUID(),
        title: `Chapter ${n}`,
        content,
      });
      n++;
    }

    cursor = end;
  }

  // Remainder
  const rem = text.slice(cursor).trim();
  if (rem.length > 0) {
    chunks.push({
      id: crypto.randomUUID(),
      title: `Chapter ${n}`,
      content: rem,
    });
  }

  return chunks.length > 0 ? chunks : [{ id: crypto.randomUUID(), title: "Chapter 1", content: text.trim() }];
}