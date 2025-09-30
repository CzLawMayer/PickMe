import { useRef, useState, useCallback, useEffect } from "react"
import "./Home.css"
import { sampleBooks } from "../booksData"

import LikeButton from "@/components/LikeButton"
import StarButton from "@/components/StarButton"
import SaveButton from "@/components/SaveButton"

import SideMenu from "@/components/SideMenu"

// ---------- Types ----------
type Book = {
  id: string
  title: string
  author?: string
  user?: string
  coverUrl?: string
  backCoverUrl?: string
  tags?: string[]
  rating?: string | number
  ratingCount?: number
  likes?: number
  bookmarks?: number
  currentChapter?: number
  totalChapters?: number
  dedication?: string
  chapters?: string[]
  chapterTexts?: string[] // optional full chapter texts
}

type BookView = "front" | "back" | "open"

// ---------- Reader presets ----------
export const FONT_SCALES = [0.85, 0.95, 1.0, 1.1, 1.25] as const

export const FONT_STYLES = [
  { name: "Serif (Georgia)", css: "Georgia, 'Times New Roman', serif" },
  { name: "Sans-serif (Arial)", css: "Arial, Helvetica, sans-serif" },
  { name: "Sans-serif (Roboto)", css: "'Roboto', sans-serif" },
  { name: "Serif (Merriweather)", css: "'Merriweather', serif" },
  { name: "Sans-serif (Open Sans)", css: "'Open Sans', sans-serif" },
  { name: "Monospace (Courier)", css: "'Courier New', Courier, monospace" },
] as const

// ---------- helpers (module-level) ----------
function mod(x: number, n: number) {
  return n ? ((x % n) + n) % n : 0
}
function lastEven(n: number) {
  if (!Number.isFinite(n)) return 0
  const m = Math.max(0, Math.floor(n))
  return m % 2 === 0 ? m : m - 1
}
function splitParagraphs(raw: string): string[] {
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/g)
    .map((p) => p.trim())
    .filter(Boolean)
}

// ---------- Component ----------
export default function Home() {
  // data
  const [books] = useState<Book[]>(Array.isArray(sampleBooks) ? sampleBooks : [])
  const count = books.length

  // selection / ui
  const [current, setCurrent] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  // book state
  const [view, setView] = useState<BookView>("front")
  const [isOpening, setIsOpening] = useState(false)
  const [page, setPage] = useState(0)

  // reader menu (bottom sheet)
  const [readerMenuOpen, setReaderMenuOpen] = useState(false)

  // Typography customization
  const [fontPanelOpen, setFontPanelOpen] = useState(false)
  const fontBtnRef = useRef<HTMLButtonElement | null>(null)
  const fontPanelRef = useRef<HTMLDivElement | null>(null)
  const [fontSizeIndex, setFontSizeIndex] = useState<0 | 1 | 2 | 3 | 4>(2)
  const [lineHeight, setLineHeight] = useState(1.7)
  const [readerLight, setReaderLight] = useState(false)

  // Font style popover
  const [fontStylePanelOpen, setFontStylePanelOpen] = useState(false)
  const fontStyleBtnRef = useRef<HTMLButtonElement | null>(null)
  const fontStylePanelRef = useRef<HTMLDivElement | null>(null)
  const [fontStyleIndex, setFontStyleIndex] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)

  // Dictionary (popover)
  const [dictOpen, setDictOpen] = useState(false)
  const dictBtnRef = useRef<HTMLButtonElement | null>(null)
  const dictPanelRef = useRef<HTMLDivElement | null>(null)
  const [dictQuery, setDictQuery] = useState("")
  const [dictLoading, setDictLoading] = useState(false)
  const [dictError, setDictError] = useState<string | null>(null)
  type DictSense = { definition: string; example?: string }
  type DictEntry = { word: string; phonetic?: string; partOfSpeech?: string; senses: DictSense[] }
  const [dictResults, setDictResults] = useState<DictEntry[] | null>(null)
  const dictInputRef = useRef<HTMLInputElement | null>(null)

  // Notepad (popover)
  const [notePanelOpen, setNotePanelOpen] = useState(false)
  const noteBtnRef = useRef<HTMLButtonElement | null>(null)
  const notePanelRef = useRef<HTMLDivElement | null>(null)
  const [notes, setNotes] = useState("")
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  // TTS (popover)
  const [ttsOpen, setTtsOpen] = useState(false)
  const ttsBtnRef = useRef<HTMLButtonElement | null>(null)
  const ttsPanelRef = useRef<HTMLDivElement | null>(null)
  type TTSState = { speaking: boolean; paused: boolean; rate: number; pitch: number; voiceURI?: string }
  const [tts, setTts] = useState<TTSState>({ speaking: false, paused: false, rate: 1.0, pitch: 1.0, voiceURI: undefined })
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  // Close the reader menu any time we leave "open" view
  useEffect(() => { if (view !== "open") setReaderMenuOpen(false) }, [view])

  // Close popovers on outside click / Esc
  useEffect(() => {
    if (!fontPanelOpen) return
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (fontPanelRef.current?.contains(t) || fontBtnRef.current?.contains(t)) return
      setFontPanelOpen(false)
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setFontPanelOpen(false) }
    document.addEventListener("mousedown", onDocMouseDown)
    window.addEventListener("keydown", onEsc)
    return () => { document.removeEventListener("mousedown", onDocMouseDown); window.removeEventListener("keydown", onEsc) }
  }, [fontPanelOpen])

  useEffect(() => {
    if (!fontStylePanelOpen) return
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (fontStylePanelRef.current?.contains(t) || fontStyleBtnRef.current?.contains(t)) return
      setFontStylePanelOpen(false)
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setFontStylePanelOpen(false) }
    document.addEventListener("mousedown", onDocMouseDown)
    window.addEventListener("keydown", onEsc)
    return () => { document.removeEventListener("mousedown", onDocMouseDown); window.removeEventListener("keydown", onEsc) }
  }, [fontStylePanelOpen])

  useEffect(() => {
    if (!dictOpen) return
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (dictPanelRef.current?.contains(t) || dictBtnRef.current?.contains(t)) return
      setDictOpen(false)
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setDictOpen(false) }
    document.addEventListener("mousedown", onDocMouseDown)
    window.addEventListener("keydown", onEsc)
    return () => { document.removeEventListener("mousedown", onDocMouseDown); window.removeEventListener("keydown", onEsc) }
  }, [dictOpen])
  useEffect(() => { if (dictOpen) { setFontPanelOpen(false); setFontStylePanelOpen(false) } }, [dictOpen])
  useEffect(() => { if (dictOpen) setTimeout(() => dictInputRef.current?.focus(), 0) }, [dictOpen])

  useEffect(() => {
    if (!notePanelOpen) return
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (notePanelRef.current?.contains(t) || noteBtnRef.current?.contains(t)) return
      setNotePanelOpen(false)
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setNotePanelOpen(false) }
    document.addEventListener("mousedown", onDocMouseDown)
    window.addEventListener("keydown", onEsc)
    return () => { document.removeEventListener("mousedown", onDocMouseDown); window.removeEventListener("keydown", onEsc) }
  }, [notePanelOpen])
  useEffect(() => {
    if (notePanelOpen && noteTextareaRef.current) {
      const ta = noteTextareaRef.current
      ta.focus()
      const end = ta.value.length
      ta.setSelectionRange(end, end)
    }
  }, [notePanelOpen])

  // Auto-close one popover when the other opens
  useEffect(() => { if (fontPanelOpen) setFontStylePanelOpen(false) }, [fontPanelOpen])
  useEffect(() => { if (fontStylePanelOpen) setFontPanelOpen(false) }, [fontStylePanelOpen])

  // TTS: load voices
  useEffect(() => {
    function loadVoices() {
      const v = typeof window !== "undefined" ? (window.speechSynthesis?.getVoices?.() ?? []) : []
      setVoices(v)
      if (!tts.voiceURI && v.length) {
        setTts((s) => ({ ...s, voiceURI: v.find((x) => x.lang?.startsWith("en"))?.voiceURI || v[0]?.voiceURI }))
      }
    }
    loadVoices()
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null
    }
  }, [tts.voiceURI])
  useEffect(() => { if (view !== "open") setTtsOpen(false) }, [view])
  useEffect(() => () => { try { window.speechSynthesis?.cancel() } catch {} }, [])
  useEffect(() => {
    try { window.speechSynthesis?.cancel() } catch {}
    setTts((s) => ({ ...s, speaking: false, paused: false }))
  }, [current, page])

  function getVisiblePageText() {
    if (view !== "open") return ""
    const root = document.querySelector(".spread.is-open") as HTMLElement | null
    if (!root) return ""
    const bodies = Array.from(root.querySelectorAll(".chapter-page .chapter-body")) as HTMLElement[]
    const text = bodies.map((b) => b.innerText || "").join("\n\n").trim()
    return text || "No readable chapter text on this spread."
  }
  function playTTS() {
    const synth = window.speechSynthesis
    if (!synth) return
    const text = getVisiblePageText()
    if (!text) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = tts.rate
    u.pitch = tts.pitch
    const v = voices.find((vv) => vv.voiceURI === tts.voiceURI)
    if (v) u.voice = v
    u.onstart = () => setTts((s) => ({ ...s, speaking: true, paused: false }))
    u.onpause = () => setTts((s) => ({ ...s, paused: true }))
    u.onresume = () => setTts((s) => ({ ...s, paused: false }))
    u.onend = () => setTts((s) => ({ ...s, speaking: false, paused: false }))
    u.onerror = () => setTts((s) => ({ ...s, speaking: false, paused: false }))
    synth.speak(u)
  }
  function pauseTTS() {
    try {
      if (window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause()
        setTts((s) => ({ ...s, paused: true }))
      }
    } catch {}
  }
  function resumeTTS() {
    try {
      if (window.speechSynthesis?.paused) {
        window.speechSynthesis.resume()
        setTts((s) => ({ ...s, paused: false }))
      }
    } catch {}
  }
  function stopTTS() { try { window.speechSynthesis?.cancel() } catch {}; setTts((s) => ({ ...s, speaking: false, paused: false })) }

  // Focus dictionary input when open
  useEffect(() => { if (dictOpen) setTimeout(() => dictInputRef.current?.focus(), 0) }, [dictOpen])

  // Dictionary fetch
  async function lookupWord(q: string) {
    const word = q.trim()
    if (!word) return
    setDictLoading(true); setDictError(null); setDictResults(null)
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      const entries: DictEntry[] = (Array.isArray(data) ? data : []).slice(0, 3).map((e: any) => {
        const phon = e.phonetic || e.phonetics?.[0]?.text || undefined
        const firstPOS = e.meanings?.[0]?.partOfSpeech || undefined
        const senses: DictSense[] =
          (e.meanings || []).flatMap((m: any) =>
            (m.definitions || []).slice(0, 2).map((d: any) => ({
              definition: d.definition,
              example: d.example,
            }))
          )
        return { word: e.word, phonetic: phon, partOfSpeech: firstPOS, senses }
      })
      if (!entries.length) throw new Error("No results")
      setDictResults(entries)
    } catch {
      setDictError("No definition found.")
    } finally {
      setDictLoading(false)
    }
  }
  function onDictSubmit(e: React.FormEvent) { e.preventDefault(); lookupWord(dictQuery) }

  // Close both font popovers when leaving open-book view
  useEffect(() => {
    if (view !== "open") { setFontPanelOpen(false); setFontStylePanelOpen(false) }
  }, [view])

  const center: Book | null = count ? books[mod(current, count)] : null
  const isOpenLayout = view === "open" || isOpening

  // when switching books, go back to the front cover
  useEffect(() => { setView("front"); setPage(0) }, [current])

  // ---------- Per-book toggles ----------
  const [likedById, setLikedById] = useState<Record<string, boolean>>({})
  const [savedById, setSavedById] = useState<Record<string, boolean>>({})
  const [userRatingById, setUserRatingById] = useState<Record<string, number>>({})
  const centerId = center?.id ?? ""
  const liked = !!(centerId && likedById[centerId])
  const saved = !!(centerId && savedById[centerId])
  const userRating = centerId ? (userRatingById[centerId] ?? 0) : 0
  const displayLikes = (center?.likes ?? 0) + (liked ? 1 : 0)
  const displaySaves = (center?.bookmarks ?? 0) + (saved ? 1 : 0)
  const baseRating = typeof center?.rating === "string" ? parseFloat(String(center?.rating).split("/")[0] || "0") : Number(center?.rating ?? 0)
  const votesRaw = center?.ratingCount ?? 0
  const votes = Number.isFinite(Number(votesRaw)) ? Number(votesRaw) : 0
  const PRIOR_VOTES = 20
  const combinedRating =
    userRating > 0
      ? votes > 0
        ? (baseRating * votes + userRating) / (votes + 1)
        : baseRating > 0
        ? (baseRating * PRIOR_VOTES + userRating) / (PRIOR_VOTES + 1)
        : userRating
      : baseRating

  // ---------- Carousel nav (closed) ----------
  const next = useCallback(() => { if (!count) return; setCurrent((c) => mod(c + 1, count)) }, [count])
  const prev = useCallback(() => { if (!count) return; setCurrent((c) => mod(c - 1, count)) }, [count])

  // ---------- Pagination state/refs ----------
  const spreadRef = useRef<HTMLDivElement | null>(null)
  const paneLeftRef = useRef<HTMLDivElement | null>(null)
  const paneRightRef = useRef<HTMLDivElement | null>(null)
  const probeRef = useRef<HTMLDivElement | null>(null)
  const [pageBox, setPageBox] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [chap1Pages, setChap1Pages] = useState<React.ReactNode[]>([])

  // Measure the available content box inside a page (based on the open spread)
// Paginate chapter 1 into fixed-height, line-snapped pages (accounts for flex gap)
  useEffect(() => {
    if (!center) return;
    if (view !== "open") return;

    const raf = requestAnimationFrame(() => {
      if (!probeRef.current) return;

      // 1) Sync probe with current reader typography
      const probeRoot = probeRef.current as HTMLElement;
      probeRoot.style.setProperty("--reader-font-scale", String(FONT_SCALES[fontSizeIndex]));
      probeRoot.style.setProperty("--reader-line", String(lineHeight));
      probeRoot.style.setProperty("--reader-font-family", FONT_STYLES[fontStyleIndex].css);

      // 2) Measure exact visible page
      const pane = paneLeftRef.current || paneRightRef.current;
      if (!pane) return;
      const paneRect = pane.getBoundingClientRect();
      const pageW = paneRect.width;   // keep fractional px
      const pageH = paneRect.height;  // keep fractional px
      if (!pageW || !pageH) return;

      // 3) Input text
      const textRaw =
        Array.isArray(center.chapterTexts) && center.chapterTexts.length > 0
          ? String(center.chapterTexts[0] ?? "")
          : "";
      if (!textRaw.trim()) { setChap1Pages([]); return; }
      const paragraphs = splitParagraphs(textRaw);

      // 4) Probe DOM handles
      const pageEl  = probeRef.current!.querySelector(".chapter-page") as HTMLElement;
      const titleEl = probeRef.current!.querySelector(".chapter-title") as HTMLElement;
      const bodyEl  = probeRef.current!.querySelector(".chapter-body") as HTMLElement;

      // Size probe page exactly like visible page
      pageEl.style.width = `${pageW}px`;
      pageEl.style.height = `${pageH}px`;
      pageEl.style.boxSizing = "border-box";

      // Mirror live padding
      let padTop = "6vmin", padRight = "6vmin", padBottom = "6vmin", padLeft = "6vmin";
      const visiblePage = document.querySelector(".spread .chapter-page") as HTMLElement | null;
      if (visiblePage) {
        const cs = getComputedStyle(visiblePage);
        padTop    = cs.paddingTop    || padTop;
        padRight  = cs.paddingRight  || padRight;
        padBottom = cs.paddingBottom || padBottom;
        padLeft   = cs.paddingLeft   || padLeft;
      }
      pageEl.style.paddingTop = padTop;
      pageEl.style.paddingRight = padRight;
      pageEl.style.paddingBottom = padBottom;
      pageEl.style.paddingLeft = padLeft;

      // In the probe, let body grow so scrollHeight reflects overflow
      bodyEl.style.flex = "0 0 auto";
      bodyEl.style.minHeight = "0";
      bodyEl.style.overflow = "visible";

      // ---- LINE GRID & CONTENT BOX ----
      const csPage = getComputedStyle(pageEl);
      const pT = parseFloat(csPage.paddingTop)    || 0;
      const pB = parseFloat(csPage.paddingBottom) || 0;
      const CONTENT_H = pageH - pT - pB;

      // Actual line-height in px
      let linePx = parseFloat(getComputedStyle(bodyEl).lineHeight);
      if (!isFinite(linePx) || linePx <= 0) {
        const tmp = document.createElement("span");
        tmp.textContent = "A";
        tmp.style.visibility = "hidden";
        bodyEl.appendChild(tmp);
        linePx = tmp.getBoundingClientRect().height || 16;
        bodyEl.removeChild(tmp);
      }

      const SAFETY_PAD = 1; // px cushion so rounding never admits a half line
      const snapToLineGrid = (h: number) => {
        const lines = Math.max(0, Math.floor((h - SAFETY_PAD) / linePx));
        return lines * linePx;
      };

      const BLANK_BODY_H = snapToLineGrid(CONTENT_H);

      // Read the container's flex row-gap (this was the missing piece)
      const rowGap =
        parseFloat((csPage as any).rowGap || csPage.gap || "0") || 0;

      // Set body height for pages with/without title, subtracting title height + margin + row gap
      const setBodyHeightFor = (withTitle: boolean) => {
        const tH   = withTitle ? titleEl.getBoundingClientRect().height : 0; // fractional height
        const tGap = withTitle ? (parseFloat(getComputedStyle(titleEl).marginBottom) || 0) : 0;
        const inter = withTitle ? (tGap + rowGap) : 0; // ← account for flex gap too
        const target  = Math.max(0, CONTENT_H - tH - inter);
        const snapped = snapToLineGrid(target);
        bodyEl.style.height = `${snapped}px`;
        return snapped;
      };

      // One overflow checker
      const overflowed = () =>
        bodyEl.scrollHeight > bodyEl.clientHeight ||
        pageEl.scrollHeight  > pageEl.clientHeight;

      // Helpers
      const makeP   = () => document.createElement("p");
      const setPText = (p: HTMLParagraphElement, t: string) => { p.textContent = t; };

      // Slice whole paragraph to blank pages (no title)
      function sliceParagraphBlank(parText: string): string[] {
        const out: string[] = [];
        titleEl.textContent = "";
        bodyEl.innerHTML = "";
        bodyEl.style.height = `${BLANK_BODY_H}px`;

        // quick-fit
        const p = makeP(); setPText(p, parText); bodyEl.appendChild(p);
        if (!overflowed()) { out.push(parText); return out; }

        // word binary search; char fallback
        const words = parText.split(/\s+/);
        let start = 0;
        while (start < words.length) {
          let lo = 1, hi = words.length - start, best = 0;
          while (lo <= hi) {
            const mid  = (lo + hi) >> 1;
            const cand = words.slice(start, start + mid).join(" ");
            titleEl.textContent = ""; bodyEl.innerHTML = "";
            const p2 = makeP(); setPText(p2, cand); bodyEl.appendChild(p2);
            if (!overflowed()) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
          }
          if (best === 0) {
            const word = words[start];
            let loC = 1, hiC = word.length, bestC = 0;
            while (loC <= hiC) {
              const midC = (loC + hiC) >> 1;
              titleEl.textContent = ""; bodyEl.innerHTML = "";
              const p3 = makeP(); setPText(p3, word.slice(0, midC)); bodyEl.appendChild(p3);
              if (!overflowed()) { bestC = midC; loC = midC + 1; } else { hiC = midC - 1; }
            }
            const slice = word.slice(0, Math.max(1, bestC));
            out.push(slice);
            const rest = word.slice(slice.length);
            if (rest) words[start] = rest; else start++;
          } else {
            out.push(words.slice(start, start + best).join(" "));
            start += best;
          }
        }
        return out;
      }

      // Fit as much as possible on the current (partially filled) page
      function fitPieceOnCurrentPage(parText: string): { first: string; rest: string[] } {
        const quick = makeP(); setPText(quick, parText); bodyEl.appendChild(quick);
        if (!overflowed()) { return { first: parText, rest: [] }; }
        bodyEl.removeChild(quick);

        const words = parText.split(/\s+/);
        let lo = 1, hi = words.length, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const probeP = makeP(); setPText(probeP, words.slice(0, mid).join(" "));
          bodyEl.appendChild(probeP);
          const ok = !overflowed();
          bodyEl.removeChild(probeP);
          if (ok) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
        }

        if (best > 0) {
          const first = words.slice(0, best).join(" ");
          const tail  = words.slice(best).join(" ");
          const rest  = tail ? sliceParagraphBlank(tail) : [];
          return { first, rest };
        }

        // char fallback
        const firstWord = words[0] || "";
        if (!firstWord) return { first: "", rest: [] };

        let loC = 1, hiC = firstWord.length, bestC = 0;
        while (loC <= hiC) {
          const midC = (loC + hiC) >> 1;
          const probeP = makeP(); setPText(probeP, firstWord.slice(0, midC));
          bodyEl.appendChild(probeP);
          const ok = !overflowed();
          bodyEl.removeChild(probeP);
          if (ok) { bestC = midC; loC = midC + 1; } else { hiC = midC - 1; }
        }

        if (bestC > 0) {
          const first = firstWord.slice(0, bestC);
          const tail  = firstWord.slice(bestC) + (words.length > 1 ? " " + words.slice(1).join(" ") : "");
          const rest  = tail ? sliceParagraphBlank(tail) : [];
          return { first, rest };
        }

        return { first: "", rest: [parText] };
      }

      // 5) Build pages
      const pages: React.ReactNode[] = [];
      let i = 0;
      let firstPageDone = false;

      while (i < paragraphs.length) {
        const withTitle = !firstPageDone;
        titleEl.textContent = withTitle ? (center.chapters?.[0] || "Chapter 1") : "";
        bodyEl.innerHTML = "";

        // Snap height for THIS page (depends on actual title height + margin + row gap)
        setBodyHeightFor(withTitle);

        const bucket: (string | { SPLIT: string[] })[] = [];

        while (i < paragraphs.length) {
          const pEl = makeP(); setPText(pEl, paragraphs[i]); bodyEl.appendChild(pEl);
          if (!overflowed()) {
            bucket.push(paragraphs[i]);
            i++;
            continue;
          }

          bodyEl.removeChild(pEl);

          if (bodyEl.childElementCount === 0) {
            const parts = sliceParagraphBlank(paragraphs[i]);
            if (parts.length) { bucket.push({ SPLIT: parts }); i++; }
            break; // close page
          } else {
            const { first, rest } = fitPieceOnCurrentPage(paragraphs[i]);
            if (first) {
              bucket.push(first);
              if (rest.length) paragraphs.splice(i + 1, 0, ...rest);
              i++;
            }
            break; // close page
          }
        }

        // Bucket -> nodes; only first piece of any split goes here
        const nodes: React.ReactNode[] = [];
        for (const item of bucket) {
          if (typeof item === "string") {
            nodes.push(<p key={nodes.length}>{item}</p>);
          } else {
            const [first, ...rest] = item.SPLIT;
            nodes.push(<p key={nodes.length}>{first}</p>);
            if (rest.length) paragraphs.splice(i, 0, ...rest);
          }
        }

        pages.push(
          <div className="chapter-page" key={pages.length}>
            {withTitle && <h2 className="chapter-title">{center.chapters?.[0] || "Chapter 1"}</h2>}
            <div className="chapter-body">{nodes}</div>
          </div>
        );
        firstPageDone = true;
      }

      setChap1Pages(pages);

      // 6) Clamp spread if total changed
      setTimeout(() => {
        const claimedChapters   = Number(center?.totalChapters ?? 0) || (center?.chapters?.length ?? 0);
        const remainingChapters = Math.max(0, claimedChapters - 1);
        const newTotalPages     = 2 + pages.length + remainingChapters;
        const newMaxLeft        = Math.max(0, (newTotalPages - 1) & ~1); // lastEven
        setPage((p) => (p > newMaxLeft ? newMaxLeft : p));
      }, 0);
    });

    return () => cancelAnimationFrame(raf);
  }, [center, view, fontSizeIndex, lineHeight, fontStyleIndex]);








  // ---------- Pages model (open) ----------
  // page 0 = dedication (left)
  // page 1 = table of contents (right)
  // page 2.. = chapter 1 paginated pages
  const chapterCount = (() => {
    if (!center) return 0
    if (Array.isArray(center.chapters) && center.chapters.length > 0) return center.chapters.length
    const n = Number(center.totalChapters ?? 0)
    return Number.isFinite(n) && n > 0 ? n : 0
  })()

  const chapterTitles: string[] = (() => {
    if (!center) return []
    if (Array.isArray(center.chapters) && center.chapters.length === chapterCount) {
      return center.chapters.slice()
    }
    return Array.from({ length: chapterCount }, (_, i) => `Chapter ${i + 1}`)
  })()

  const claimedChapters = (() => {
    const n = Number(center?.totalChapters ?? 0)
    if (Number.isFinite(n) && n > 0) return n
    return chapterTitles.length
  })()

  const chap1Count = chap1Pages.length || (center?.chapterTexts?.[0] ? 1 : 0)
  const remainingChapters = Math.max(0, claimedChapters - 1)
  const totalPages = 2 + chap1Count + remainingChapters
  const maxLeftPage = lastEven(totalPages - 1)

  const clampToSpread = useCallback((p: number) => Math.max(0, Math.min(p, Math.max(0, maxLeftPage))), [maxLeftPage])
  const turnPage = useCallback((dir: 1 | -1) => setPage((p) => clampToSpread(p + 2 * dir)), [clampToSpread])
  const gotoChapter = useCallback((k: number) => {
    const p = k + 1
    const left = p % 2 === 0 ? p : p - 1
    setPage(clampToSpread(left))
  }, [clampToSpread])

  const atStart = page <= 0
  const atEnd = page >= maxLeftPage

  // ---------- Flip cross-fade / open choreography ----------
  const [flipFading, setFlipFading] = useState(false)
  const FLIP_FADE_MS = 260
  const returnToCover = useCallback(() => {
    setPage(0)
    setFlipFading(true)
    window.setTimeout(() => setFlipFading(false), FLIP_FADE_MS)
    setView("front")
  }, [])

  // ---------- Keyboard ----------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isEditableEl =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable ||
          target.getAttribute("role") === "textbox")
      if (isEditableEl) return

      const anyPopoverOpen = dictOpen || notePanelOpen || fontPanelOpen || fontStylePanelOpen || ttsOpen
      if (anyPopoverOpen) {
        const navKeys = ["ArrowRight", "ArrowLeft", "PageDown", "PageUp", "a", "A", "d", "D"]
        if (navKeys.includes(e.key)) return
      }

      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
        case "PageDown":
          e.preventDefault()
          if (view === "open") turnPage(1)
          else next()
          break
        case "ArrowLeft":
        case "a":
        case "A":
        case "PageUp":
          e.preventDefault()
          if (view === "open") turnPage(-1)
          else prev()
          break
        case "Home":
          e.preventDefault()
          if (view === "open") setPage(0)
          else if (count) setCurrent(0)
          break
        case "End":
          e.preventDefault()
          if (view === "open") setPage(maxLeftPage)
          else if (count) setCurrent(count - 1)
          break
      }
    }
    window.addEventListener("keydown", onKey, { passive: false })
    return () => window.removeEventListener("keydown", onKey)
  }, [
    count, view, next, prev, turnPage, maxLeftPage,
    dictOpen, notePanelOpen, fontPanelOpen, fontStylePanelOpen, ttsOpen
  ])

  // ---------- Drag / swipe ----------
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragActiveRef = useRef(false)
  const dragStartXRef = useRef(0)
  const wasDraggingRef = useRef(false as boolean)
  const pointerIdRef = useRef<number | null>(null)

  // suppress accidental clicks on spread after drag
  const spreadDownRef = useRef<{ x: number; y: number } | null>(null)
  const spreadDraggedRef = useRef(false)
  const SPREAD_CLICK_MOVE_THRESH = 8

  function onSpreadPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    spreadDownRef.current = { x: e.clientX, y: e.clientY }
    spreadDraggedRef.current = false
  }
  function onSpreadPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = spreadDownRef.current
    if (!d) return
    const dx = Math.abs(e.clientX - d.x)
    const dy = Math.abs(e.clientY - d.y)
    spreadDraggedRef.current = dx > SPREAD_CLICK_MOVE_THRESH || dy > SPREAD_CLICK_MOVE_THRESH
    setTimeout(() => { spreadDownRef.current = null; spreadDraggedRef.current = false }, 0)
  }
  function onSpreadClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (spreadDraggedRef.current) { e.preventDefault(); e.stopPropagation() }
  }

  const DRAG_START_THRESH = 6
  const SWIPE_NAV_THRESH = 60

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (view === "open") return
    dragActiveRef.current = true
    dragStartXRef.current = e.clientX
    pointerIdRef.current = e.pointerId
    setIsDragging(false)
    setDragX(0)
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (view === "open") return
    if (!dragActiveRef.current) return
    const dx = e.clientX - dragStartXRef.current
    setDragX(dx)
    if (!isDragging && Math.abs(dx) > DRAG_START_THRESH) {
      wasDraggingRef.current = true
      const pid = pointerIdRef.current
      if (pid != null) (e.currentTarget as HTMLDivElement).setPointerCapture(pid)
      setIsDragging(true)
    }
  }
  function endDrag(e?: React.PointerEvent<HTMLDivElement>) {
    if (view === "open") return
    if (!dragActiveRef.current) return
    dragActiveRef.current = false
    const pid = pointerIdRef.current
    if (pid != null && e?.currentTarget?.hasPointerCapture?.(pid)) {
      e.currentTarget.releasePointerCapture(pid)
    }
    const dx = dragX
    const didSwipe = Math.abs(dx) > SWIPE_NAV_THRESH
    setIsDragging(false)
    setDragX(0)
    pointerIdRef.current = null
    if (didSwipe) {
      if (dx < 0) next()
      else prev()
    }
    queueMicrotask(() => { wasDraggingRef.current = false })
  }

  // Center click (front → back → open → back …)
  const onCenterClick = (e: React.MouseEvent | React.PointerEvent) => {
    if (spreadDraggedRef.current) return
    if (wasDraggingRef.current) return
    e.stopPropagation()
    setView((prev) => {
      const nextView: BookView = prev === "front" ? "back" : prev === "back" ? "open" : "back"
      if (prev === "back" && nextView === "open") {
        setPage(0)
        setIsOpening(true)
        const OPEN_TOTAL_MS = 800
        window.setTimeout(() => setIsOpening(false), OPEN_TOTAL_MS)
      }
      if ((prev === "front" && nextView === "back") || (prev === "back" && nextView === "front")) {
        setFlipFading(true)
        window.setTimeout(() => setFlipFading(false), FLIP_FADE_MS)
      }
      return nextView
    })
  }

  const toggleLike = useCallback(() => { if (!centerId) return; setLikedById((m) => ({ ...m, [centerId]: !m[centerId] })) }, [centerId])
  const toggleSave = useCallback(() => { if (!centerId) return; setSavedById((m) => ({ ...m, [centerId]: !m[centerId] })) }, [centerId])
  const onRate = useCallback((val: number) => { if (!centerId) return; setUserRatingById((m) => ({ ...m, [centerId]: val })) }, [centerId])

  // ---------- Render ----------
  return (
    <div className="app">
      {/* Top bar */}
      <header className="header">
        <h1 className="logo">
          Pick<span>M</span>e!
        </h1>
        <div className="header-icons">
          <div className="icon" aria-label="write">✏️</div>
          <div className="icon" aria-label="search">🔍</div>
          <button
            type="button"
            className="icon icon-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-haspopup="dialog"
            aria-controls="side-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "X" : "☰"}
          </button>
        </div>
      </header>

      {/* Stage */}
      <main
        className={"carousel" + (isOpenLayout ? " is-opened" : "") + (isOpening ? " is-opening" : "")}
        role="region"
        aria-roledescription="carousel"
        aria-label="Book carousel"
      >
        {/* Metadata */}
        <div className="metadata">
          <div className="meta-header">
            <div className="meta-avatar" aria-hidden>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="meta-username" title={center?.user ?? ""}>
              {center?.user ?? "Unknown User"}
            </p>
          </div>

          <hr className="meta-hr" />

          <div className="meta-actions">
            <LikeButton count={displayLikes} active={liked} onToggle={toggleLike} />
            <StarButton rating={combinedRating} userRating={userRating} active={userRating > 0} onRate={onRate} />
            <SaveButton count={displaySaves} active={saved} onToggle={toggleSave} />
          </div>

          <hr className="meta-hr" />

          <p className="meta-chapters">
            {(center?.currentChapter ?? 0)}/{center?.totalChapters ?? 0} Chapters
          </p>

          <hr className="meta-hr" />

          <ul className="meta-tags">
            {(center?.tags ?? []).map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>

        {/* Drag layer + cards */}
        <div
          className={`drag-layer${isDragging ? " dragging" : ""}` + (view === "open" ? " disabled" : "")}
          style={{ transform: `translateX(${dragX}px)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          {count > 0 && (() => {
            const order = [
              { cls: "book left-off-1",  idx: mod(current - 2, count) },
              { cls: "book left-book",   idx: mod(current - 1, count) },
              { cls: "book main-book",   idx: mod(current + 0, count) },
              { cls: "book right-book",  idx: mod(current + 1, count) },
              { cls: "book right-off-1", idx: mod(current + 2, count) },
            ]
            return order.map(({ cls, idx }) => {
              const b = books[idx]
              const isCenter = idx === mod(current, count)

              const frontBg = b.coverUrl
                ? `url("${b.coverUrl}") center/cover no-repeat, #2d2d2d`
                : "#2d2d2d"
              const backBg = b.backCoverUrl
                ? `url("${b.backCoverUrl}") center/cover no-repeat, #2d2d2d`
                : "#2d2d2d"

              return (
                <div key={b.id} className={cls} aria-hidden={!isCenter}>
                  {/* Closed flipper: front/back */}
                  <div
                    className={
                      "book-inner" +
                      (isCenter && (view === "back" || view === "open") ? " is-flipped" : "") +
                      (isCenter && view === "open" ? " is-open" : "") +
                      (isCenter && flipFading ? " flip-fading" : "")
                    }
                    onClick={isCenter ? onCenterClick : undefined}
                    role={isCenter ? "button" : undefined}
                    aria-label={
                      isCenter
                        ? view === "front"
                          ? "Show back cover"
                          : view === "back"
                          ? "Open book"
                          : "Close book"
                        : undefined
                    }
                    aria-pressed={isCenter ? (view !== "front") : undefined}
                    tabIndex={-1}
                  >
                    {/* FRONT face */}
                    <div className="book-face book-front">
                      <div className="face-fill" style={{ background: frontBg }}>
                        {!b.coverUrl ? b.title : null}
                      </div>
                    </div>

                    {/* BACK face */}
                    <div className="book-face book-back">
                      <div className="face-fill" style={{ background: backBg }} />
                    </div>
                  </div>

                  {/* OPEN spread */}
                  {isCenter && (
                    <div
                      ref={spreadRef}
                      className={
                        "spread" +
                        (view === "open" ? " will-open is-open" : view === "back" ? " will-open" : "")
                      }
                      onPointerDown={onSpreadPointerDown}
                      onPointerUp={onSpreadPointerUp}
                      onClickCapture={onSpreadClickCapture}
                      onClick={onCenterClick}
                      aria-hidden={view !== "open"}
                      aria-label={view === "open" ? "Close book" : undefined}
                      style={{
                        ["--reader-font-scale" as any]: String(FONT_SCALES[fontSizeIndex]),
                        ["--reader-line" as any]: String(lineHeight),
                        ["--reader-font-family" as any]: FONT_STYLES[fontStyleIndex].css,
                        ["--reader-page-bg" as any]: readerLight ? "#ffffff" : "#2d2d2d",
                        ["--reader-page-fg" as any]: readerLight ? "#000000" : "#ffffff",
                      }}
                    >
                      {/* LEFT pane (even index) */}
                      <div
                        ref={paneLeftRef}
                        className="pane left"
                        onClick={(e) => { e.stopPropagation(); if (view === "open") turnPage(-1) }}
                      >
                        {page === 0 ? (
                          <div className="dedication">
                            <div className="dedication-text">
                              {typeof center?.dedication === "string" && center.dedication.trim()
                                ? center.dedication
                                : "— Dedication —"}
                            </div>
                          </div>
                        ) : (
                          (() => {
                            const localIdx = page - 2
                            if (localIdx >= 0) {
                              if (localIdx < chap1Pages.length) {
                                return chap1Pages[localIdx]
                              }
                              return (
                                <div className="chapter-page">
                                  <div className="chapter-body">
                                    <p>(Next chapter…)</p>
                                  </div>
                                </div>
                              )
                            }
                            return <div className="page-blank" aria-hidden="true" />
                          })()
                        )}
                      </div>

                      {/* RIGHT pane (odd index) */}
                      <div
                        ref={paneRightRef}
                        className="pane right"
                        onClick={(e) => { e.stopPropagation(); if (view === "open") turnPage(1) }}
                      >
                        {page === 0 ? (
                          <div className="toc">
                            <h3 className="toc-title">Contents</h3>
                            <ol className="toc-list">
                              {chapterTitles.map((t, i) => (
                                <li key={i}>
                                  <button
                                    type="button"
                                    className="toc-link"
                                    onClick={(e) => { e.stopPropagation(); gotoChapter(i + 1) }}
                                    aria-label={`Go to ${t}`}
                                    title={`Go to ${t}`}
                                  >
                                    <span className="toc-chapter">{t}</span>
                                    <span className="toc-dots" aria-hidden>…………………………………………</span>
                                    <span className="toc-page">
                                      {i === 0 ? 2 : 2 + chap1Pages.length + (i - 1)}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : (
                          (() => {
                            const rightPage = page + 1
                            const localIdx = rightPage - 2
                            if (localIdx >= 0) {
                              if (localIdx < chap1Pages.length) {
                                return chap1Pages[localIdx]
                              }
                              return (
                                <div className="chapter-page">
                                  <div className="chapter-body">
                                    <p>(Next chapter…)</p>
                                  </div>
                                </div>
                              )
                            }
                            return <div className="page-blank" aria-hidden="true" />
                          })()
                        )}
                      </div>

                      {/* Hidden measurer — must live INSIDE the spread to inherit variables */}
                      <div ref={probeRef} className="pagination-probe" aria-hidden>
                        <div className="chapter-page">
                          <h2 className="chapter-title"></h2>
                          <div className="chapter-body"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>

        {/* Arrows */}
        <div className="vertical-arrows">
          {/* TOP: Next / Page→ */}
          <button
            type="button"
            className="arrow"
            aria-label={view === "open" ? "Next page" : "Next book"}
            aria-keyshortcuts="ArrowRight"
            title={view === "open" ? (atEnd ? "Last page" : "Next page") : "Next"}
            disabled={view === "open" && atEnd}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (view === "open") turnPage(1)
              else next()
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
          >
            ›
          </button>

          {/* MIDDLE: Cover (only when OPEN) */}
          {view === "open" && (
            <button
              type="button"
              className="arrow arrow--cover"
              aria-label="Return to cover"
              title="Cover"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                returnToCover()
                ;(e.currentTarget as HTMLButtonElement).blur()
              }}
            >
              ⟲
            </button>
          )}

          {/* BOTTOM: Prev / Page← */}
          <button
            type="button"
            className="arrow"
            aria-label={view === "open" ? "Previous page" : "Previous book"}
            aria-keyshortcuts="ArrowLeft"
            title={view === "open" ? (atStart ? "First page" : "Previous page") : "Previous"}
            disabled={view === "open" && atStart}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (view === "open") turnPage(-1)
              else prev()
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
          >
            ‹
          </button>
        </div>

        {/* Reader menu (bottom sheet) */}
        {view === "open" && (
          <div className={"reader-menu" + (readerMenuOpen ? " is-open" : "")}>
            <button
              type="button"
              className="reader-menu-toggle"
              aria-label={readerMenuOpen ? "Hide reader menu" : "Show reader menu"}
              aria-expanded={readerMenuOpen}
              onClick={(e) => { e.stopPropagation(); setReaderMenuOpen((o) => !o) }}
            >
              <span className="reader-menu-chevron" aria-hidden>⌃</span>
            </button>

            <div
              className="reader-menu-panel"
              role="menu"
              aria-hidden={!readerMenuOpen}
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
                  onClick={(e) => { e.stopPropagation(); setFontPanelOpen((o) => !o) }}
                  style={{ position: "relative" }}
                >
                  A
                  {fontPanelOpen && (
                    <div
                      ref={fontPanelRef}
                      className="reader-popover"
                      role="dialog"
                      aria-label="Reading appearance"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-size-row" role="radiogroup" aria-label="Font size">
                        {FONT_SCALES.map((scale, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={"font-size-option" + (fontSizeIndex === idx ? " is-active" : "")}
                            role="radio"
                            aria-checked={fontSizeIndex === idx}
                            onClick={() => setFontSizeIndex(idx as 0 | 1 | 2 | 3 | 4)}
                            title={idx < 2 ? "Smaller" : idx === 2 ? "Default" : "Larger"}
                          >
                            <span style={{ fontSize: `${(14 * scale).toFixed(2)}px` }}>A</span>
                          </button>
                        ))}
                      </div>

                      <div className="line-height-wrap">
                        <label className="lh-label" htmlFor="lh-range">Line spacing</label>
                        <input
                          id="lh-range"
                          className="lh-range"
                          type="range"
                          min={1.2}
                          max={2.0}
                          step={0.05}
                          value={lineHeight}
                          onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                          aria-valuemin={1.2}
                          aria-valuemax={2.0}
                          aria-valuenow={lineHeight}
                        />
                        <div className="lh-value">{lineHeight.toFixed(2)}×</div>
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
                  onClick={(e) => { e.stopPropagation(); setFontStylePanelOpen((o) => !o) }}
                  style={{ position: "relative" }}
                >
                  F
                  {fontStylePanelOpen && (
                    <div
                      ref={fontStylePanelRef}
                      className="reader-popover reader-fontstyle-popover"
                      role="dialog"
                      aria-label="Font style"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-style-grid">
                        {FONT_STYLES.map((f, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={"font-style-option" + (fontStyleIndex === idx ? " is-active" : "")}
                            onClick={() => setFontStyleIndex(idx as 0 | 1 | 2 | 3 | 4 | 5)}
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

                {/* Light/Dark page */}
                <button
                  type="button"
                  className="reader-menu-item"
                  role="menuitem"
                  aria-label={readerLight ? "Switch to dark pages" : "Switch to light pages"}
                  aria-pressed={readerLight}
                  onClick={(e) => { e.stopPropagation(); setReaderLight((v) => !v) }}
                  title={readerLight ? "Dark mode" : "Light mode"}
                >
                  {readerLight ? "🌙" : "☀︎"}
                </button>

                {/* Dictionary (single, working) */}
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
                      e.stopPropagation()
                      setDictOpen((o) => !o)
                      requestAnimationFrame(() => dictBtnRef.current?.blur())
                    }}
                    title="Dictionary"
                  >
                    ✍︎
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
                        {!dictError && dictResults?.map((en, i) => (
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
                    className="reader-menu-item"
                    role="menuitem"
                    aria-label="Notepad"
                    onClick={(e) => {
                      e.stopPropagation()
                      setNotePanelOpen((o) => !o)
                      requestAnimationFrame(() => noteBtnRef.current?.blur())
                    }}
                  >
                    📝
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
                      e.stopPropagation()
                      setTtsOpen((o) => !o)
                      requestAnimationFrame(() => ttsBtnRef.current?.blur())
                    }}
                    title="Read Aloud"
                  >
                    🔊
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
                        {!tts.speaking && (<button className="tts-btn tts-play" type="button" onClick={playTTS}>Play</button>)}
                        {tts.speaking && !tts.paused && (<button className="tts-btn tts-pause" type="button" onClick={pauseTTS}>Pause</button>)}
                        {tts.speaking && tts.paused && (<button className="tts-btn tts-resume" type="button" onClick={resumeTTS}>Resume</button>)}
                        <button className="tts-btn tts-stop" type="button" onClick={stopTTS}>Stop</button>
                      </div>

                      <div className="tts-row">
                        <label className="tts-label" htmlFor="tts-voice">Voice</label>
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
                        <label className="tts-label" htmlFor="tts-rate">Rate</label>
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
                        <label className="tts-label" htmlFor="tts-pitch">Pitch</label>
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

                      <p className="tts-hint">Reads the visible pages. Turning pages stops playback.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>


      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
