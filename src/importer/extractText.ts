// src/importer/extractText.ts
/**
 * Client-side extraction for common formats:
 * - .txt / .md: File.text()
 * - .docx: mammoth (browser)
 * - .pdf: pdfjs-dist (text-based PDFs only; scanned PDFs won't extract)
 *
 * Install:
 *   npm i mammoth pdfjs-dist
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }

  if (name.endsWith(".docx")) {
    return await extractDocx(file);
  }

  if (name.endsWith(".pdf")) {
    return await extractPdf(file);
  }

  throw new Error("Unsupported file type. Please use DOCX, PDF, TXT, or MD.");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result?.value ?? "").toString();
}

async function extractPdf(file: File): Promise<string> {
  // ✅ Vite-safe: use legacy build + worker URL import
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
  const workerUrlMod = await import("pdfjs-dist/legacy/build/pdf.worker?url");

  // workerUrlMod.default is the actual URL string in Vite
  const workerSrc = (workerUrlMod as any).default as string;
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = (pdfjsLib as any).getDocument({ data });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const strings = (content.items as any[])
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean);

    pages.push(strings.join(" ").replace(/\s{2,}/g, " ").trim());
  }

  return pages.join("\n\n");
}