import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import SubmissionModal from "@/components/SubmissionModal";
import "./Write.css";

type Chapter = { id: string; title: string; content: string; isEditing?: boolean };

export default function WritePage() {
  const [isLeftOpen, setLeftOpen] = useState(false);
  const [isRightOpen, setRightOpen] = useState(false);

  // chapters
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: crypto.randomUUID(), title: "Chapter 1", content: "" },
    { id: crypto.randomUUID(), title: "Chapter 2", content: "" },
    { id: crypto.randomUUID(), title: "Chapter 3", content: "" },
  ]);
  const [activeId, setActiveId] = useState<string>(() => chapters[0]?.id);

  const [showSubmission, setShowSubmission] = useState(false);

  // helpers
  const active = useMemo(
    () => chapters.find(c => c.id === activeId) ?? chapters[0],
    [chapters, activeId]
  );

  const addChapter = () =>
    setChapters(list => {
      const idx = list.length + 1;
      const c = { id: crypto.randomUUID(), title: `Chapter ${idx}`, content: "" };
      return [...list, c];
    });

  const beginRename = (id: string, _title: string) =>
    setChapters(list => list.map(c => (c.id === id ? { ...c, isEditing: true } : c)));

  const commitRename = (id: string, value: string) =>
    setChapters(list =>
      list.map(c =>
        c.id === id ? { ...c, title: (value || "Untitled").trim(), isEditing: false } : c
      )
    );

  const cancelRename = (id: string) =>
    setChapters(list => list.map(c => (c.id === id ? { ...c, isEditing: false } : c)));

  const removeChapter = (id: string) =>
    setChapters(list => {
      const next = list.filter(c => c.id !== id);
      // keep a valid active id
      if (activeId === id && next.length) setActiveId(next[0].id);
      return next.map((c, i) =>
        // if the title was the auto “Chapter N”, renumber it; custom titles stay untouched
        /^Chapter \d+$/.test(c.title) ? { ...c, title: `Chapter ${i + 1}` } : c
      );
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSubmission) setShowSubmission(false);
        else if (isLeftOpen) setLeftOpen(false);
        else if (isRightOpen) setRightOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isLeftOpen, isRightOpen, showSubmission]);

  // editor: write content to the active chapter
  const editorRef = useRef<HTMLDivElement | null>(null);
  const onEditorInput = () => {
    const text = editorRef.current?.innerText ?? "";
    setChapters(list => list.map(c => (c.id === active?.id ? { ...c, content: text } : c)));
  };

  // keep editor text in sync when switching chapters
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerText = active?.content ?? "";
  }, [active?.id]); // eslint-disable-line

  return (
    <div className="write-shell">
      <AppHeader />

      {/* LEFT PANEL */}
      <aside
        className={`slide-panel slide-left ${isLeftOpen ? "is-open" : "is-closed"}`}
        aria-hidden={!isLeftOpen}
      >
        <div className="slide-inner">
          <button className="lm-settings" onClick={() => setShowSubmission(true)}>
            Settings
          </button>

          <ul className="lm-list" role="list">
            {chapters.map((ch, i) => {
              const colorClass = `lm-c${(i % 4) + 1}`;
              return (
                <li key={ch.id}>
                  <div
                    className={`lm-item lm-chapter ${colorClass}`}
                    onClick={() => setActiveId(ch.id)}
                    data-id={ch.id}
                  >
                    {ch.isEditing ? (
                      <input
                        className="lm-edit-input"
                        defaultValue={ch.title}
                        autoFocus
                        onBlur={(e) => commitRename(ch.id, e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(ch.id, (e.target as HTMLInputElement).value);
                          if (e.key === "Escape") cancelRename(ch.id);
                        }}
                      />
                    ) : (
                      <span className="lm-text">{ch.title}</span>
                    )}

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

            <li>
              <button type="button" className="lm-item lm-add" onClick={addChapter}>
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

      {/* RIGHT PANEL (empty) */}
      <aside
        className={`slide-panel slide-right ${isRightOpen ? "is-open" : "is-closed"}`}
        aria-hidden={!isRightOpen}
      >
        <div className="slide-inner" />
        <button
          className="slide-tab tab-right"
          onClick={() => setRightOpen((v) => !v)}
          aria-expanded={isRightOpen}
        >
          Notes
        </button>
      </aside>

      {/* CENTER WRITING CANVAS */}
      <main className="write-canvas" role="main" aria-live="polite">
        <section className="editor-wrap" aria-label="Writing editor">
          <h1 className="editor-title">{active?.title || "Untitled Chapter"}</h1>

          <div className="editor-frame">
            <div
              ref={editorRef}
              className="editor-area"
              contentEditable
              spellCheck={true}
              data-placeholder="Start writing here…"
              onInput={onEditorInput}
              aria-multiline="true"
              role="textbox"
            />
          </div>
        </section>
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
