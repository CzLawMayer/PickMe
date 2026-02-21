// src/components/ImportModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ✅ IMPORTANT: extractTextFromFile should NOT come from reflowPdfText.ts
// Put your extractor in something like: src/importer/extractTextFromFile.ts
import { extractTextFromFile } from "@/importer/extractTextFromFile";

// ✅ reflow comes from your new file
import { reflowPdfText } from "@/importer/reflowPdfText";

import { splitIntoChapters, type ChapterDraft } from "@/importer/splitChapters";
import "./ImportModal.css";

export type ImportedProjectPayload = {
  sourceFileName: string;
  project: {
    submission: {
      title: string;
      author: string;
      mainGenre?: string;
      dedication?: string;
      coverFile?: File | null;
      backCoverFile?: File | null;
    };
    chapters: { id: string; title: string; content: string }[];
  };
};

type Step = "pick" | "parsing" | "preview";

export default function ImportModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: ImportedProjectPayload) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");

  const selected = useMemo(
    () => chapters.find((c) => c.id === selectedId) || null,
    [chapters, selectedId]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setFile(null);
    setError("");
    setChapters([]);
    setSelectedId("");
    setBookTitle("");
    setAuthor("");
  }, [open]);

  const startImport = async () => {
    if (!file) return;

    setStep("parsing");
    setError("");

    try {
      // 1) extract raw text from file
      const extracted = await extractTextFromFile(file);

      // 2) reflow only for PDFs (recommended)
      const processed =
        file.type === "application/pdf" ? reflowPdfText(extracted) : extracted;

      // 3) split into chapters using improved text
      const draft = splitIntoChapters(processed, {
        hintTitle: bookTitle.trim() || file.name.replace(/\.[^/.]+$/, ""),
        hintAuthor: author.trim(),
      });

      if (!draft.length) {
        throw new Error(
          "We couldn’t find readable text in this file. If it’s a scanned PDF, please try a text-based PDF, DOCX, TXT, or MD."
        );
      }

      setChapters(draft);
      setSelectedId(draft[0]?.id ?? "");

      // Default title from filename if empty
      const base = file.name.replace(/\.[^/.]+$/, "");
      setBookTitle((prev) => (prev.trim() ? prev : base || "Untitled import"));

      setStep("preview");
    } catch (err: any) {
      setError(err?.message || "Import failed.");
      setStep("pick");
    }
  };

  const confirm = () => {
    if (!file) return;

    const finalChapters = chapters.map((c, i) => ({
      id: crypto.randomUUID(),
      title: c.title || `Chapter ${i + 1}`,
      content: c.content.trim(),
    }));

    onConfirm({
      sourceFileName: file.name,
      project: {
        submission: {
          title: bookTitle.trim(),
          author: author.trim(),
          dedication: "",
          coverFile: null,
          backCoverFile: null,
        },
        chapters: finalChapters,
      },
    });
  };

  if (!open) return null;

  return createPortal(
    <div
      className="import-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="import-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="import-close" onClick={onClose}>
          ×
        </button>

        <div className="import-header">
          <div className="import-title">Import</div>
          <div className="import-supported">
            Supported: DOCX, PDF (text-based), TXT, MD
          </div>
        </div>

        {error && (
          <div className="import-error">
            <strong>Import note</strong>
            <div>{error}</div>
          </div>
        )}

        {step !== "preview" && (
          <div className="import-pick">
            <input
              type="file"
              ref={fileInputRef}
              accept=".docx,.pdf,.txt,.md"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  // reset title/author defaults when picking a new file
                  const base = f.name.replace(/\.[^/.]+$/, "");
                  setBookTitle(base || "");
                  setAuthor("");
                }
              }}
            />

            <div className="import-drop">
              <div className="import-drop-title">Choose file to import</div>
              <button
                className="btn save"
                onClick={() => fileInputRef.current?.click()}
              >
                Select file
              </button>

              {file && <div className="import-file">{file.name}</div>}
            </div>

            <div className="import-actions">
              <button className="btn cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="btn save" disabled={!file} onClick={startImport}>
                {step === "parsing" ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="import-body">
            {/* LEFT */}
            <div className="import-sidebar">
              <div className="import-meta">
                <label>
                  Title
                  <input
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                  />
                </label>
                <label>
                  Author
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </label>
              </div>

              <div className="import-chapters">
                {chapters.map((c, i) => (
                  <button
                    key={c.id}
                    className={`chapter-item ${c.id === selectedId ? "active" : ""}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    {i + 1}. {c.title}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="import-preview">
              {selected && (
                <>
                  <input
                    className="chapter-title-input"
                    value={selected.title}
                    onChange={(e) =>
                      setChapters((prev) =>
                        prev.map((c) =>
                          c.id === selected.id ? { ...c, title: e.target.value } : c
                        )
                      )
                    }
                  />

                  <textarea
                    ref={textRef}
                    value={selected.content}
                    onChange={(e) =>
                      setChapters((prev) =>
                        prev.map((c) =>
                          c.id === selected.id ? { ...c, content: e.target.value } : c
                        )
                      )
                    }
                  />

                  <div className="chapter-tools">
                    <button className="btn small cancel">Merge with previous</button>
                    <button className="btn small cancel">Split at cursor</button>
                    <button className="btn small cancel">Remove chapter</button>
                  </div>
                </>
              )}

              <div className="import-footer">
                <button className="btn cancel" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn save" onClick={confirm}>
                  Send to Write
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}