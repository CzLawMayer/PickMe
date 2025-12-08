// src/pages/Write.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import AppHeader from "@/components/AppHeader";
import SubmissionModal from "@/components/SubmissionModal";
import "./Write.css";
import { useNavigate, useLocation } from "react-router-dom";

type Chapter = {
  id: string;
  title: string;
  content: string;
  isEditing?: boolean;
};

type ListMode = "none" | "ordered" | "unordered";
type CaseMode = "none" | "upper" | "lower";

type SubmissionSnapshot = {
  title?: string;
  author?: string;
  mainGenre?: string;
  coverFile?: File | null;
  backCoverFile?: File | null;
  dedication?: string;
};

type ProjectState = {
  submission: SubmissionSnapshot | null;
  chapters: Chapter[];
};

export default function WritePage() {
  const [isLeftOpen, setLeftOpen] = useState(false);
  const [isRightOpen, setRightOpen] = useState(false);
  const location = useLocation() as any;
  const navigate = useNavigate();

  // status coming from Submit / Preview (default inProgress)
  const statusFromLocation: "inProgress" | "published" =
    (location.state?.status as "inProgress" | "published" | undefined) ===
    "published"
      ? "published"
      : "inProgress";

  // chapters
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: crypto.randomUUID(), title: "Chapter 1", content: "" },
    { id: crypto.randomUUID(), title: "Chapter 2", content: "" },
    { id: crypto.randomUUID(), title: "Chapter 3", content: "" },
  ]);
  const [activeId, setActiveId] = useState<string>(() => chapters[0]?.id);

  const [showSubmission, setShowSubmission] = useState(false);

  const [listMode, setListMode] = useState<ListMode>("none");
  const [caseState, setCaseState] = useState<{
    mode: CaseMode;
    original: string;
  }>({
    mode: "none",
    original: "",
  });

  const [isLightMode, setIsLightMode] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number }>({
    top: 84,
    left: -140,
  });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    top: number;
    left: number;
  } | null>(null);

  const [submission, setSubmission] = useState<SubmissionSnapshot | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Hydrate from incoming project (from Submit or Preview)
  useEffect(() => {
    const incoming = location.state?.project as ProjectState | undefined;
    if (!incoming) return;

    if (incoming.submission) {
      setSubmission(incoming.submission);
    }
    if (incoming.chapters && incoming.chapters.length > 0) {
      setChapters(incoming.chapters);
      setActiveId(incoming.chapters[0].id);
    }
  }, [location.state]);

  const buildProject = (): ProjectState => ({
    submission,
    chapters,
  });

  const htmlToParagraphText = (html: string): string => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    const txt = (div.innerText || "").replace(/\u200B/g, "").trim();
    return txt.replace(/\n/g, "\n\n");
  };

  const active = useMemo(
    () => chapters.find((c) => c.id === activeId) ?? chapters[0],
    [chapters, activeId]
  );

  useEffect(() => {
    if (!submission?.coverFile) {
      setCoverUrl(null);
      return;
    }
    const url = URL.createObjectURL(submission.coverFile);
    setCoverUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [submission?.coverFile]);

  const addChapter = () =>
    setChapters((list) => {
      const idx = list.length + 1;
      const c: Chapter = {
        id: crypto.randomUUID(),
        title: `Chapter ${idx}`,
        content: "",
      };
      return [...list, c];
    });

  const beginRename = (id: string) =>
    setChapters((list) =>
      list.map((c) => (c.id === id ? { ...c, isEditing: true } : c))
    );

  const commitRename = (id: string, value: string) =>
    setChapters((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, title: (value || "Untitled").trim(), isEditing: false }
          : c
      )
    );

  const cancelRename = (id: string) =>
    setChapters((list) =>
      list.map((c) => (c.id === id ? { ...c, isEditing: false } : c))
    );

  const removeChapter = (id: string) =>
    setChapters((list) => {
      const next = list.filter((c) => c.id !== id);
      if (activeId === id && next.length) setActiveId(next[0].id);
      return next.map((c, i) =>
        /^Chapter \d+$/.test(c.title)
          ? { ...c, title: `Chapter ${i + 1}` }
          : c
      );
    });

  const editorRef = useRef<HTMLDivElement | null>(null);

  const applyCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
  };

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
    setChapters((list) =>
      list.map((c) => (c.id === activeId ? { ...c, content: html } : c))
    );
  };

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
    setChapters((list) =>
      list.map((c) => (c.id === activeId ? { ...c, content: html } : c))
    );
  };

  const onEditorInput = () => {
    const html = editorRef.current?.innerHTML ?? "";
    setChapters((list) =>
      list.map((c) => (c.id === active?.id ? { ...c, content: html } : c))
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

    const sel2 = window.getSelection();
    if (sel2) {
      const range = document.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      sel2.removeAllRanges();
      sel2.addRange(range);
    }

    const html = editor.innerHTML;
    setChapters((list) =>
      list.map((c) => (c.id === activeId ? { ...c, content: html } : c))
    );
  };

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
      .map((p) => {
        const inner = escapeHtml(p).replace(/\n/g, "<br>");
        return `<p>${inner}</p>`;
      })
      .join("");

    editor.focus();
    document.execCommand("insertHTML", false, html);

    const newHtml = editor.innerHTML;
    setChapters((list) =>
      list.map((c) => (c.id === activeId ? { ...c, content: newHtml } : c))
    );
  };

  const handleEditorFocus = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const plain = editor.innerText.replace(/\u200B/g, "").trim();
    if (plain.length > 0) return;

    editor.innerHTML = "<p><br></p>";

    const sel = window.getSelection();
    const range = document.createRange();
    const p = editor.firstChild;

    if (p && sel) {
      range.setStart(p, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSubmission) setShowSubmission(false);
        else if (isLeftOpen) setLeftOpen(false);
        else if (isRightOpen) setRightOpen(false);
        else if (showNotes) setShowNotes(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isLeftOpen, isRightOpen, showSubmission, showNotes]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = active?.content ?? "";
    setListMode("none");
    setCaseState({ mode: "none", original: "" });
  }, [active?.id]);

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const { mouseX, mouseY, top, left } = dragStartRef.current;
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;
      setToolbarPos({ top: top + dy, left: left + dx });
    };

    const onUp = () => {
      setIsDraggingToolbar(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingToolbar]);

  const handleToolbarHandleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingToolbar(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      top: toolbarPos.top,
      left: toolbarPos.left,
    };
  };

  const decreaseFont = () =>
    setFontScale((s) => Math.max(0.8, Math.round((s - 0.1) * 10) / 10));
  const increaseFont = () =>
    setFontScale((s) => Math.min(1.6, Math.round((s + 0.1) * 10) / 10));

  const shellClass =
    "write-shell" + (isLightMode ? " write-shell--light" : "");

  const projectTitle =
    submission?.title?.trim() || "Project title not set";
  const mainGenreLabel =
    submission?.mainGenre?.trim() || "Main genre not selected";

  return (
    <div
      className={shellClass}
      style={{ ["--editor-font-scale" as any]: fontScale }}
    >
      <AppHeader />

      {/* LEFT PANEL */}
      <aside
        className={`slide-panel slide-left ${
          isLeftOpen ? "is-open" : "is-closed"
        }`}
        aria-hidden={!isLeftOpen}
      >
        <div className="slide-inner">
          <button
            className="lm-settings"
            onClick={() => setShowSubmission(true)}
          >
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
                        type="text"
                        className="lm-edit-input"
                        defaultValue={ch.title}
                        autoFocus
                        onFocus={(e) => {
                          e.target.select();
                        }}
                        onBlur={(e) =>
                          commitRename(ch.id, e.currentTarget.value)
                        }
                        onKeyDown={(e) => {
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
                        onClick={(e) => {
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
              <button
                type="button"
                className="lm-item lm-add"
                onClick={addChapter}
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

      {/* RIGHT PANEL */}
      <aside
        className={`slide-panel slide-right ${
          isRightOpen ? "is-open" : "is-closed"
        }`}
        aria-hidden={!isRightOpen}
      >
        <div className="slide-inner">
          <div className="rm-shell">
            <h2 className="rm-title" onClick={() => setShowSubmission(true)}>
              {projectTitle}
            </h2>

            <div className="rm-middle">
              <button
                type="button"
                className="rm-cover-btn"
                onClick={() => setShowSubmission(true)}
              >
                <div className="rm-cover-box">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Project cover" />
                  ) : (
                    <span className="rm-cover-plus">+</span>
                  )}
                </div>
              </button>

              <div className="rm-meta">
                <div className="rm-chapters">
                  {chapters.length} chapter
                  {chapters.length === 1 ? "" : "s"}
                </div>
                <div className="rm-separator" />
                <div className="rm-genre">{mainGenreLabel}</div>
              </div>
            </div>

            <div className="rm-actions">
              {/* Preview → Preview page, preserving status */}
              <button
                type="button"
                className="rm-btn rm-btn-preview"
                onClick={() => {
                  const chapterTitles = chapters.map(
                    (c) => c.title?.trim() || "Untitled Chapter"
                  );
                  const chapterTexts = chapters.map((c) =>
                    htmlToParagraphText(c.content || "")
                  );

                  const project = buildProject();

                  navigate("/preview", {
                    state: {
                      book: {
                        id: "preview",
                        title:
                          submission?.title?.trim() || "Untitled Project",
                        author: submission?.author?.trim() || "",
                        coverFile: submission?.coverFile ?? null,
                        backCoverFile: submission?.backCoverFile ?? null,
                        dedication: submission?.dedication || "",
                        chapters: chapterTitles,
                        chapterTexts,
                        totalChapters: chapters.length,
                        tags: submission?.mainGenre
                          ? [submission.mainGenre]
                          : [],
                      },
                      project,
                      status: statusFromLocation,
                    },
                  });
                }}
              >
                Preview
              </button>

              {/* Save → Submit (keep published if already published) */}
              <button
                type="button"
                className="rm-btn rm-btn-save"
                onClick={() => {
                  const project = buildProject();

                  const id = crypto.randomUUID();
                  const title =
                    submission?.title?.trim() || "Untitled Project";

                  const shelfBook = {
                    id,
                    title,
                    author: submission?.author?.trim() || "",
                    year: "",
                    coverUrl: coverUrl ?? undefined,
                    likes: 0,
                    bookmarks: 0,
                    rating: 0,
                    userRating: 0,
                    tags: submission?.mainGenre
                      ? [submission.mainGenre]
                      : [],
                  };

                  const effectiveStatus =
                    statusFromLocation === "published"
                      ? "published"
                      : "inProgress";

                  navigate("/submit", {
                    state: {
                      shelfBook,
                      status: effectiveStatus,
                      project,
                    },
                  });
                }}
              >
                Save
              </button>

              {/* Publish → Submit (always published) */}
              <button
                type="button"
                className="rm-btn rm-btn-publish"
                onClick={() => {
                  const project = buildProject();
                  const id = crypto.randomUUID();
                  const title = submission?.title?.trim() || "Untitled Project";

                  const shelfBook = {
                    id,
                    title,
                    author: submission?.author?.trim() || "",
                    year: "",
                    coverUrl: coverUrl ?? undefined,
                    likes: 0,
                    bookmarks: 0,
                    rating: 0,
                    userRating: 0,
                    tags: submission?.mainGenre ? [submission.mainGenre] : [],
                  };

                  const nextStatus =
                    statusFromLocation === "published" ? "inProgress" : "published";

                  navigate("/submit", {
                    state: {
                      shelfBook,
                      status: nextStatus,
                      project,
                    },
                  });
                }}
              >
                {statusFromLocation === "published" ? "Unpublish" : "Publish"}
              </button>

            </div>
          </div>
        </div>

        <button
          className="slide-tab tab-right"
          onClick={() => setRightOpen((v) => !v)}
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
              {/* TOOLBAR */}
              <div
                className="editor-toolbar-shell"
                style={{ top: toolbarPos.top, left: toolbarPos.left }}
              >
                <div
                  className={
                    "editor-toolbar-handle" +
                    (isDraggingToolbar ? " is-dragging" : "")
                  }
                  onMouseDown={handleToolbarHandleMouseDown}
                >
                  <div className="editor-toolbar-handle-bar" />
                </div>

                <div
                  className="editor-toolbar"
                  aria-label="Text formatting tools"
                >
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("undo")}
                    title="Undo"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("redo")}
                    title="Redo"
                  >
                    ↻
                  </button>

                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("bold")}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("italic")}
                  >
                    I
                  </button>

                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("underline")}
                  >
                    U
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cycleCase}
                    title="Cycle case (Aa / AA / aa)"
                  >
                    Aa
                  </button>

                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("justifyCenter")}
                  >
                    C
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("justifyFull")}
                  >
                    J
                  </button>

                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("justifyLeft")}
                  >
                    L
                  </button>
                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCommand("justifyRight")}
                  >
                    R
                  </button>

                  <button
                    type="button"
                    className="editor-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
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
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertSectionDivider}
                  >
                    ○
                  </button>
                </div>

                <button
                  type="button"
                  className={
                    "editor-notes-toggle" + (showNotes ? " is-open" : "")
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowNotes((v) => !v)}
                >
                  Notes
                </button>

                {showNotes && (
                  <div className="editor-notes-popover">
                    <textarea
                      className="editor-notes-textarea"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Quick notes for this project…"
                    />
                  </div>
                )}
              </div>

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
                  onFocus={handleEditorFocus}
                  onInput={onEditorInput}
                  onPaste={handlePaste}
                  onKeyDown={handleEditorKeyDown}
                  aria-multiline="true"
                  role="textbox"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Font size + theme switch (bottom-right) */}
      <div className="font-size-control">
        <button
          type="button"
          className="font-size-btn"
          onClick={decreaseFont}
          aria-label="Decrease editor font size"
        >
          –
        </button>
        <span className="font-size-label">A</span>
        <button
          type="button"
          className="font-size-btn"
          onClick={increaseFont}
          aria-label="Increase editor font size"
        >
          +
        </button>

        <label
          className="switch"
          aria-label="Toggle editor light mode"
          style={{ marginLeft: 10 }}
        >
          <input
            id="input"
            type="checkbox"
            checked={!isLightMode}
            onChange={(e) => setIsLightMode(!e.target.checked)}
          />
          <span className="slider round">
            <span className="sun-moon">
              {/* SVGs omitted for brevity, keep your existing ones */}
              <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg
                id="light-ray-1"
                className="light-ray"
                viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg
                id="light-ray-2"
                className="light-ray"
                viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="50" />
              </svg>
              <svg
                id="light-ray-3"
                className="light-ray"
                viewBox="0 0 100 100"
              >
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
            </span>

            <span className="stars">
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
            </span>
          </span>
        </label>
      </div>

      {/* SUBMISSION MODAL */}
      {showSubmission && (
        <SubmissionModal
          open={showSubmission}
          onClose={() => setShowSubmission(false)}
          onSave={(data: any) => {
            setSubmission({
              title: data.title,
              author: data.author,
              mainGenre: data.mainGenre,
              coverFile: data.coverFile ?? null,
              backCoverFile: data.backCoverFile ?? null,
              dedication: data.dedication ?? "",
            });
            setShowSubmission(false);
          }}
          initial={submission ?? undefined}
        />
      )}
    </div>
  );
}
