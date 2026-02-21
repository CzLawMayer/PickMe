// src/importer/reflowPdfText.ts
export function reflowPdfText(raw: string) {
  let s = (raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  const lines = s.split("\n").map((l) => l.trimEnd());

  const out: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (!buf.length) return;
    out.push(buf.join(" ").replace(/\s{2,}/g, " ").trim());
    buf = [];
  };

  const isBlank = (l: string) => l.trim() === "";

  const looksLikeHeading = (l: string) => {
    const t = l.trim();
    if (!t) return false;

    if (/^(chapter|part|prologue|epilogue|foreword|afterword|preface|introduction)\b/i.test(t)) {
      return true;
    }
    if (/^\d{1,3}$/.test(t)) return true;
    if (t.length <= 40 && t === t.toUpperCase() && /[A-Z]/.test(t)) return true;
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(t)) return true;

    return false;
  };

  const startsDialogue = (t: string) => {
    const s = t.trim();
    // common dialogue starters: quotes, em dash, hyphen dash
    return /^["“”'‘’]/.test(s) || /^[—–-]\s*\S/.test(s);
  };

  const endsDialogue = (t: string) => {
    const s = t.trim();
    // ends with quote or quote+punct
    return /["”’]\s*$/.test(s);
  };

  const looksLikeListOrStageDirection = (t: string) => {
    const s = t.trim();
    // bullets / numbered list / simple stage direction lines
    if (/^(\*|-|•)\s+/.test(s)) return true;
    if (/^\d+\.\s+/.test(s)) return true;
    if (/^\([^)]+\)\s*$/.test(s)) return true;
    return false;
  };

  const isLikelyWrapContinuation = (prev: string, next: string) => {
    const a = prev.trim();
    const b = next.trim();

    if (!a || !b) return false;

    // If next is a heading-like line, do NOT merge
    if (looksLikeHeading(b)) return false;

    // Keep intended breaks for dialogue or list-like formatting
    if (startsDialogue(b)) return false;
    if (looksLikeListOrStageDirection(b)) return false;

    // If previous is dialogue and next is dialogue -> new speaker line -> keep break
    if (startsDialogue(a) && startsDialogue(b)) return false;

    // If prev ends with ":" it's often a speaker tag or label -> keep break
    if (/:$/.test(a)) return false;

    // If line is very short, it's often intentional formatting (dialogue beat / emphasis)
    if (b.length <= 35 && /[.?!]"?$/.test(a)) return false;

    // If prev ends with a hyphenated break like "exam-" handled elsewhere,
    // otherwise: merge typical wrapped prose
    // Merge only if prev doesn't look like it should end a paragraph strongly
    if (/[.?!]["”’]?$/.test(a)) {
      // sentence ended: often a paragraph break (but could be wrap). Be conservative:
      // If next starts lowercase, it may actually be same paragraph in PDFs.
      // If next starts uppercase/quote, treat as new paragraph.
      if (/^[a-z]/.test(b)) return true;
      return false;
    }

    // If prev ends with comma/semicolon/colon, it's very likely a wrap continuation
    if (/[,;—–-]$/.test(a)) return true;

    // If next starts lowercase, likely continuation
    if (/^[a-z]/.test(b)) return true;

    // Default: merge (PDF wraps are common)
    return true;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isBlank(line)) {
      flush();
      out.push("");
      continue;
    }

    // Hyphenation fix: "exam-" + "ple" -> "example"
    const next = lines[i + 1] ?? "";
    if (/-$/.test(line.trim()) && next && !isBlank(next)) {
      const merged = line.trim().replace(/-$/, "") + next.trimStart();
      lines[i + 1] = "";
      buf.push(merged);
      continue;
    }

    // Headings stay on their own
    if (looksLikeHeading(line.trim())) {
      flush();
      out.push(line.trim());
      continue;
    }

    // Decide whether to merge into current paragraph buffer or start new paragraph
    if (!buf.length) {
      buf.push(line.trim());
      continue;
    }

    const prevLine = buf[buf.length - 1];

    // Preserve dialogue line breaks:
    // If next line starts dialogue OR prev is dialogue and next is new dialogue speaker
    if (startsDialogue(line) || (startsDialogue(prevLine) && startsDialogue(line))) {
      flush();
      buf.push(line.trim());
      continue;
    }

    // If it looks like a list/stage direction, keep it separate
    if (looksLikeListOrStageDirection(line)) {
      flush();
      buf.push(line.trim());
      continue;
    }

    // Normal rule: merge wrapped lines; keep real paragraph breaks
    if (isLikelyWrapContinuation(prevLine, line)) {
      buf.push(line.trim());
    } else {
      flush();
      buf.push(line.trim());
    }
  }

  flush();

  return out
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}