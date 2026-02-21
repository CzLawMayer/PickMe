// src/importer/extractTextFromFile.ts

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return await file.text();
  }

  if (ext === "pdf") {
    return await extractPdf(file);
  }

  if (ext === "docx") {
    return await extractDocx(file);
  }

  throw new Error("Unsupported file type.");
}

/* ===============================
   PDF Extraction (text-based only)
================================= */

// src/importer/extractTextFromFile.ts

async function extractPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
  const workerUrlMod = await import("pdfjs-dist/legacy/build/pdf.worker?url");

  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = (workerUrlMod as any).default;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = (pdfjsLib as any).getDocument({ data });
  const pdf = await loadingTask.promise;

  const pagesOut: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    const textContent = await page.getTextContent();

    // Each item has a transform matrix; transform[4]=x, transform[5]=y (in viewport coords)
    const items = (textContent.items as any[])
      .map((it) => {
        const str = String(it.str ?? "").replace(/\s+/g, " ").trim();
        const x = it.transform?.[4] ?? 0;
        const y = it.transform?.[5] ?? 0;
        return { str, x, y };
      })
      .filter((it) => it.str.length > 0);

    // ---- Header/footer removal by page zones ----
    // In PDF.js, y grows upwards from bottom (viewport coordinates).
    // So: footer is small y, header is large y.
    const headerCutoff = viewport.height * 0.90; // top 10%
    const footerCutoff = viewport.height * 0.10; // bottom 10%

    const bodyItems = items.filter((it) => it.y > footerCutoff && it.y < headerCutoff);

    // ---- Reconstruct lines by grouping close y values ----
    // Sort top-to-bottom then left-to-right
    bodyItems.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 1.5) return b.y - a.y; // higher y first
      return a.x - b.x;
    });

    const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
    const yTol = 2.5; // tolerance to treat items as same line

    for (const it of bodyItems) {
      const last = lines[lines.length - 1];
      if (!last || Math.abs(last.y - it.y) > yTol) {
        lines.push({ y: it.y, parts: [{ x: it.x, str: it.str }] });
      } else {
        last.parts.push({ x: it.x, str: it.str });
      }
    }

    // Join each line left-to-right with spacing
    const pageLines = lines.map((ln) => {
      ln.parts.sort((a, b) => a.x - b.x);

      let s = "";
      let prevX = ln.parts[0]?.x ?? 0;

      for (const p of ln.parts) {
        const gap = p.x - prevX;

        // heuristic: if there is a noticeable x gap, add a space
        if (s && gap > 6 && !s.endsWith(" ")) s += " ";

        // avoid double spaces
        if (s && s.endsWith(" ") && p.str.startsWith(" ")) {
          s += p.str.trimStart();
        } else {
          s += p.str;
        }

        prevX = p.x + p.str.length * 3; // rough advance; good enough for spacing heuristic
      }

      return s.replace(/\s{2,}/g, " ").trim();
    });

    // Remove empty lines
    const cleanedPage = pageLines.filter(Boolean).join("\n");

    pagesOut.push(cleanedPage);
  }

  // Keep page boundaries as blank lines (helps splitter + reflow)
  return pagesOut.join("\n\n");
}

/* ===============================
   DOCX Extraction
================================= */

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({
    arrayBuffer,
  });

  return result.value;
}