// src/components/ReaderMenu.tsx
import { useEffect, useRef, useState } from "react";

type ReaderTheme = "cream" | "dark" | "white";
type PageSize = "sm" | "md" | "lg";

type TypographyOptions = {
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  theme?: ReaderTheme;
  pageSize?: PageSize;
};

type DictSense = { definition: string; example?: string };
type DictEntry = {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  senses: DictSense[];
};

type TTSState = {
  speaking: boolean;
  paused: boolean;
  rate: number;
  pitch: number;
  voiceURI?: string;
};

type ReaderMenuProps = {
  visible: boolean;
  onApplyTypography: (opts: TypographyOptions) => void;
  getVisiblePageText: () => string;
};

const FONT_SIZES = [13, 14, 15, 16, 18] as const;

const FONT_STYLES = [
  { name: "Default (Times New Roman)", css: "'Times New Roman', Times, serif" },
  { name: "Sans-serif (Inter)", css: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { name: "Sans-serif (Roboto)", css: "'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { name: "Sans-serif (Open Sans)", css: "'Open Sans', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { name: "Sans-serif (Lato)", css: "'Lato', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { name: "Serif (Merriweather)", css: "'Merriweather', Georgia, 'Times New Roman', serif" },
] as const;

/** Google Material Symbols (Rounded) */
function GIcon({
  name,
  className,
  title,
  size = 20,
}: {
  name: string;
  className?: string;
  title?: string;
  size?: number;
}) {
  return (
    <span
      className={"material-symbols-rounded" + (className ? ` ${className}` : "")}
      aria-hidden="true"
      title={title}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {name}
    </span>
  );
}

export default function ReaderMenu({
  visible,
  onApplyTypography,
  getVisiblePageText,
}: ReaderMenuProps) {
  // bottom sheet open/closed
  const [isOpen, setIsOpen] = useState(false);

  // typography controls
  const [fontSizeIndex, setFontSizeIndex] = useState<0 | 1 | 2 | 3 | 4>(2);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [fontStyleIndex, setFontStyleIndex] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  // theme: 0 = cream, 1 = dark, 2 = white
  const [themeIndex, setThemeIndex] = useState<0 | 1 | 2>(2);

  // page size
  const [pageSize, setPageSize] = useState<PageSize>("md");

  const currentTheme: ReaderTheme =
    themeIndex === 0 ? "cream" : themeIndex === 1 ? "dark" : "white";

  const themeLabel = (() => {
    if (themeIndex === 0) return "Switch to dark mode";
    if (themeIndex === 1) return "Switch to white page";
    return "Switch to cream page";
  })();

  // Popovers
  const [fontPanelOpen, setFontPanelOpen] = useState(false);
  const [fontStylePanelOpen, setFontStylePanelOpen] = useState(false);
  const [dictOpen, setDictOpen] = useState(false);
  const [notePanelOpen, setNotePanelOpen] = useState(false);
  const [ttsOpen, setTtsOpen] = useState(false);

  const fontBtnRef = useRef<HTMLButtonElement | null>(null);
  const fontPanelRef = useRef<HTMLDivElement | null>(null);
  const fontStyleBtnRef = useRef<HTMLButtonElement | null>(null);
  const fontStylePanelRef = useRef<HTMLDivElement | null>(null);
  const dictBtnRef = useRef<HTMLButtonElement | null>(null);
  const dictPanelRef = useRef<HTMLDivElement | null>(null);
  const dictInputRef = useRef<HTMLInputElement | null>(null);
  const noteBtnRef = useRef<HTMLButtonElement | null>(null);
  const notePanelRef = useRef<HTMLDivElement | null>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ttsBtnRef = useRef<HTMLButtonElement | null>(null);
  const ttsPanelRef = useRef<HTMLDivElement | null>(null);

  // dictionary
  const [dictQuery, setDictQuery] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState<string | null>(null);
  const [dictResults, setDictResults] = useState<DictEntry[] | null>(null);

  // notepad
  const [notes, setNotes] = useState("");

  // TTS
  const [tts, setTts] = useState<TTSState>({
    speaking: false,
    paused: false,
    rate: 1.0,
    pitch: 1.0,
    voiceURI: undefined,
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const t = e.target as Node;

      if (fontPanelOpen && !fontPanelRef.current?.contains(t) && !fontBtnRef.current?.contains(t)) {
        setFontPanelOpen(false);
      }
      if (
        fontStylePanelOpen &&
        !fontStylePanelRef.current?.contains(t) &&
        !fontStyleBtnRef.current?.contains(t)
      ) {
        setFontStylePanelOpen(false);
      }
      if (dictOpen && !dictPanelRef.current?.contains(t) && !dictBtnRef.current?.contains(t)) {
        setDictOpen(false);
      }
      if (notePanelOpen && !notePanelRef.current?.contains(t) && !noteBtnRef.current?.contains(t)) {
        setNotePanelOpen(false);
      }
      if (ttsOpen && !ttsPanelRef.current?.contains(t) && !ttsBtnRef.current?.contains(t)) {
        setTtsOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFontPanelOpen(false);
        setFontStylePanelOpen(false);
        setDictOpen(false);
        setNotePanelOpen(false);
        setTtsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [fontPanelOpen, fontStylePanelOpen, dictOpen, notePanelOpen, ttsOpen]);

  // Focus dictionary input when open
  useEffect(() => {
    if (dictOpen) setTimeout(() => dictInputRef.current?.focus(), 0);
  }, [dictOpen]);

  // Focus notepad textarea when open
  useEffect(() => {
    if (notePanelOpen && noteTextareaRef.current) {
      const ta = noteTextareaRef.current;
      ta.focus();
      const end = ta.value.length;
      ta.setSelectionRange(end, end);
    }
  }, [notePanelOpen]);

  // TTS: load voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function loadVoices() {
      const v = window.speechSynthesis.getVoices() || [];
      setVoices(v);
      setTts((s) => {
        if (s.voiceURI) return s;
        const firstEn = v.find((x) => x.lang?.startsWith("en"));
        return { ...s, voiceURI: firstEn?.voiceURI ?? v[0]?.voiceURI };
      });
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // If menu is hidden (book closed), stop TTS
  useEffect(() => {
    if (!visible) stopTTS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Dictionary lookup
  async function lookupWord(q: string) {
    const word = q.trim();
    if (!word) return;
    setDictLoading(true);
    setDictError(null);
    setDictResults(null);
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      const entries: DictEntry[] = (Array.isArray(data) ? data : [])
        .slice(0, 3)
        .map((e: any) => {
          const phon = e.phonetic || e.phonetics?.[0]?.text || undefined;
          const firstPOS = e.meanings?.[0]?.partOfSpeech || undefined;
          const senses: DictSense[] = (e.meanings || []).flatMap((m: any) =>
            (m.definitions || [])
              .slice(0, 2)
              .map((d: any) => ({
                definition: d.definition,
                example: d.example,
              }))
          );
          return { word: e.word, phonetic: phon, partOfSpeech: firstPOS, senses };
        });

      if (!entries.length) throw new Error("No results");
      setDictResults(entries);
    } catch {
      setDictError("No definition found.");
    } finally {
      setDictLoading(false);
    }
  }

  function onDictSubmit(e: React.FormEvent) {
    e.preventDefault();
    lookupWord(dictQuery);
  }

  // --- TTS handlers ---
  function playTTS() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = getVisiblePageText();
    if (!text.trim()) return;

    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }

    const u = new SpeechSynthesisUtterance(text);
    u.rate = tts.rate;
    u.pitch = tts.pitch;

    const voice = voices.find((v) => v.voiceURI === tts.voiceURI);
    if (voice) u.voice = voice;

    u.onstart = () => setTts((s) => ({ ...s, speaking: true, paused: false }));
    u.onend = () => {
      setTts((s) => ({ ...s, speaking: false, paused: false }));
      utterRef.current = null;
    };
    u.onerror = () => {
      setTts((s) => ({ ...s, speaking: false, paused: false }));
      utterRef.current = null;
    };

    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }

  function pauseTTS() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!utterRef.current) return;
    try {
      window.speechSynthesis.pause();
      setTts((s) => ({ ...s, paused: true }));
    } catch {
      // ignore
    }
  }

  function resumeTTS() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!utterRef.current) return;
    try {
      window.speechSynthesis.resume();
      setTts((s) => ({ ...s, paused: false }));
    } catch {
      // ignore
    }
  }

  function stopTTS() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    utterRef.current = null;
    setTts((s) => ({ ...s, speaking: false, paused: false }));
  }

  if (!visible) return null;

  // Theme icon mapping (Google icons)
  const themeIconName =
    currentTheme === "cream" ? "icecream" : currentTheme === "dark" ? "dark_mode" : "light_mode";

  return (
    <div className={"reader-menu" + (isOpen ? " is-open" : "")} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="reader-menu-toggle"
        aria-label={isOpen ? "Hide reader menu" : "Show reader menu"}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((o) => !o);
        }}
      >
        <span className="reader-menu-chevron" aria-hidden="true">
          <GIcon name="expand_less" />
        </span>
      </button>

      <div
        className="reader-menu-panel"
        role="menu"
        aria-hidden={!isOpen}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reader-menu-grid">
          {/* Font & line spacing */}
          <button
            ref={fontBtnRef}
            type="button"
            className={"reader-menu-item" + (fontPanelOpen ? " is-active" : "")}
            role="menuitem"
            aria-label="Font & line spacing"
            aria-haspopup="dialog"
            aria-expanded={fontPanelOpen}
            onClick={(e) => {
              e.stopPropagation();
              setFontPanelOpen((o) => !o);
            }}
            style={{ position: "relative" }}
          >
            <GIcon name="format_size" />
            {fontPanelOpen && (
              <div
                ref={fontPanelRef}
                className="reader-popover"
                role="dialog"
                aria-label="Reading appearance"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Font size */}
                <div className="rm-section">
                  <div className="rm-section-head">
                    <span className="rm-section-title">Font size</span>
                  </div>

                  <div className="font-size-row" role="radiogroup" aria-label="Font size">
                    {FONT_SIZES.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={"font-size-option" + (fontSizeIndex === idx ? " is-active" : "")}
                        role="radio"
                        aria-checked={fontSizeIndex === idx}
                        onClick={() => {
                          const newIndex = idx as 0 | 1 | 2 | 3 | 4;
                          setFontSizeIndex(newIndex);

                          const fontSize = FONT_SIZES[newIndex];
                          const fontFamily = FONT_STYLES[fontStyleIndex].css;

                          onApplyTypography({ fontSize, lineHeight, fontFamily });
                        }}
                        title={idx < 2 ? "Smaller" : idx === 2 ? "Default" : "Larger"}
                      >
                        <span style={{ fontSize: `${(14 * (0.85 + 0.1 * idx)).toFixed(2)}px` }}>A</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line spacing */}
                <div className="rm-section">
                  <div className="rm-section-head">
                    <span className="rm-section-title">Line spacing</span>
                    <span className="rm-value">{lineHeight.toFixed(2)}×</span>
                  </div>

                  <input
                    id="lh-range"
                    className="lh-range"
                    type="range"
                    min={1.2}
                    max={2.0}
                    step={0.05}
                    value={lineHeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLineHeight(val);

                      const fontSize = FONT_SIZES[fontSizeIndex];
                      const fontFamily = FONT_STYLES[fontStyleIndex].css;

                      onApplyTypography({ fontSize, lineHeight: val, fontFamily });
                    }}
                    aria-valuemin={1.2}
                    aria-valuemax={2.0}
                    aria-valuenow={lineHeight}
                  />
                </div>

                {/* Page size (segmented control) */}
                <div className="rm-section">
                  <div className="rm-section-head">
                    <span className="rm-section-title">Page size</span>
                  </div>

                  <div className="rm-segment" role="radiogroup" aria-label="Page size">
                    {(["sm", "md", "lg"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={"rm-seg-btn" + (pageSize === k ? " is-active" : "")}
                        role="radio"
                        aria-checked={pageSize === k}
                        onClick={() => {
                          setPageSize(k);
                          onApplyTypography({ pageSize: k });
                        }}
                      >
                        {k === "sm" ? "Small" : k === "md" ? "Medium" : "Large"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </button>

          {/* Font style */}
          <button
            ref={fontStyleBtnRef}
            type="button"
            className={"reader-menu-item" + (fontStylePanelOpen ? " is-active" : "")}
            role="menuitem"
            aria-label="Font style"
            aria-haspopup="dialog"
            aria-expanded={fontStylePanelOpen}
            onClick={(e) => {
              e.stopPropagation();
              setFontStylePanelOpen((o) => !o);
            }}
            style={{ position: "relative" }}
          >
            <GIcon name="font_download" />
            {fontStylePanelOpen && (
              <div
                ref={fontStylePanelRef}
                className="reader-popover reader-fontstyle-popover"
                role="dialog"
                aria-label="Font style"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rm-pop-title">Font style</div>

                <div className="font-style-grid">
                  {FONT_STYLES.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={"font-style-option" + (fontStyleIndex === idx ? " is-active" : "")}
                      onClick={() => {
                        const newIndex = idx as 0 | 1 | 2 | 3 | 4 | 5;
                        setFontStyleIndex(newIndex);

                        const fontSize = FONT_SIZES[fontSizeIndex];
                        const fontFamily = FONT_STYLES[newIndex].css;

                        onApplyTypography({ fontSize, lineHeight, fontFamily });
                      }}
                      title={f.name}
                      style={{ fontFamily: f.css }}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </div>
            )}
          </button>

          {/* Theme */}
          <button
            type="button"
            className="reader-menu-item"
            role="menuitem"
            aria-label={themeLabel}
            aria-pressed={true}
            onClick={(e) => {
              e.stopPropagation();
              const nextIndex = ((themeIndex + 1) % 3) as 0 | 1 | 2;
              setThemeIndex(nextIndex);

              const nextTheme: ReaderTheme =
                nextIndex === 0 ? "cream" : nextIndex === 1 ? "dark" : "white";

              onApplyTypography({ theme: nextTheme });
            }}
            title={themeLabel}
          >
            <GIcon name={themeIconName} />
          </button>

          {/* Collapse menu */}
          <button
            type="button"
            className="reader-menu-item"
            role="menuitem"
            aria-label="Close reader menu"
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <GIcon name="keyboard_arrow_down" />
          </button>

          {/* Dictionary */}
          <div className="reader-menu-item-wrap">
            <button
              ref={dictBtnRef}
              type="button"
              className={"reader-menu-item" + (dictOpen ? " is-active" : "")}
              role="menuitem"
              aria-label="Dictionary"
              aria-haspopup="dialog"
              aria-expanded={dictOpen}
              onClick={(e) => {
                e.stopPropagation();
                setDictOpen((o) => !o);
              }}
              title="Dictionary"
            >
              <GIcon name="dictionary" />
            </button>

            {dictOpen && (
              <div
                ref={dictPanelRef}
                className="reader-popover reader-dict-popover"
                role="dialog"
                aria-label="Dictionary lookup"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="dict-title">Dictionary</h3>
                <form className="dict-form" onSubmit={onDictSubmit}>
                  <input
                    ref={dictInputRef}
                    className="dict-input"
                    type="text"
                    placeholder="Type a word…"
                    value={dictQuery}
                    onChange={(e) => setDictQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label="Enter a word"
                  />
                  <button className="dict-go" type="submit" disabled={dictLoading || !dictQuery.trim()}>
                    {dictLoading ? "…" : "Define"}
                  </button>
                </form>

                <div className="dict-results">
                  {dictError && <div className="dict-error">{dictError}</div>}
                  {!dictError &&
                    dictResults?.map((en, i) => (
                      <div key={i} className="dict-entry">
                        <div className="dict-head">
                          <span className="dict-word">{en.word}</span>
                          {en.phonetic && <span className="dict-phon">{en.phonetic}</span>}
                          {en.partOfSpeech && <span className="dict-pos">{en.partOfSpeech}</span>}
                        </div>
                        <ol className="dict-senses">
                          {en.senses.slice(0, 4).map((s, j) => (
                            <li key={j}>
                              <span className="dict-def">{s.definition}</span>
                              {s.example && <div className="dict-eg">“{s.example}”</div>}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Notepad */}
          <div className="reader-menu-item-wrap">
            <button
              ref={noteBtnRef}
              type="button"
              className={"reader-menu-item" + (notePanelOpen ? " is-active" : "")}
              role="menuitem"
              aria-label="Notepad"
              onClick={(e) => {
                e.stopPropagation();
                setNotePanelOpen((o) => !o);
              }}
              title="Notepad"
            >
              <GIcon name="edit_note" />
            </button>

            {notePanelOpen && (
              <div
                ref={notePanelRef}
                className="reader-popover reader-note-popover"
                role="dialog"
                aria-label="Notepad"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="note-title">Notepad</h3>
                <textarea
                  ref={noteTextareaRef}
                  className="note-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Write your notes here…"
                />
              </div>
            )}
          </div>

          {/* TTS */}
          <div className="reader-menu-item-wrap">
            <button
              ref={ttsBtnRef}
              type="button"
              className={"reader-menu-item" + (ttsOpen ? " is-active" : "")}
              role="menuitem"
              aria-label="Read Aloud"
              aria-haspopup="dialog"
              aria-expanded={ttsOpen}
              onClick={(e) => {
                e.stopPropagation();
                setTtsOpen((o) => !o);
              }}
              title="Read Aloud"
            >
              <GIcon name="volume_up" />
            </button>

            {ttsOpen && (
              <div
                ref={ttsPanelRef}
                className="reader-popover reader-tts-popover"
                role="dialog"
                aria-label="Read Aloud controls"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="tts-title">Read Aloud</h3>

                <div className="tts-controls">
                  {!tts.speaking && (
                    <button className="tts-btn tts-play" type="button" onClick={playTTS}>
                      Play
                    </button>
                  )}
                  {tts.speaking && !tts.paused && (
                    <button className="tts-btn tts-pause" type="button" onClick={pauseTTS}>
                      Pause
                    </button>
                  )}
                  {tts.speaking && tts.paused && (
                    <button className="tts-btn tts-resume" type="button" onClick={resumeTTS}>
                      Resume
                    </button>
                  )}
                  <button className="tts-btn tts-stop" type="button" onClick={stopTTS}>
                    Stop
                  </button>
                </div>

                <div className="tts-row">
                  <label className="tts-label" htmlFor="tts-voice">
                    Voice
                  </label>
                  <select
                    id="tts-voice"
                    className="tts-select"
                    value={tts.voiceURI || ""}
                    onChange={(e) => setTts((s) => ({ ...s, voiceURI: e.target.value }))}
                  >
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} {v.lang ? `(${v.lang})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="tts-row">
                  <label className="tts-label" htmlFor="tts-rate">
                    Rate
                  </label>
                  <input
                    id="tts-rate"
                    className="tts-range"
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={tts.rate}
                    onChange={(e) => setTts((s) => ({ ...s, rate: parseFloat(e.target.value) }))}
                  />
                  <div className="tts-value">{tts.rate.toFixed(2)}×</div>
                </div>

                <div className="tts-row">
                  <label className="tts-label" htmlFor="tts-pitch">
                    Pitch
                  </label>
                  <input
                    id="tts-pitch"
                    className="tts-range"
                    type="range"
                    min={0.8}
                    max={1.2}
                    step={0.05}
                    value={tts.pitch}
                    onChange={(e) => setTts((s) => ({ ...s, pitch: parseFloat(e.target.value) }))}
                  />
                  <div className="tts-value">{tts.pitch.toFixed(2)}</div>
                </div>

                <p className="tts-hint">
                  Reads the visible pages. Turning pages will not break playback, but it will only read the
                  current spread when you press Play again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}