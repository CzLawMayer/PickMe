// src/pages/Preview.tsx
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from "react";
import "./Home.css";
import AppHeader from "@/components/AppHeader";
import { sampleBooks } from "@/booksData";
import { useLocation } from "react-router-dom";

// ---------- Types ----------
type Book = {
  id: string;
  title: string;
  author?: string;
  user?: string;
  coverUrl?: string;
  backCoverUrl?: string;
  tags?: string[];
  rating?: string | number;
  ratingCount?: number;
  likes?: number;
  bookmarks?: number;
  currentChapter?: number;
  totalChapters?: number;
  dedication?: string;
  chapters?: string[];
  chapterTexts?: string[];
};

// When navigating from Write → Preview we may pass File objects:
type IncomingBook = Book & {
  coverFile?: File | null;
  backCoverFile?: File | null;
};

type BookView = "front" | "back" | "open";

// ---------- Reader presets ----------
const FONT_SCALES = [0.85, 0.95, 1.0, 1.1, 1.25] as const;
const FONT_STYLES = [
  { name: "Serif (Georgia)", css: "Georgia, 'Times New Roman', serif" },
  { name: "Sans-serif (Arial)", css: "Arial, Helvetica, sans-serif" },
  { name: "Sans-serif (Roboto)", css: "'Roboto', sans-serif" },
  { name: "Serif (Merriweather)", css: "'Merriweather', serif" },
  { name: "Sans-serif (Open Sans)", css: "'Open Sans', sans-serif" },
  { name: "Monospace (Courier)", css: "'Courier New', Courier, monospace" },
] as const;

// ---------- Helpers ----------
function lastEven(n: number) {
  if (!Number.isFinite(n)) return 0;
  const m = Math.max(0, Math.floor(n));
  return m % 2 === 0 ? m : m - 1;
}
function splitParagraphs(raw: string): string[] {
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/g)
    .map((p) => p.trim())
    .filter(Boolean);
}
function measureLineStepPx(el: HTMLElement): number {
  const s = document.createElement("span");
  s.style.visibility = "hidden";
  s.style.whiteSpace = "pre";
  s.textContent = "A\nA";
  el.appendChild(s);
  const r = s.getBoundingClientRect();
  el.removeChild(s);
  return r.height / 2;
}
const DPR =
  typeof window !== "undefined" && window.devicePixelRatio
    ? window.devicePixelRatio
    : 1;
function snapToDevicePixel(cssPx: number) {
  if (cssPx <= 0) return 0;
  return Math.floor(cssPx * DPR) / DPR;
}
function snapToDeviceLineGrid(cssPixels: number, lineCssPx: number) {
  if (cssPixels <= 0 || lineCssPx <= 0) return 0;
  const SAFE_EPS = 0.5;
  const lines = Math.floor((cssPixels - SAFE_EPS) / lineCssPx);
  return Math.max(0, lines) * lineCssPx;
}

export default function Preview() {
  // Accept injected book from Write → Preview; fallback to first sample
  const location = useLocation() as any;
  const injected: IncomingBook | null = location?.state?.book || null;

  const [center] = useState<Book | null>(() =>
    injected
      ? injected
      : Array.isArray(sampleBooks) && sampleBooks.length
      ? sampleBooks[0]
      : null
  );

  // Locally created object URLs for cover images (revoked on change/unmount)
  const [frontUrl, setFrontUrl] = useState<string | undefined>(undefined);
  const [backUrl, setBackUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let revokeFront: string | undefined;
    let revokeBack: string | undefined;

    // Prefer explicit URLs if provided
    if (injected?.coverUrl && injected.coverUrl.trim()) {
      setFrontUrl(injected.coverUrl);
    } else if (injected?.coverFile instanceof File) {
      const u = URL.createObjectURL(injected.coverFile);
      setFrontUrl(u);
      revokeFront = u;
    } else {
      setFrontUrl(undefined);
    }

    if (injected?.backCoverUrl && injected.backCoverUrl.trim()) {
      setBackUrl(injected.backCoverUrl);
    } else if (injected?.backCoverFile instanceof File) {
      const u = URL.createObjectURL(injected.backCoverFile);
      setBackUrl(u);
      revokeBack = u;
    } else {
      setBackUrl(undefined);
    }

    return () => {
      try {
        if (revokeFront) URL.revokeObjectURL(revokeFront);
      } catch {}
      try {
        if (revokeBack) URL.revokeObjectURL(revokeBack);
      } catch {}
    };
  }, [injected]);

  // Open/flip/pagination
  const [view, setView] = useState<BookView>("front");
  const [isOpening, setIsOpening] = useState(false);
  const [page, setPage] = useState(0);

  // Reader appearance (no bottom menu here)
  const [fontSizeIndex] = useState<0 | 1 | 2 | 3 | 4>(2);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [debouncedLH, setDebouncedLH] = useState(lineHeight);
  const [readerLight] = useState(false);
  const [bottomCushionPx, setBottomCushionPx] = useState(0);
  const [fontStyleIndex] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLH(lineHeight), 120);
    return () => clearTimeout(t);
  }, [lineHeight]);

  // Pagination refs/state
  const spreadRef = useRef<HTMLDivElement | null>(null);
  const paneLeftRef = useRef<HTMLDivElement | null>(null);
  const paneRightRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const [chapterPages, setChapterPages] = useState<ReactNode[][]>([]);

  // Flip cross-fade
  const [flipFading, setFlipFading] = useState(false);
  const FLIP_FADE_MS = 260;


    // put with other state
    const [frontReady, setFrontReady] = useState(false);
    const [backReady,  setBackReady]  = useState(false);

    useEffect(() => {
    let alive = true;

    const loadOne = (url?: string, setReady?: (v:boolean)=>void) => {
        if (!url) { setReady?.(true); return Promise.resolve(); }
        const img = new Image();
        img.crossOrigin = "anonymous"; // harmless for local blobs; helps if remote allows it
        img.src = url;
        const p = (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
        return p.then(() => { if (alive) setReady?.(true); });
    };

    setFrontReady(false);
    setBackReady(false);

    Promise.all([loadOne(frontUrl, setFrontReady), loadOne(backUrl, setBackReady)])
        .catch(() => { /* ignore */ });

    return () => { alive = false; };
    }, [frontUrl, backUrl]);



  // Measure & paginate
  useEffect(() => {
    if (!center) return;
    if (view !== "open") return;

    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!probeRef.current) return;

        const probeRoot = probeRef.current as HTMLElement;
        probeRoot.style.setProperty(
          "--reader-font-scale",
          String(FONT_SCALES[fontSizeIndex])
        );
        probeRoot.style.setProperty("--reader-line", String(debouncedLH));
        probeRoot.style.setProperty(
          "--reader-font-family",
          FONT_STYLES[fontStyleIndex].css
        );

        const pane = paneLeftRef.current || paneRightRef.current;
        if (!pane) return;
        const paneRect = pane.getBoundingClientRect();
        const pageW = snapToDevicePixel(paneRect.width);
        const pageH = snapToDevicePixel(paneRect.height);
        if (!pageW || !pageH) return;

        const texts: string[] = Array.isArray(center.chapterTexts)
          ? center.chapterTexts
              .map((t) => String(t ?? ""))
              .filter((t) => t.trim().length > 0)
          : [];
        if (texts.length === 0) {
          setChapterPages([]);
          return;
        }

        const pageEl = probeRef.current!.querySelector(
          ".chapter-page"
        ) as HTMLElement;
        const titleEl = probeRef.current!.querySelector(
          ".chapter-title"
        ) as HTMLElement;
        const bodyEl = probeRef.current!.querySelector(
          ".chapter-body"
        ) as HTMLElement;

        pageEl.style.width = `${pageW}px`;
        pageEl.style.height = `${pageH}px`;
        pageEl.style.boxSizing = "border-box";

        // Mirror paddings from a visible page
        let padTop = "6vmin",
          padRight = "6vmin",
          padBottom = "6vmin",
          padLeft = "6vmin";
        const visiblePage = document.querySelector(
          ".spread .chapter-page"
        ) as HTMLElement | null;
        if (visiblePage) {
          const cs = getComputedStyle(visiblePage);
          padTop = cs.paddingTop || padTop;
          padRight = cs.paddingRight || padRight;
          padBottom = cs.paddingBottom || padBottom;
          padLeft = cs.paddingLeft || padLeft;
        }
        pageEl.style.paddingTop = padTop;
        pageEl.style.paddingRight = padRight;
        pageEl.style.paddingBottom = padBottom;
        pageEl.style.paddingLeft = padLeft;

        // Body layout
        bodyEl.style.flex = "0 0 auto";
        bodyEl.style.minHeight = "0";
        bodyEl.style.overflow = "hidden";
        bodyEl.style.boxSizing = "content-box";

        void pageEl.getBoundingClientRect();

        // Content box
        const csPage = getComputedStyle(pageEl);
        const pT = parseFloat(csPage.paddingTop) || 0;
        const pB = parseFloat(csPage.paddingBottom) || 0;
        const CONTENT_H = pageH - pT - pB;

        const lineStepCss = measureLineStepPx(bodyEl);
        const MIN_LINES = 3;

        // Bottom cushion
        const BOTTOM_CUSHION_LINES = 1;
        const CUSHION_PX = BOTTOM_CUSHION_LINES * lineStepCss;
        probeRoot.style.setProperty("--reader-cushion", `${CUSHION_PX}px`);
        bodyEl.style.setProperty("--reader-cushion", `${CUSHION_PX}px`);
        setBottomCushionPx(CUSHION_PX);

        // Account for body padding
        const csBody = getComputedStyle(bodyEl);
        const bodyPadTop = parseFloat(csBody.paddingTop) || 0;
        const bodyPadBot = parseFloat(csBody.paddingBottom) || 0;

        // Available content height for text lines (no title yet)
        const CONTENT_H_FOR_BODY = Math.max(
          0,
          CONTENT_H - bodyPadTop - bodyPadBot
        );

        // Snap blank-page body height to full line boxes
        const BLANK_BODY_H = Math.max(
          lineStepCss * MIN_LINES,
          snapToDeviceLineGrid(CONTENT_H_FOR_BODY, lineStepCss)
        );
        bodyEl.style.height = `${BLANK_BODY_H}px`;

        // Overflow checker
        const overflowed = () => {
          if (bodyEl.scrollHeight - bodyEl.clientHeight > 0.5) return true;
          const last = bodyEl.lastElementChild as HTMLElement | null;
          if (!last) return false;
          const bodyR = bodyEl.getBoundingClientRect();
          const lastR = last.getBoundingClientRect();
          const mb = parseFloat(getComputedStyle(last).marginBottom) || 0;
          const EPS = 0.5;
          return lastR.bottom + mb > bodyR.bottom - bodyPadBot - EPS;
        };

        // Helpers
        const makeP = () => document.createElement("p");
        const setPText = (p: HTMLParagraphElement, t: string) => {
          p.textContent = t;
        };

        // Compute body height for a page (depending on title presence)
        const setBodyHeightFor = (withTitle: boolean) => {
          const tH = withTitle ? titleEl.getBoundingClientRect().height : 0;
          const tGap =
            withTitle ? parseFloat(getComputedStyle(titleEl).marginBottom) || 0 : 0;
          const inter = withTitle ? tGap : 0;
          const targetContent = Math.max(0, CONTENT_H_FOR_BODY - tH - inter);
          const snappedContent = Math.max(
            lineStepCss * MIN_LINES,
            snapToDeviceLineGrid(targetContent, lineStepCss)
          );
          bodyEl.style.height = `${snappedContent}px`;
          return snappedContent;
        };

        // Slice a whole paragraph into blank pages (no title)
        const sliceParagraphBlank = (parText: string): string[] => {
          const out: string[] = [];
          titleEl.textContent = "";
          bodyEl.innerHTML = "";
          bodyEl.style.height = `${BLANK_BODY_H}px`;

          const p = makeP();
          setPText(p, parText);
          bodyEl.appendChild(p);
          if (!overflowed()) {
            out.push(parText);
            return out;
          }

          const words = parText.split(/\s+/);
          let start = 0;
          while (start < words.length) {
            let lo = 1,
              hi = words.length - start,
              best = 0;
            while (lo <= hi) {
              const mid = (lo + hi) >> 1;
              const cand = words.slice(start, start + mid).join(" ");
              titleEl.textContent = "";
              bodyEl.innerHTML = "";
              const p2 = makeP();
              setPText(p2, cand);
              bodyEl.appendChild(p2);
              if (!overflowed()) {
                best = mid;
                lo = mid + 1;
              } else {
                hi = mid - 1;
              }
            }
            if (best === 0) {
              const word = words[start];
              let loC = 1,
                hiC = word.length,
                bestC = 0;
              while (loC <= hiC) {
                const midC = (loC + hiC) >> 1;
                titleEl.textContent = "";
                bodyEl.innerHTML = "";
                const p3 = makeP();
                setPText(p3, word.slice(0, midC));
                bodyEl.appendChild(p3);
                if (!overflowed()) {
                  bestC = midC;
                  loC = midC + 1;
                } else {
                  hiC = midC - 1;
                }
              }
              const slice = word.slice(0, Math.max(1, bestC));
              out.push(slice);
              const rest = word.slice(slice.length);
              if (rest) words[start] = rest;
              else start++;
            } else {
              out.push(words.slice(start, start + best).join(" "));
              start += best;
            }
          }
          return out;
        };

        const fitPieceOnCurrentPage = (
          parText: string
        ): { first: string; rest: string[] } => {
          const quick = makeP();
          setPText(quick, parText);
          bodyEl.appendChild(quick);
          if (!overflowed()) {
            return { first: parText, rest: [] };
          }
          bodyEl.removeChild(quick);

          const words = parText.split(/\s+/);
          let lo = 1,
            hi = words.length,
            best = 0;
          while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const probeP = makeP();
            setPText(probeP, words.slice(0, mid).join(" "));
            bodyEl.appendChild(probeP);
            const ok = !overflowed();
            bodyEl.removeChild(probeP);
            if (ok) {
              best = mid;
              lo = mid + 1;
            } else {
              hi = mid - 1;
            }
          }

          if (best > 0) {
            const first = words.slice(0, best).join(" ");
            const tail = words.slice(best).join(" ");
            const rest = tail ? sliceParagraphBlank(tail) : [];
            return { first, rest };
          }

          const firstWord = words[0] || "";
          if (!firstWord) return { first: "", rest: [] };

          let loC = 1,
            hiC = firstWord.length,
            bestC = 0;
          while (loC <= hiC) {
            const midC = (loC + hiC) >> 1;
            const probeP = makeP();
            setPText(probeP, firstWord.slice(0, midC));
            bodyEl.appendChild(probeP);
            const ok = !overflowed();
            bodyEl.removeChild(probeP);
            if (ok) {
              bestC = midC;
              loC = midC + 1;
            } else {
              hiC = midC - 1;
            }
          }

          if (bestC > 0) {
            const first = firstWord.slice(0, bestC);
            const tail =
              firstWord.slice(bestC) +
              (words.length > 1 ? " " + words.slice(1).join(" ") : "");
            const rest = tail ? sliceParagraphBlank(tail) : [];
            return { first, rest };
          }

          return { first: "", rest: [parText] };
        };

        // Build pages for each chapter
        const pagesByChapter: ReactNode[][] = [];

        for (let chapIdx = 0; chapIdx < texts.length; chapIdx++) {
          const title =
            center.chapters && center.chapters[chapIdx]
              ? center.chapters[chapIdx]
              : `Chapter ${chapIdx + 1}`;
          const paragraphs = splitParagraphs(texts[chapIdx]);

          const chapterOut: ReactNode[] = [];
          let i = 0;
          let firstPageOfChapter = true;

          while (i < paragraphs.length) {
            const withTitle = firstPageOfChapter;
            titleEl.textContent = withTitle ? title : "";
            bodyEl.innerHTML = "";

            const snappedBodyH = setBodyHeightFor(withTitle);
            const bucket: (string | { SPLIT: string[] })[] = [];

            while (i < paragraphs.length) {
              const pEl = makeP();
              setPText(pEl, paragraphs[i]);
              bodyEl.appendChild(pEl);
              if (!overflowed()) {
                bucket.push(paragraphs[i]);
                i++;
                continue;
              }

              bodyEl.removeChild(pEl);

              if (bodyEl.childElementCount === 0) {
                const parts = sliceParagraphBlank(paragraphs[i]);
                if (parts.length) {
                  bucket.push({ SPLIT: parts });
                  i++;
                }
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

            const nodes: ReactNode[] = [];
            for (const item of bucket) {
              if (typeof item === "string") {
                nodes.push(<p key={nodes.length}>{item}</p>);
              } else {
                const [first, ...rest] = item.SPLIT;
                nodes.push(<p key={nodes.length}>{first}</p>);
                if (rest.length) paragraphs.splice(i, 0, ...rest);
              }
            }

            chapterOut.push(
              <div
                className="chapter-page"
                key={`${chapIdx}-${chapterOut.length}`}
              >
                {withTitle && <h2 className="chapter-title">{title}</h2>}
                <div
                  className="chapter-body"
                  style={{
                    height: `${snappedBodyH}px`,
                    boxSizing: "content-box",
                    overflow: "hidden",
                  }}
                >
                  {nodes}
                </div>
              </div>
            );

            firstPageOfChapter = false;
          }

          // Empty chapter placeholder
          if (chapterOut.length === 0) {
            chapterOut.push(
              <div className="chapter-page" key={`${chapIdx}-empty`}>
                <h2 className="chapter-title">{title}</h2>
                <div
                  className="chapter-body"
                  style={{
                    height: `${BLANK_BODY_H}px`,
                    boxSizing: "content-box",
                    overflow: "hidden",
                  }}
                >
                  <p>(No content)</p>
                </div>
              </div>
            );
          }

          pagesByChapter.push(chapterOut);
        }

        setChapterPages(pagesByChapter);

        // Clamp spread if total changed
        setTimeout(() => {
          const claimedChapters =
            Number(center?.totalChapters ?? 0) ||
            center?.chapters?.length ||
            texts.length;
          const materialized = pagesByChapter.length;
          const materializedPages = pagesByChapter.reduce(
            (sum, arr) => sum + arr.length,
            0
          );
          const remainingChapters = Math.max(
            0,
            claimedChapters - materialized
          );
          const newTotalPages = 2 + materializedPages + remainingChapters;
          const newMaxLeft = Math.max(0, (newTotalPages - 1) & ~1);
          setPage((p) => (p > newMaxLeft ? newMaxLeft : p));
        }, 0);
      });
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [center, view, fontSizeIndex, debouncedLH, fontStyleIndex]);

  // Re-run pagination once real fonts are ready (metrics)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // @ts-ignore
        await (document as any).fonts?.ready;
      } catch {}
      if (!cancelled) setLineHeight((v) => v);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Pages model (open) ----------
  const chapterCount = (() => {
    if (!center) return 0;
    if (Array.isArray(center.chapters) && center.chapters.length > 0)
      return center.chapters.length;
    const n = Number(center.totalChapters ?? 0);
    return Number.isFinite(n) && n > 0
      ? n
      : Array.isArray(center.chapterTexts)
      ? center.chapterTexts.length
      : 0;
  })();

  const chapterTitles: string[] = (() => {
    if (!center) return [];
    if (
      Array.isArray(center.chapters) &&
      center.chapters.length === chapterCount
    ) {
      return center.chapters.slice();
    }
    return Array.from({ length: chapterCount }, (_, i) => `Chapter ${i + 1}`);
  })();

  const claimedChapters = (() => {
    const n = Number(center?.totalChapters ?? 0);
    if (Number.isFinite(n) && n > 0) return n;
    return chapterTitles.length;
  })();

  const flatPages: ReactNode[] = chapterPages.flat();
  const remainingChapters = Math.max(0, claimedChapters - chapterPages.length);
  const totalPages = 2 + flatPages.length + remainingChapters;
  const maxLeftPage = lastEven(totalPages - 1);

  const startPageOfChapter: number[] = (() => {
    const starts: number[] = [];
    let acc = 2; // first chapter starts at page 2 (right pane)
    for (let i = 0; i < claimedChapters; i++) {
      starts.push(acc);
      const len =
        i < chapterPages.length ? Math.max(1, chapterPages[i].length) : 1;
      acc += len;
    }
    return starts;
  })();

  const clampToSpread = useCallback(
    (p: number) => Math.max(0, Math.min(p, Math.max(0, maxLeftPage))),
    [maxLeftPage]
  );
  const turnPage = useCallback(
    (dir: 1 | -1) => setPage((p) => clampToSpread(p + 2 * dir)),
    [clampToSpread]
  );
  const gotoChapter = useCallback(
    (k: number) => {
      const idx = Math.max(0, k - 1);
      const p = startPageOfChapter[idx] ?? 2;
      const left = p % 2 === 0 ? p : p - 1;
      setPage(clampToSpread(left));
    },
    [clampToSpread, startPageOfChapter]
  );

  const atStart = page <= 0;
  const atEnd = page >= maxLeftPage;

  // Flip choreography
  const returnToCover = useCallback(() => {
    setPage(0);
    setFlipFading(true);
    window.setTimeout(() => setFlipFading(false), FLIP_FADE_MS);
    setView("front");
  }, []);

  // Keyboard (page turns + cover)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditableEl =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable ||
          target.getAttribute("role") === "textbox");
      if (isEditableEl) return;

      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
        case "PageDown":
          e.preventDefault();
          if (view === "open") turnPage(1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
        case "PageUp":
          e.preventDefault();
          if (view === "open") turnPage(-1);
          break;
        case "Home":
          e.preventDefault();
          if (view === "open") setPage(0);
          break;
        case "End":
          e.preventDefault();
          if (view === "open") setPage(maxLeftPage);
          break;
      }
    }
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [view, turnPage, maxLeftPage]);

  // Center click: front → back → open → back …
    const onCenterClick = (e: React.MouseEvent | React.PointerEvent) => {
        e.stopPropagation();
        setView((prev) => {
            const nextView: BookView =
            prev === "front" ? "back" : prev === "back" ? "open" : "back";

            // If we’re about to reveal the back or open the book, wait for back image
            if ((prev === "front" && (nextView === "back" || nextView === "open")) && !backReady) {
            // queue the flip right after decode completes
            const tryFlip = () => setView(nextView);
            // tiny microtask to avoid state-in-state updates if already ready
            Promise.resolve().then(() => {
                if (backReady) tryFlip();
                else {
                const i = new Image();
                if (backUrl) {
                    i.src = backUrl;
                    (i.decode ? i.decode() : Promise.resolve())
                    .catch(() => {})
                    .then(tryFlip);
                } else {
                    tryFlip();
                }
                }
            });
            return prev; // keep current view until ready
            }

            if (prev === "back" && nextView === "open") {
            setPage(0);
            setIsOpening(true);
            window.setTimeout(() => setIsOpening(false), 800);
            }
            if ((prev === "front" && nextView === "back") || (prev === "back" && nextView === "front")) {
            setFlipFading(true);
            window.setTimeout(() => setFlipFading(false), 260);
            }
            return nextView;
        });
    };


  if (!center) {
    return (
      <div className="app">
        <AppHeader />
        <main className="carousel">
          <div style={{ padding: 24, opacity: 0.7 }}>No book data.</div>
        </main>
      </div>
    );
  }

  // Explicit backgroundImage + fallback color to ensure image shows
  const frontFillStyle: CSSProperties = {
    backgroundColor: "#2d2d2d",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    ...(frontUrl ? { backgroundImage: `url(${frontUrl})` } : {}),
  };

  const backFillStyle: CSSProperties = {
    backgroundColor: "#2d2d2d",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    ...(backUrl ? { backgroundImage: `url(${backUrl})` } : {}),
  };

  return (
    <div className="app">
      <AppHeader />

      <main
        className={
          "carousel" +
          (view === "open" || isOpening ? " is-opened" : "") +
          (isOpening ? " is-opening" : "")
        }
        role="region"
        aria-roledescription="carousel"
        aria-label="Book preview"
      >
{/* Single center book */}
<div className="book main-book" aria-hidden={false}>
  {/* Closed flipper: front/back */}
  <div
    className={
      "book-inner" +
      (view === "back" || view === "open" ? " is-flipped" : "") +
      (view === "open" ? " is-open" : "") +
      (flipFading ? " flip-fading" : "")
    }
    onClick={onCenterClick}
    role="button"
    aria-label={
      view === "front" ? "Show back cover" : view === "back" ? "Open book" : "Close book"
    }
    aria-pressed={view !== "front"}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCenterClick(e);
      }
    }}
  >
    {/* FRONT face (two layers: outside + inside) */}
    <div
      className="book-face book-front"
      style={{ ["--face-url" as any]: frontUrl ? `url(${frontUrl})` : "" } as React.CSSProperties}
    >
      <div className="face-layer out" />
      <div className="face-layer in" />
    </div>

    {/* BACK face (two layers: outside + inside) */}
    <div
      className="book-face book-back"
      style={{ ["--face-url" as any]: backUrl ? `url(${backUrl})` : "" } as React.CSSProperties}
    >
      <div className="face-layer out" />
      <div className="face-layer in" />
    </div>
  </div> {/* ✅ close .book-inner here */}

  {/* OPEN spread (sibling of .book-inner) */}
  <div
    ref={spreadRef}
    className={
      "spread" +
      (view === "open" ? " will-open is-open" : view === "back" ? " will-open" : "")
    }
    lang="en"
    onClick={onCenterClick}
    aria-hidden={view !== "open"}
    aria-label={view === "open" ? "Close book" : undefined}
    style={{
      ["--reader-font-scale" as any]: String(FONT_SCALES[fontSizeIndex]),
      ["--reader-line" as any]: String(debouncedLH),
      ["--reader-font-family" as any]: FONT_STYLES[fontStyleIndex].css,
      ["--reader-page-bg" as any]: readerLight ? "#ffffff" : "#2d2d2d",
      ["--reader-page-fg" as any]: readerLight ? "#000000" : "#ffffff",
      ["--reader-cushion" as any]: `${bottomCushionPx}px`,
    }}
  >

            {/* LEFT pane (even index) */}
            <div
              ref={paneLeftRef}
              className="pane left"
              onClick={(e) => {
                e.stopPropagation();
                if (view === "open") turnPage(-1);
              }}
            >
              {page === 0 ? (
                <div className="dedication">
                  <div className="dedication-text">
                    {typeof center?.dedication === "string" &&
                    center.dedication?.trim()
                      ? center.dedication
                      : "— Dedication —"}
                  </div>
                </div>
              ) : (
                (() => {
                  const localIdx = page - 2;
                  if (localIdx >= 0) {
                    if (localIdx < flatPages.length) {
                      return flatPages[localIdx];
                    }
                    return (
                      <div className="chapter-page">
                        <div className="chapter-body">
                          <p>(Next chapter…)</p>
                        </div>
                      </div>
                    );
                  }
                  return <div className="page-blank" aria-hidden="true" />;
                })()
              )}
            </div>

            {/* RIGHT pane (odd index) */}
            <div
              ref={paneRightRef}
              className="pane right"
              onClick={(e) => {
                e.stopPropagation();
                if (view === "open") turnPage(1);
              }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            gotoChapter(i + 1);
                          }}
                          aria-label={`Go to ${t}`}
                          title={`Go to ${t}`}
                        >
                          <span className="toc-chapter">{t}</span>
                          <span className="toc-dots" aria-hidden="true">
                            …………………………………………{/* purely decorative */}
                          </span>
                          <span className="toc-page">
                            {startPageOfChapter[i] ?? 2}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                (() => {
                  const rightPage = page + 1;
                  const localIdx = rightPage - 2;
                  if (localIdx >= 0) {
                    if (localIdx < flatPages.length) {
                      return flatPages[localIdx];
                    }
                    return (
                      <div className="chapter-page">
                        <div className="chapter-body">
                          <p>(Next chapter…)</p>
                        </div>
                      </div>
                    );
                  }
                  return <div className="page-blank" aria-hidden="true" />;
                })()
              )}
            </div>

            {/* Hidden measurer */}
            <div ref={probeRef} className="pagination-probe" aria-hidden="true">
              <div className="chapter-page">
                <h2 className="chapter-title"></h2>
                <div className="chapter-body"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical arrows (page turns only) */}
        <div className="vertical-arrows">
          <button
            type="button"
            className="arrow"
            aria-label={view === "open" ? "Next page" : "Next"}
            aria-keyshortcuts="ArrowRight"
            title={view === "open" ? (atEnd ? "Last page" : "Next page") : "Next"}
            disabled={view === "open" && atEnd}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (view === "open") turnPage(1);
              (e.currentTarget as HTMLButtonElement).blur();
            }}
          >
            ›
          </button>

          {view === "open" && (
            <button
              type="button"
              className="arrow arrow--cover"
              aria-label="Return to cover"
              title="Cover"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                returnToCover();
                (e.currentTarget as HTMLButtonElement).blur();
              }}
            >
              ⟲
            </button>
          )}

          <button
            type="button"
            className="arrow"
            aria-label={view === "open" ? "Previous page" : "Previous"}
            aria-keyshortcuts="ArrowLeft"
            title={view === "open" ? (atStart ? "First page" : "Previous page") : "Previous"}
            disabled={view === "open" && atStart}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (view === "open") turnPage(-1);
              (e.currentTarget as HTMLButtonElement).blur();
            }}
          >
            ‹
          </button>
        </div>
      </main>
    </div>
  );
}
