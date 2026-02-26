// src/components/ImportModal.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { extractTextFromFile } from "@/importer/extractTextFromFile";
import { reflowPdfText } from "@/importer/reflowPdfText";
import { splitIntoChapters, type ChapterDraft } from "@/importer/splitChapters";

import { useConfirm } from "@/components/ConfirmPopover";
import "./ImportModal.css";

export type ImportedProjectPayload = {
  sourceFileName: string;
  initialSubmission: {
    title: string;
    author: string;
  };
  chapters: ChapterDraft[];
};

type Step = "pick" | "parsing" | "preview";

type HistorySnap = {
  chapters: ChapterDraft[];
  selectedId: string;
};

function deepCloneChapters(chs: ChapterDraft[]) {
  return chs.map((c) => ({ ...c }));
}

export default function ImportModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: ImportedProjectPayload) => void;
}) {
  const confirmPopover = useConfirm();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");

  // dirty flag for discard confirm
  const [dirty, setDirty] = useState(false);

  // Undo history
  const [history, setHistory] = useState<HistorySnap[]>([]);

  const selected = useMemo(
    () => chapters.find((c) => c.id === selectedId) || null,
    [chapters, selectedId]
  );

  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1;
    return chapters.findIndex((c) => c.id === selectedId);
  }, [chapters, selectedId]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev, { chapters: deepCloneChapters(chapters), selectedId }]);
  }, [chapters, selectedId]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setChapters(deepCloneChapters(last.chapters));
      setSelectedId(last.selectedId);
      setDirty(true);
      return prev.slice(0, -1);
    });
  }, []);

  // centralized close request (confirm if dirty)
  const requestClose = useCallback(async () => {
    if (!dirty) {
      onClose();
      return;
    }

    const ok = await confirmPopover({
      title: "Discard changes?",
      message: "If you close this now, your import edits will be lost.",
      confirmText: "Discard",
      cancelText: "Keep editing",
      danger: true,
    });

    if (ok) {
      setDirty(false);
      onClose();
    }
  }, [dirty, onClose, confirmPopover]);

  // reset whenever opened
  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setFile(null);
    setError("");
    setChapters([]);
    setSelectedId("");
    setBookTitle("");
    setAuthor("");
    setHistory([]);
    setDirty(false);
  }, [open]);

  // esc + undo hotkey
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();

      // Ctrl/Cmd + Z undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose, undo]);

  const startImport = useCallback(async () => {
    if (!file) return;

    setStep("parsing");
    setError("");

    try {
      const extracted = await extractTextFromFile(file);
      const processed = file.type === "application/pdf" ? reflowPdfText(extracted) : extracted;

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const draft = splitIntoChapters(processed, {
        hintTitle: bookTitle.trim() || baseName,
        hintAuthor: author.trim(),
      });

      if (!draft.length) {
        throw new Error(
          "We couldn’t find readable text in this file. If it’s a scanned PDF, please try a text-based PDF, DOCX, TXT, or MD."
        );
      }

      setChapters(draft);
      setSelectedId(draft[0]?.id ?? "");
      setHistory([]);
      setBookTitle((prev) => (prev.trim() ? prev : baseName || "Untitled import"));
      setStep("preview");
      setDirty(true);
    } catch (err: any) {
      setError(err?.message || "Import failed.");
      setStep("pick");
    }
  }, [file, bookTitle, author]);

  const confirmSend = useCallback(() => {
    if (!file) return;
    if (!chapters.length) return;

    // This is an intentional action; no discard prompt.
    setDirty(false);

    onConfirm({
      sourceFileName: file.name,
      initialSubmission: {
        title: bookTitle.trim() || file.name.replace(/\.[^/.]+$/, ""),
        author: author.trim(),
      },
      chapters: deepCloneChapters(chapters),
    });
  }, [file, chapters, bookTitle, author, onConfirm]);

  // Chapter tools (with undo)
  const mergeWithPrevious = useCallback(() => {
    if (!selected) return;
    const idx = selectedIndex;
    if (idx <= 0) return;

    pushHistory();
    setDirty(true);

    setChapters((prev) => {
      const before = prev[idx - 1];
      const current = prev[idx];

      const mergedContent = [before.content?.trim(), current.content?.trim()].filter(Boolean).join("\n\n");
      const mergedTitle = before.title?.trim() || `Chapter ${idx}`;

      const next = prev.slice();
      next[idx - 1] = { ...before, title: mergedTitle, content: mergedContent };
      next.splice(idx, 1);
      return next;
    });

    const prevId = chapters[idx - 1]?.id;
    if (prevId) setSelectedId(prevId);
  }, [selected, selectedIndex, pushHistory, chapters]);

  const splitAtCursor = useCallback(() => {
    if (!selected) return;
    const idx = selectedIndex;
    if (idx < 0) return;

    const ta = textRef.current;
    const pos = ta?.selectionStart ?? -1;

    const text = selected.content ?? "";
    const cut = pos >= 0 ? pos : Math.floor(text.length / 2);

    const left = text.slice(0, cut).trim();
    const right = text.slice(cut).trim();

    if (!left || !right) return;

    pushHistory();
    setDirty(true);

    const newChapter: ChapterDraft = {
      id: crypto.randomUUID(),
      title: "",
      content: right,
    };

    setChapters((prev) => {
      const next = prev.slice();
      next[idx] = { ...prev[idx], content: left };
      next.splice(idx + 1, 0, newChapter);
      return next;
    });

    setSelectedId(newChapter.id);

    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(0, 0);
    });
  }, [selected, selectedIndex, pushHistory]);

  const removeChapter = useCallback(() => {
    if (!selected) return;
    if (chapters.length <= 1) return;

    const idx = selectedIndex;
    if (idx < 0) return;

    pushHistory();
    setDirty(true);

    const nextId = chapters[idx + 1]?.id ?? chapters[idx - 1]?.id ?? "";

    setChapters((prev) => {
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });

    setSelectedId(nextId);
  }, [selected, chapters.length, selectedIndex, pushHistory, chapters]);

  const canMergePrev = step === "preview" && selectedIndex > 0;
  const canSplit = step === "preview" && !!selected && (selected.content?.trim().length ?? 0) > 20;
  const canRemove = step === "preview" && chapters.length > 1;
  const canUndo = step === "preview" && history.length > 0;

  if (!open) return null;

  return createPortal(
    <div
      className="import-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="import-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="import-close" onClick={requestClose}>
          ×
        </button>

        <div className="import-header">
          <div className="import-title">Import</div>
          <div className="import-supported">Supported: DOCX, PDF (text-based), TXT, MD</div>
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
                  const base = f.name.replace(/\.[^/.]+$/, "");
                  setBookTitle(base || "");
                  setAuthor("");
                  setDirty(true);
                }
              }}
            />

            <div
              className={`import-dropzone ${file ? "has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  setFile(f);
                  const base = f.name.replace(/\.[^/.]+$/, "");
                  setBookTitle(base || "");
                  setAuthor("");
                  setDirty(true);
                }
              }}
            >
              <div className="import-dropzone-inner">
                <div className="import-dropzone-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>

                <div className="import-dropzone-title">Upload your file here</div>
                <div className="import-dropzone-sub">Files supported: DOCX, PDF (text-based), TXT, MD</div>

                <div className="import-dropzone-or">
                  <span />
                  <em>OR</em>
                  <span />
                </div>

                <button className="import-browse" type="button" onClick={() => fileInputRef.current?.click()}>
                  Browse
                </button>

                <div className="import-dropzone-max">Maximum size: 20MB</div>
              </div>
            </div>

            {file && (
              <div className="import-file-row">
                <div className="import-file-left">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    description
                  </span>
                  <div className="import-file-meta">
                    <div className="import-file-name">{file.name}</div>
                    <div className="import-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="import-file-remove"
                  aria-label="Remove file"
                  onClick={() => {
                    setFile(null);
                    setDirty(true);
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    delete
                  </span>
                </button>
              </div>
            )}

            <div className="import-actions">
              <button className="btn secondary" onClick={requestClose}>
                Cancel
              </button>
              <button className="btn primary" disabled={!file} onClick={startImport}>
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
                    onChange={(e) => {
                      setBookTitle(e.target.value);
                      setDirty(true);
                    }}
                  />
                </label>
                <label>
                  Author
                  <input
                    value={author}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      setDirty(true);
                    }}
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
                    {i + 1}. {c.title || `Chapter ${i + 1}`}
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
                    onChange={(e) => {
                      const v = e.target.value;
                      setDirty(true);
                      setChapters((prev) =>
                        prev.map((c) => (c.id === selected.id ? { ...c, title: v } : c))
                      );
                    }}
                  />

                  <textarea
                    ref={textRef}
                    value={selected.content}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDirty(true);
                      setChapters((prev) =>
                        prev.map((c) => (c.id === selected.id ? { ...c, content: v } : c))
                      );
                    }}
                  />

                  <div className="chapter-tools">
                    <button
                      className="btn secondary"
                      onClick={mergeWithPrevious}
                      disabled={!canMergePrev}
                      title={!canMergePrev ? "Select a chapter after the first one." : undefined}
                    >
                      Merge with previous
                    </button>

                    <button
                      className="btn secondary"
                      onClick={splitAtCursor}
                      disabled={!canSplit}
                      title={!canSplit ? "Place your cursor where you want to split." : undefined}
                    >
                      Split at cursor
                    </button>

                    <button
                      className="btn danger"
                      onClick={removeChapter}
                      disabled={!canRemove}
                      title={!canRemove ? "You must keep at least one chapter." : undefined}
                    >
                      Remove chapter
                    </button>

                    <button
                      className="btn secondary"
                      onClick={undo}
                      disabled={!canUndo}
                      title={!canUndo ? "Nothing to undo." : "Undo (Ctrl/Cmd+Z)"}
                    >
                      Undo
                    </button>
                  </div>
                </>
              )}

              <div className="import-footer">
                <button className="btn secondary" onClick={requestClose}>
                  Cancel
                </button>
                <button className="btn primary" onClick={confirmSend}>
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