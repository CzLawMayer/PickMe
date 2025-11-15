// src/pages/Write.tsx
import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import SubmissionModal from "@/components/SubmissionModal";
import "./Write.css";

type Chapter = { id: string; title: string };

export default function WritePage() {
  const [isLeftOpen, setLeftOpen] = useState(false);
  const [isRightOpen, setRightOpen] = useState(false);

  // Chapters (contiguous order is just array index)
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: crypto.randomUUID(), title: "" },
    { id: crypto.randomUUID(), title: "" },
    { id: crypto.randomUUID(), title: "" },
    { id: crypto.randomUUID(), title: "" },
    { id: crypto.randomUUID(), title: "" },
  ]);

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  // Active chapter (optional)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Submission modal
  const [showSubmission, setShowSubmission] = useState(false);
  const openSubmissionModal = () => setShowSubmission(true);

  // ESC closes topmost UI
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showSubmission) return setShowSubmission(false);
      if (isLeftOpen) return setLeftOpen(false);
      if (isRightOpen) return setRightOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isLeftOpen, isRightOpen, showSubmission]);

  const addChapter = () =>
    setChapters((list) => [...list, { id: crypto.randomUUID(), title: "" }]);

  const beginRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setDraftTitle(currentTitle);
  };

  const commitRename = (id: string) => {
    setChapters((list) =>
      list.map((c) => (c.id === id ? { ...c, title: draftTitle.trim() } : c))
    );
    setEditingId(null);
    setDraftTitle("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setDraftTitle("");
  };

  const removeChapter = (id: string) => {
    setChapters((list) => list.filter((c) => c.id !== id));
    if (activeChapterId === id) setActiveChapterId(null);
    if (editingId === id) cancelRename();
  };

  const setActiveChapter = (id: string) => setActiveChapterId(id);

  // Helpful: a fast lookup for index → used for color cycling and fallback label
  const indexById = useMemo(() => {
    const m = new Map<string, number>();
    chapters.forEach((c, i) => m.set(c.id, i));
    return m;
  }, [chapters]);

  return (
    <div className="write-shell">
      <AppHeader />

      {/* LEFT SLIDER */}
      <aside
        className={`slide-panel slide-left ${isLeftOpen ? "is-open" : "is-closed"}`}
        aria-hidden={!isLeftOpen}
      >
        <div className="slide-inner">
          <button className="lm-settings" onClick={openSubmissionModal}>
            Settings
          </button>

          <ul className="lm-list" role="list">
            {chapters.map((ch, i) => {
              // Cycle through 1..4 for colors based on visible order
              const colorClass = `lm-c${(i % 4) + 1}`;
              const isEditing = editingId === ch.id;
              const fallback = `Chapter ${i + 1}`;
              const label = (ch.title || "").trim() || fallback;

              return (
                <li key={ch.id}>
                  <div
                    className={`lm-item lm-chapter ${colorClass}`}
                    onClick={() => setActiveChapter(ch.id)}
                    data-id={ch.id}
                    aria-current={activeChapterId === ch.id ? "true" : undefined}
                  >
                    {/* left text or inline edit */}
                    {isEditing ? (
                      <input
                        className="lm-edit-input"
                        value={draftTitle}
                        autoFocus
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onBlur={() => commitRename(ch.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(ch.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                      />
                    ) : (
                      <span className="lm-text">{label}</span>
                    )}

                    {/* actions */}
                    <span className="lm-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        title="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          beginRename(ch.id, ch.title);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChapter(ch.id);
                        }}
                      >
                        🗑️
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}

            {/* ADD ROW — inside the list, always last */}
            <li>
              <button
                type="button"
                className="lm-item lm-add"
                onClick={addChapter}
                title="Add chapter"
              >
                + Add chapter
              </button>
            </li>
          </ul>
        </div>

        <button
          className="slide-tab tab-left"
          onClick={() => setLeftOpen((v) => !v)}
          aria-expanded={isLeftOpen}
        >
          Menu
        </button>
      </aside>

      {/* RIGHT SLIDER (empty) */}
      <aside
        className={`slide-panel slide-right ${isRightOpen ? "is-open" : "is-closed"}`}
        aria-hidden={!isRightOpen}
      >
        <div className="slide-inner" />
        <button
          className="slide-tab tab-right"
          onClick={() => setRightOpen((v) => !v)}
          aria-label={isRightOpen ? "Close right panel" : "Open right panel"}
          aria-expanded={isRightOpen}
        >
          Notes
        </button>
      </aside>

      {/* MAIN CANVAS */}
      <main className="write-canvas" role="main">
        <div className="write-placeholder">
          <p className="muted">Your writing canvas goes here.</p>
        </div>
      </main>

      {/* Submission Modal */}
      {showSubmission && (
        <SubmissionModal
          open={showSubmission}
          onClose={() => setShowSubmission(false)}
          onSave={() => setShowSubmission(false)}
        />
      )}
    </div>
  );
}
