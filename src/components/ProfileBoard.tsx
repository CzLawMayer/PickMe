// src/components/ProfileBoard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ProfileBoard.css";
import { Link } from "react-router-dom";

import {
  Mail,
  PenTool,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Sun,
  Moon,
  Check,
  MessageSquare,
} from "lucide-react";

import { libraryBooks, profile } from "@/profileData";

type Tab = "Library" | "About" | "Forum" | "Letters";

type Props = {
  selectedBookId: string | null;
  onPreviewBook: (book: any) => void;
  onSelectBook: (book: any) => void;
  onClearHover: () => void;
  initialTab?: Tab;
};

type AboutAlign = "left" | "center" | "right";
type AboutBlock =
  | {
      id: string;
      type: "text";
      value: string;
      align: AboutAlign;
      fontSize: string;
      color: string | null;
    }
  | {
      id: string;
      type: "image";
      value: string;
      align: AboutAlign;
    };

type LetterBlock = { type: "text"; value: string } | { type: "image"; value: string };

type Letter = {
  id: number;
  writer: string;
  recipient: string;
  date: string;
  content: LetterBlock[];
};

export default function ProfileBoard({
  selectedBookId,
  onPreviewBook,
  onSelectBook,
  onClearHover,
  initialTab = "Library",
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  /* =========================
     LIBRARY (EXACT SHELVES)
     IMPORTANT: .shelf must be
     a DIRECT CHILD of the board
     so `.library-cell > .shelf`
     selector continues to work.
  ========================== */
  const shelfRef = useRef<HTMLDivElement | null>(null);

  const handleLibraryHover = (evt: React.MouseEvent<HTMLDivElement>) => {
    const el = (evt.target as Element)?.closest?.(".book-spine[data-index]") as HTMLElement | null;
    if (!el) return;
    const idx = Number(el.dataset.index);
    if (Number.isNaN(idx)) return;

    const books = libraryBooks();
    const book = books[idx];
    if (book) onPreviewBook(book);
  };

  const handleLibraryFocus = (evt: React.FocusEvent<HTMLDivElement>) => {
    const el = (evt.target as Element)?.closest?.(".book-spine[data-index]") as HTMLElement | null;
    if (!el) return;
    const idx = Number(el.dataset.index);
    if (Number.isNaN(idx)) return;

    const books = libraryBooks();
    const book = books[idx];
    if (book) onPreviewBook(book);
  };

  const handleLibraryKey = (evt: React.KeyboardEvent<HTMLDivElement>) => {
    const el = (evt.target as Element)?.closest?.(".book-spine[data-index]") as HTMLElement | null;
    if (!el) return;

    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      const idx = Number(el.dataset.index);
      if (Number.isNaN(idx)) return;

      const books = libraryBooks();
      const book = books[idx];
      if (book) onSelectBook(book);
    }
  };

  const handleLibraryClick = (evt: React.MouseEvent<HTMLDivElement>) => {
    const el = (evt.target as Element)?.closest?.(".book-spine[data-index]") as HTMLElement | null;
    if (!el) return;

    const idx = Number(el.dataset.index);
    if (Number.isNaN(idx)) return;

    const books = libraryBooks();
    const book = books[idx];
    if (book) onSelectBook(book);
  };

  // stamp indices + a11y labels
  useEffect(() => {
    if (activeTab !== "Library") return;

    const shelf = shelfRef.current;
    if (!shelf) return;

    const spines = Array.from(shelf.querySelectorAll<HTMLElement>(".book-spine"));
    const books = libraryBooks();

    spines.slice(0, 500).forEach((el, i) => {
      el.dataset.index = String(i);
      if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
      const b = books[i];
      if (b) el.setAttribute("aria-label", `Book: ${b.title}${b.author ? ` by ${b.author}` : ""}`);
    });
  }, [activeTab]);

  const renderLibraryDirectChild = () => {
    const books = libraryBooks();
    const COLS = 15;
    const MIN_ROWS = 3;
    const totalRows = Math.max(MIN_ROWS, Math.ceil(books.length / COLS));

    return (
      <div
        className="shelf"
        role="grid"
        aria-label="Bookshelf"
        ref={shelfRef}
        onMouseOver={handleLibraryHover}
        onFocus={handleLibraryFocus}
        onKeyDown={handleLibraryKey}
        onMouseLeave={onClearHover}
        onClick={handleLibraryClick}
        style={{ flex: "1 1 auto", minHeight: 0 }}
      >
        {Array.from({ length: totalRows }, (_, rIdx) => {
          const start = rIdx * COLS;
          const row = books.slice(start, start + COLS);
          const placeholders = Math.max(0, COLS - row.length);

          return (
            <div className="shelf-row" role="row" key={`row-${rIdx}`}>
              {row.map((book, i) => {
                const globalIdx = rIdx * COLS + i;
                return (
                  <div
                    key={book.id ?? `b-${globalIdx}`}
                    role="gridcell"
                    className={`book-spine${selectedBookId === String(book.id) ? " is-selected" : ""}`}
                    title={book.title}
                    aria-label={`Book: ${book.title}${book.author ? ` by ${book.author}` : ""}`}
                    tabIndex={0}
                    data-index={globalIdx}
                  />
                );
              })}

              {Array.from({ length: placeholders }).map((_, p) => (
                <div
                  key={`ph-${rIdx}-${p}`}
                  role="gridcell"
                  className="book-spine book-spine--placeholder"
                  aria-hidden="true"
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  /* =========================
     ABOUT
  ========================== */
  const [isAboutDarkMode, setIsAboutDarkMode] = useState(true);
  const bgColor = isAboutDarkMode ? "#1a1a1a" : "#f8fafc";
  const textColor = isAboutDarkMode ? "#ffffff" : "#000000";

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutBlocks, setAboutBlocks] = useState<AboutBlock[]>([
    {
      id: "initial-1",
      type: "text",
      value: "Welcome to the About board!",
      align: "center",
      fontSize: "24px",
      color: null,
    },
    {
      id: "initial-2",
      type: "text",
      value: "Click the pen icon to edit. You can add text or images, change alignment, and toggle dark/light.",
      align: "center",
      fontSize: "16px",
      color: null,
    },
  ]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(aboutBlocks[0]?.id ?? null);

  const currentBlock = useMemo(
    () => aboutBlocks.find((b) => b.id === selectedBlockId) ?? null,
    [aboutBlocks, selectedBlockId]
  );

  const updateAboutBlock = (id: string, field: string, val: any) => {
    setAboutBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, [field]: val } as any) : b)));
  };

  const autoExpand = (target: HTMLTextAreaElement | null) => {
    if (!target) return;
    target.style.height = "auto";
    target.style.height = target.scrollHeight + "px";
  };

  const handleAboutTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, id: string) => {
    updateAboutBlock(id, "value", e.target.value);
    autoExpand(e.target);
  };

  const handleAddAboutText = () => {
    const newBlock: AboutBlock = {
      id: String(Date.now()),
      type: "text",
      value: "New text entry...",
      align: "center",
      fontSize: "18px",
      color: null,
    };
    setAboutBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const deleteAboutBlock = (id: string | null) => {
    if (!id) return;
    setAboutBlocks((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((b) => b.id !== id);
      setSelectedBlockId(next[0]?.id ?? null);
      return next;
    });
  };

  const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const value = String(event.target?.result ?? "");
      const newBlock: AboutBlock = {
        id: String(Date.now()),
        type: "image",
        value,
        align: "center",
      };
      setAboutBlocks((prev) => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!isEditingAbout) return;
    if (activeTab !== "About") return;
    document.querySelectorAll<HTMLTextAreaElement>(".pb-about-textarea").forEach((ta) => autoExpand(ta));
  }, [isEditingAbout, activeTab, aboutBlocks.length]);

  const renderAbout = () => {
    return (
      <div className="pb-aboutRoot" style={{ backgroundColor: bgColor }}>
        <div className={`pb-aboutBoard ${isAboutDarkMode ? "pb-scrollbarDark" : "pb-scrollbarLight"}`}>
          <div className="pb-aboutBlocks">
            {aboutBlocks.map((block) => {
              const isSelected = isEditingAbout && selectedBlockId === block.id;
              return (
                <div
                  key={block.id}
                  className={[
                    "pb-aboutBlock",
                    isEditingAbout ? "pb-aboutBlock--editable" : "",
                    isSelected ? "pb-aboutBlock--selected" : "",
                  ].join(" ")}
                  onClick={() => isEditingAbout && setSelectedBlockId(block.id)}
                  style={{ textAlign: block.align as any }}
                >
                  {block.type === "text" ? (
                    isEditingAbout ? (
                      <textarea
                        className="pb-about-textarea"
                        value={block.value}
                        onChange={(e) => handleAboutTextChange(e, block.id)}
                        style={{
                          fontSize: (block as any).fontSize,
                          color: (block as any).color || textColor,
                          textAlign: block.align as any,
                        }}
                      />
                    ) : (
                      <p
                        className="pb-about-text"
                        style={{
                          fontSize: (block as any).fontSize,
                          color: (block as any).color || textColor,
                        }}
                      >
                        {block.value}
                      </p>
                    )
                  ) : (
                    <div className="pb-aboutImageWrap" data-align={block.align}>
                      <img src={block.value} className="pb-aboutImage" alt="About" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pb-aboutControls">
          {isEditingAbout && (
            <div className="pb-designer">
              <div className="pb-designerGroup pb-designerGroup--split">
                <button
                  type="button"
                  className="pb-iconChip pb-iconChip--blue"
                  onClick={handleAddAboutText}
                  title="Add Text"
                >
                  <Plus size={16} />
                </button>

                <label className="pb-iconChip pb-iconChip--green" title="Add Image">
                  <ImageIcon size={16} />
                  <input type="file" accept="image/*" onChange={handleAboutImageUpload} />
                </label>
              </div>

              {currentBlock && (
                <div className="pb-designerGroup pb-designerGroup--split">
                  <div className="pb-alignPill" aria-label="Alignment">
                    <button
                      type="button"
                      className={["pb-alignBtn", currentBlock.align === "left" ? "is-active" : ""].join(" ")}
                      onClick={() => updateAboutBlock(currentBlock.id, "align", "left")}
                      title="Align Left"
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      type="button"
                      className={["pb-alignBtn", currentBlock.align === "center" ? "is-active" : ""].join(" ")}
                      onClick={() => updateAboutBlock(currentBlock.id, "align", "center")}
                      title="Align Center"
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button
                      type="button"
                      className={["pb-alignBtn", currentBlock.align === "right" ? "is-active" : ""].join(" ")}
                      onClick={() => updateAboutBlock(currentBlock.id, "align", "right")}
                      title="Align Right"
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>

                  {currentBlock.type === "text" && (
                    <select
                      className="pb-fontSizeSelect"
                      value={(currentBlock as any).fontSize}
                      onChange={(e) => updateAboutBlock(currentBlock.id, "fontSize", e.target.value)}
                    >
                      {["14px", "16px", "20px", "24px", "32px", "48px"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="pb-designerGroup">
                <button
                  type="button"
                  className={["pb-iconChip", isAboutDarkMode ? "pb-iconChip--sun" : "pb-iconChip--moon"].join(" ")}
                  onClick={() => setIsAboutDarkMode((v) => !v)}
                  title={isAboutDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  {isAboutDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                  type="button"
                  className="pb-iconChip pb-iconChip--danger"
                  onClick={() => deleteAboutBlock(selectedBlockId)}
                  title="Delete Block"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className={["pb-fab", isEditingAbout ? "is-accept" : "is-edit"].join(" ")}
            onClick={() => {
              setIsEditingAbout((v) => !v);
              if (!isEditingAbout) setSelectedBlockId(aboutBlocks[0]?.id ?? null);
            }}
            title={isEditingAbout ? "Accept" : "Customize"}
          >
            {isEditingAbout ? <Check size={20} /> : <PenTool size={20} />}
          </button>
        </div>
      </div>
    );
  };

  /* =========================
     LETTERS (working)
  ========================== */
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [isWriting, setIsWriting] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const [letters, setLetters] = useState<Letter[]>([
    {
      id: 1,
      writer: "The Grand Library Archives",
      recipient: "Future Generations",
      date: "Dec 31, 2025",
      content: [
        { type: "text", value: "A long-form letter preview. This is a fully working carousel + open + compose flow." },
        {
          type: "image",
          value: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=900",
        },
        { type: "text", value: "Images are supported as blocks. You can add/remove blocks while composing." },
      ],
    },
  ]);

  const [writingBlocks, setWritingBlocks] = useState<LetterBlock[]>([{ type: "text", value: "" }]);
  const [writerName, setWriterName] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const scrollCarousel = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const amt = direction === "left" ? -w * 0.8 : w * 0.8;
    el.scrollBy({ left: amt, behavior: "smooth" });
  };

  const truncateName = (name: string) => (name.length > 20 ? name.slice(0, 20) + "..." : name);

  const updateLetterTextBlock = (index: number, val: string, target?: HTMLTextAreaElement | null) => {
    setWritingBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value: val } as LetterBlock;
      return next;
    });

    if (target) {
      target.style.height = "auto";
      target.style.height = `${Math.max(target.scrollHeight, 196)}px`;
    }
  };

  const handleSendLetter = () => {
    const hasWriter = writerName.trim().length > 0;
    const hasRecipient = recipientName.trim().length > 0;
    const hasContent = writingBlocks.some((b) => b.type === "image" || (b.type === "text" && b.value.trim().length > 0));
    if (!hasWriter || !hasRecipient || !hasContent) return;

    const letterToAdd: Letter = {
      id: Date.now(),
      writer: writerName.trim(),
      recipient: recipientName.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      content: writingBlocks.filter((b) => b.type === "image" || (b.type === "text" && b.value.trim().length > 0)),
    };

    setLetters((prev) => [letterToAdd, ...prev]);
    setWriterName("");
    setRecipientName("");
    setWritingBlocks([{ type: "text", value: "" }]);
    setIsWriting(false);
  };

  const renderLettersCompose = () => {
    return (
      <div className="pb-lettersCompose pb-scrollbarLight">
        <div className="pb-lettersComposeHeader">
          <div className="pb-lettersField">
            <label>From</label>
            <input
              type="text"
              maxLength={20}
              placeholder="Name"
              value={writerName}
              onChange={(e) => setWriterName(e.target.value)}
            />
          </div>

          <div className="pb-lettersField pb-lettersField--right">
            <label>To</label>
            <input
              type="text"
              maxLength={20}
              placeholder="Recipient"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
        </div>

        <div className="pb-lettersComposeBody">
          {writingBlocks.map((block, idx) => (
            <div key={idx} className="pb-writeBlock">
              {block.type === "text" ? (
                <textarea
                  placeholder="Write something..."
                  className="pb-letterTextarea"
                  style={{ lineHeight: "28px" }}
                  value={block.value}
                  onChange={(e) => updateLetterTextBlock(idx, e.target.value, e.target)}
                />
              ) : (
                <div className="pb-imageBlock">
                  <img src={block.value} alt="Upload" />
                  <button
                    type="button"
                    className="pb-imageDelete"
                    onClick={() => {
                      setWritingBlocks((prev) => {
                        const next = prev.filter((_, i) => i !== idx);
                        return next.length ? next : [{ type: "text", value: "" }];
                      });
                    }}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <div className="pb-insertRow">
                <button
                  type="button"
                  className="pb-insertChip"
                  onClick={() => {
                    setWritingBlocks((prev) => {
                      const next = [...prev];
                      next.splice(idx + 1, 0, { type: "text", value: "" });
                      return next;
                    });
                  }}
                >
                  <Plus size={10} /> Text
                </button>

                <label className="pb-insertChip pb-insertChip--label">
                  <ImageIcon size={10} /> Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const value = String(ev.target?.result ?? "");
                        setWritingBlocks((prev) => {
                          const next = [...prev];
                          next.splice(idx + 1, 0, { type: "image", value });
                          next.splice(idx + 2, 0, { type: "text", value: "" });
                          return next;
                        });
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="pb-lettersComposeFooter">
          <button type="button" className="pb-btnText" onClick={() => setIsWriting(false)}>
            Cancel
          </button>
          <button type="button" className="pb-btnPrimary" onClick={handleSendLetter}>
            Send <Mail size={14} />
          </button>
        </div>
      </div>
    );
  };

  const renderLettersOpen = () => {
    if (!selectedLetter) return null;

    return (
      <div className="pb-letterOpen pb-scrollbarLight">
        <button type="button" className="pb-backBtn" onClick={() => setSelectedLetter(null)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="pb-letterHeader">
          <div className="pb-letterAvatar" aria-hidden />
          <div className="pb-letterHeaderMain">
            <div className="pb-letterHeaderTop">
              <div>
                <div className="pb-letterWriter">{selectedLetter.writer}</div>
                <div className="pb-letterRecipient">To: {selectedLetter.recipient}</div>
              </div>
              <div className="pb-letterDate">{selectedLetter.date}</div>
            </div>
          </div>
        </div>

        <div className="pb-letterContent">
          {selectedLetter.content.map((block, i) =>
            block.type === "text" ? (
              <p key={i} className="pb-letterText" style={{ lineHeight: "28px" }}>
                {block.value}
              </p>
            ) : (
              <div key={i} className="pb-letterImageRow">
                <img src={block.value} alt="Letter" />
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const renderLettersCarousel = () => {
    return (
      <div className="pb-lettersShell pb-scrollbarLight">
        <button
          type="button"
          className="pb-carouselArrow pb-carouselArrow--left"
          onClick={() => scrollCarousel("left")}
          title="Left"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          type="button"
          className="pb-carouselArrow pb-carouselArrow--right"
          onClick={() => scrollCarousel("right")}
          title="Right"
        >
          <ChevronRight size={24} />
        </button>

        <div className="pb-carousel" ref={carouselRef}>
          {letters.length === 0 ? (
            <div className="pb-emptyLetters">No letters yet...</div>
          ) : (
            letters.map((letter) => (
              <div
                key={letter.id}
                className="pb-letterCard"
                onClick={() => setSelectedLetter(letter)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedLetter(letter);
                  }
                }}
              >
                <div className="pb-letterCardTop">
                  <div className="pb-letterCardAvatar" aria-hidden />
                  <div className="pb-letterCardMeta">
                    <div className="pb-letterCardMetaRow">
                      <span className="pb-letterCardWriter">{truncateName(letter.writer)}</span>
                      <span className="pb-letterCardDate">{letter.date}</span>
                    </div>
                    <div className="pb-letterCardTo">To: {truncateName(letter.recipient)}</div>
                  </div>
                </div>

                <div className="pb-letterCardBody">
                  {letter.content.map((block, i) =>
                    block.type === "text" ? (
                      <p key={i} className="pb-letterCardPreview" style={{ lineHeight: "24px" }}>
                        {block.value}
                      </p>
                    ) : (
                      <div key={i} className="pb-letterCardImg">
                        <img src={block.value} alt="Preview" />
                      </div>
                    )
                  )}
                </div>

                <div className="pb-letterCardBottom">
                  <span>Open Letter</span>
                  <Mail size={12} />
                </div>
              </div>
            ))
          )}
        </div>

        <button type="button" className="pb-letterFab" onClick={() => setIsWriting(true)} title="Write letter">
          <PenTool size={20} />
        </button>
      </div>
    );
  };

  const renderLetters = () => {
    if (isWriting) return renderLettersCompose();
    if (selectedLetter) return renderLettersOpen();
    return renderLettersCarousel();
  };

  /* =========================
     Tabs + Render
  ========================== */
  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    onClearHover();

    if (tab !== "Letters") {
      setIsWriting(false);
      setSelectedLetter(null);
    }

    if (tab !== "About") {
      setIsEditingAbout(false);
      setSelectedBlockId(aboutBlocks[0]?.id ?? null);
    }
  };

  return (
    <>
      <div className="pb-tabs">
        {/* LEFT — Library */}
        <div className="pb-tabsLeft">
          {activeTab === "Library" ? (
            <Link
              to="/library"
              className="pb-tab pb-tab--library is-active"
              title="Go to Library »"
            >
              Go to Library »
            </Link>
          ) : (
            <button
              type="button"
              className="pb-tab pb-tab--library"
              onClick={() => switchTab("Library")}
              title="Library"
            >
              Library
            </button>
          )}
        </div>

        {/* RIGHT — About / Forum / Letters */}
        <div className="pb-tabsRight">
          <button
            type="button"
            className={["pb-tab pb-tab--about", activeTab === "About" ? "is-active" : ""].join(" ")}
            onClick={() => switchTab("About")}
            title="About"
          >
            About
          </button>

          <button
            type="button"
            className={["pb-tab pb-tab--forum", activeTab === "Forum" ? "is-active" : ""].join(" ")}
            onClick={() => switchTab("Forum")}
            title="Forum"
          >
            Forum
          </button>

          <button
            type="button"
            className={["pb-tab pb-tab--letters", activeTab === "Letters" ? "is-active" : ""].join(" ")}
            onClick={() => switchTab("Letters")}
            title="Letters"
          >
            Letters
          </button>
        </div>
      </div>

      {activeTab === "Library" ? (
        renderLibraryDirectChild()
      ) : activeTab === "About" ? (
        renderAbout()
      ) : activeTab === "Forum" ? (
        <div className="pb-pane pb-pane--light">
          <MessageSquare size={64} className="pb-paneIcon" />
          <div className="pb-placeholderTitle">Community Forum</div>
          <div className="pb-placeholderSub">Threads coming soon...</div>
        </div>
      ) : (
        renderLetters()
      )}
    </>
  );
}
