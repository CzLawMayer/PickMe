import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type CSSProperties,
} from "react";
import AppHeader from "@/components/AppHeader";
import SubmissionModal from "@/components/SubmissionModal";
import "./Write.css";

type Chapter = { id: string; title: string; content: string; isEditing?: boolean };
type ListMode = "none" | "ordered" | "unordered";
type CaseMode = "none" | "upper" | "lower";

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

  // toolbar state
  const [listMode, setListMode] = useState<ListMode>("none");
  const [caseState, setCaseState] = useState<{ mode: CaseMode; original: string }>({
    mode: "none",
    original: "",
  });

  // font size scale (only editor text, via CSS var)
  const [fontScaleStep, setFontScaleStep] = useState(0); // -3..3
  const editorScale = useMemo(() => 1 + fontScaleStep * 0.1, [fontScaleStep]);

  const changeFontSize = (delta: number) => {
    setFontScaleStep(prev => {
      const next = Math.max(-3, Math.min(3, prev + delta));
      return next;
    });
  };

  // editor theme (this page only)
  // checked (moon) = dark, unchecked (sun) = light
  const [isDarkMode, setIsDarkMode] = useState(true);
  const isLightMode = !isDarkMode;

  // active chapter helper
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

  const beginRename = (id: string) =>
    setChapters(list => list.map(c => (c.id === id ? { ...c, isEditing: true } : c)));

  const commitRename = (id: string, value: string) =>
    setChapters(list =>
      list.map(c =>
        c.id === id
          ? { ...c, title: (value || "Untitled").trim(), isEditing: false }
          : c
      )
    );

  const cancelRename = (id: string) =>
    setChapters(list => list.map(c => (c.id === id ? { ...c, isEditing: false } : c)));

  const removeChapter = (id: string) =>
    setChapters(list => {
      const next = list.filter(c => c.id !== id);
      if (activeId === id && next.length) setActiveId(next[0].id);
      return next.map((c, i) =>
        /^Chapter \d+$/.test(c.title) ? { ...c, title: `Chapter ${i + 1}` } : c
      );
    });

  const editorRef = useRef<HTMLDivElement | null>(null);

  const applyCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
  };

  // list: none -> ordered -> unordered -> none
  const cycleListMode = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (sel) {
      if (sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    editor.focus();

    if (listMode === "none") {
      document.execCommand("insertOrderedList", false);
      setListMode("ordered");
    } else if (listMode === "ordered") {
      document.execCommand("insertOrderedList", false);
      document.execCommand("insertUnorderedList", false);
      setListMode("unordered");
    } else {
      document.execCommand("insertUnorderedList", false);
      setListMode("none");
    }
  };

  // Aa button: original -> UPPER -> lower -> original
  const cycleCase = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const selectedText = sel.toString();
    if (!selectedText) return;

    let { mode, original } = caseState;

    const isNewSelection =
      !original ||
      (selectedText !== original &&
        selectedText !== original.toUpperCase() &&
        selectedText !== original.toLowerCase());

    if (isNewSelection) {
      original = selectedText;
      mode = "none";
    }

    let newMode: CaseMode;
    let newText: string;

    if (mode === "none") {
      newMode = "upper";
      newText = selectedText.toUpperCase();
    } else if (mode === "upper") {
      newMode = "lower";
      newText = selectedText.toLowerCase();
    } else {
      newMode = "none";
      newText = original;
    }

    const range = sel.getRangeAt(0);
    const textNode = document.createTextNode(newText);
    range.deleteContents();
    range.insertNode(textNode);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    sel.addRange(newRange);

    setCaseState({ mode: newMode, original });

    const html = editor.innerHTML;
    setChapters(list =>
      list.map(c => (c.id === activeId ? { ...c, content: html } : c))
    );
  };

  // separator: one dot between paragraphs max
  const insertSectionDivider = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node: Node | null = sel.anchorNode;
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    let block: HTMLElement | null = null;
    while (node && node !== editor) {
      if (node.parentNode === editor) {
        block = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (!block) {
      const last = editor.lastElementChild as HTMLElement | null;
      if (!last) return;
      block = last;
    }

    if (block.classList && block.classList.contains("editor-section-divider")) {
      return;
    }

    const next = block.nextElementSibling as HTMLElement | null;
    if (next && next.classList.contains("editor-section-divider")) {
      return;
    }

    const divider = document.createElement("div");
    divider.className = "editor-section-divider";
    divider.textContent = "●";

    if (next) {
      editor.insertBefore(divider, next);
    } else {
      editor.appendChild(divider);
    }

    const range = document.createRange();
    range.setStartAfter(divider);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    const html = editor.innerHTML;
    setChapters(list =>
      list.map(c => (c.id === activeId ? { ...c, content: html } : c))
    );
  };

  const onEditorInput = () => {
    const html = editorRef.current?.innerHTML ?? "";
    setChapters(list =>
      list.map(c => (c.id === active?.id ? { ...c, content: html } : c))
    );
  };

  const handleEditorKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;

    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node: Node | null = sel.anchorNode;
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    let current: Node | null = node;
    let divider: HTMLElement | null = null;

    while (current && current !== editor) {
      if (
        current instanceof HTMLElement &&
        current.classList.contains("editor-section-divider")
      ) {
        divider = current;
        break;
      }
      current = current.parentNode;
    }

    if (!divider) return;

    e.preventDefault();

    const p = document.createElement("p");
    p.appendChild(document.createElement("br"));

    if (divider.nextSibling) {
      editor.insertBefore(p, divider.nextSibling);
    } else {
      editor.appendChild(p);
    }

    const range = document.createRange();
    range.setStart(p, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    const html = editor.innerHTML;
    setChapters(list =>
      list.map(c => (c.id === activeId ? { ...c, content: html } : c))
    );
  };

  // PASTE: convert text to HTML paragraphs, respecting double line breaks
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    let text = e.clipboardData.getData("text/plain");
    if (!text) return;

    text = text.replace(/\r\n/g, "\n");
    const paragraphs = text.split(/\n{2,}/);

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const html = paragraphs
      .map(p => {
        const inner = escapeHtml(p).replace(/\n/g, "<br>");
        return `<p>${inner}</p>`;
      })
      .join("");

    editor.focus();
    document.execCommand("insertHTML", false, html);

    const newHtml = editor.innerHTML;
    setChapters(list =>
      list.map(c => (c.id === activeId ? { ...c, content: newHtml } : c))
    );
  };

  // ESC closes modal / panels
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

  // sync editor with active chapter
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = active?.content ?? "";
    setListMode("none");
    setCaseState({ mode: "none", original: "" });
  }, [active?.id]);

  return (
    <div className={`write-shell ${isLightMode ? "write-shell--light" : ""}`}>
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
                        onBlur={e => commitRename(ch.id, e.currentTarget.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            commitRename(
                              ch.id,
                              (e.target as HTMLInputElement).value
                            );
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelRename(ch.id);
                          }
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
                        onClick={e => {
                          e.stopPropagation();
                          beginRename(ch.id);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Delete"
                        onClick={e => {
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
          onClick={() => setLeftOpen(v => !v)}
          aria-expanded={isLeftOpen}
        >
          Menu
        </button>
      </aside>

      {/* RIGHT PANEL – restored rm-* structure */}
      <aside
        className={`slide-panel slide-right ${isRightOpen ? "is-open" : "is-closed"}`}
        aria-hidden={!isRightOpen}
      >
        <div className="slide-inner">
          <div className="rm-shell">
            {/* Title pinned at the top, clamped to 2 lines by CSS */}
            <h2 className="rm-title">{active?.title || "Untitled Project"}</h2>

            {/* Middle section: cover + meta */}
            <div className="rm-middle">
              <button
                className="rm-cover-btn"
                type="button"
                onClick={() => setShowSubmission(true)}
              >
                <div className="rm-cover-box">
                  {/* later this will be the uploaded image */}
                  <span className="rm-cover-plus">+</span>
                </div>
              </button>

              <div className="rm-meta">
                <div className="rm-chapters">{chapters.length} chapters</div>
                <div className="rm-separator" />
                <div className="rm-genre">Main genre: (from submission)</div>
              </div>
            </div>

            {/* Actions pinned at the bottom */}
            <div className="rm-actions">
              <button type="button" className="rm-btn rm-btn-preview">
                Preview
              </button>
              <button type="button" className="rm-btn rm-btn-save">
                Save
              </button>
              <button type="button" className="rm-btn rm-btn-publish">
                Publish
              </button>
            </div>
          </div>
        </div>

        <button
          className="slide-tab tab-right"
          onClick={() => setRightOpen(v => !v)}
          aria-expanded={isRightOpen}
        >
          Notes
        </button>
      </aside>

      {/* CENTER CANVAS */}
      <main className="write-canvas" role="main" aria-live="polite">
        <section className="editor-wrap" aria-label="Writing editor">
          <div className="editor-inner">
            <div className="editor-body">
              {/* TOOLBAR (floating on the left) */}
              <div className="editor-toolbar-shell">
                <div className="editor-toolbar" aria-label="Text formatting tools">
                  {/* 0. Undo & Redo */}
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("undo")}
                    title="Undo"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("redo")}
                    title="Redo"
                  >
                    ↻
                  </button>

                  {/* 1. Bold & Italic */}
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("bold")}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("italic")}
                  >
                    I
                  </button>

                  {/* 2. Underline & Caps/lowercase */}
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("underline")}
                  >
                    U
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={cycleCase}
                    title="Cycle case (Aa / AA / aa)"
                  >
                    Aa
                  </button>

                  {/* 3. Center & Justify */}
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("justifyCenter")}
                  >
                    C
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("justifyFull")}
                  >
                    J
                  </button>

                  {/* 4. Left & Right */}
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("justifyLeft")}
                  >
                    L
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => applyCommand("justifyRight")}
                  >
                    R
                  </button>

                  {/* 5. Numbers & Separator */}
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={cycleListMode}
                    title="Toggle list (1. / • / none)"
                  >
                    {listMode === "none" && "1."}
                    {listMode === "ordered" && "•"}
                    {listMode === "unordered" && "–"}
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={e => e.preventDefault()}
                    onClick={insertSectionDivider}
                  >
                    ○
                  </button>
                </div>
              </div>

              {/* SCROLLS: title + text together */}
              <div className="editor-scroll">
                <header className="editor-header">
                  <h1 className="editor-title">
                    {active?.title || "Untitled Chapter"}
                  </h1>
                </header>

                <div
                  ref={editorRef}
                  className="editor-area"
                  contentEditable
                  spellCheck={true}
                  data-placeholder="Start writing here…"
                  onInput={onEditorInput}
                  onPaste={handlePaste}
                  onKeyDown={handleEditorKeyDown}
                  aria-multiline="true"
                  role="textbox"
                  style={
                    {
                      "--editor-font-scale": editorScale,
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* font size control + theme switch */}
      <div className="font-size-control" aria-label="Adjust editor font size">
        <button
          type="button"
          className="font-size-btn"
          onClick={() => changeFontSize(-1)}
        >
          –
        </button>

        <span className="font-size-label">A</span>

        <button
          type="button"
          className="font-size-btn"
          onClick={() => changeFontSize(1)}
        >
          +
        </button>

        {/* Uiverse.io switch */}
        <label className="switch" aria-label="Toggle theme">
          <input
            id="input"
            type="checkbox"
            checked={isDarkMode}
            onChange={e => setIsDarkMode(e.target.checked)}
          />
          <div className="slider round">
            <div className="sun-moon">
              <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>

              <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>

              <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>

              <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
            </div>

            <div className="stars">
              <svg id="star-1" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
              </svg>
              <svg id="star-2" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
              </svg>
              <svg id="star-3" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
              </svg>
              <svg id="star-4" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
              </svg>
            </div>
          </div>
        </label>
      </div>

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
