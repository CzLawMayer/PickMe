export function reflowPdfText(raw: string) {
  // normalize newlines and spaces
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
    if (buf.length === 0) return;
    out.push(buf.join(" ").replace(/\s{2,}/g, " ").trim());
    buf = [];
  };

  const isBlank = (l: string) => l.trim() === "";

  const looksLikeHeading = (l: string) => {
    const t = l.trim();
    if (!t) return false;

    // short + "all caps-ish" headings, or typical chapter words
    if (/^(chapter|part|prologue|epilogue)\b/i.test(t)) return true;
    if (/^\d{1,3}$/.test(t)) return true; // could be chapter number; keep as its own line
    if (t.length <= 40 && t === t.toUpperCase() && /[A-Z]/.test(t)) return true;

    // separators
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(t)) return true;

    return false;
  };

  const shouldKeepHardBreak = (prev: string, next: string) => {
    const a = prev.trim();
    const b = next.trim();
    if (!a || !b) return true;

    // If next is a heading-like line, keep break
    if (looksLikeHeading(b)) return true;

    // If prev ends with strong sentence punctuation, paragraph break might be real
    // (still not always, but helps preserve intended formatting)
    if (/[.?!]"?$/.test(a)) return true;

    // If line is a dialogue line, we usually still want it to join into paragraph form,
    // but if you prefer each quote on its own line, change this to `return true`.
    // For "full paragraphs", we keep it FALSE so it joins.
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // blank line => paragraph boundary
    if (isBlank(line)) {
      flush();
      out.push(""); // keep paragraph separation
      continue;
    }

    // fix hyphenation at line wraps:
    // "exam-" + next "ple" => "example"
    const next = (lines[i + 1] ?? "");
    if (/-$/.test(line.trim()) && next && !isBlank(next)) {
      const merged = line.trim().replace(/-$/, "") + next.trimStart();
      // consume next line
      lines[i + 1] = "";
      buf.push(merged);
      continue;
    }

    // headings: flush paragraph and keep heading as its own line
    if (looksLikeHeading(line.trim())) {
      flush();
      out.push(line.trim());
      continue;
    }

    // normal text line: decide join vs hard break
    const prevLine = buf.length ? buf[buf.length - 1] : "";
    if (buf.length && shouldKeepHardBreak(prevLine, line)) {
      flush();
      buf.push(line.trim());
    } else {
      buf.push(line.trim());
    }
  }

  flush();

  // rebuild: collapse multiple empty lines nicely
  return out
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}