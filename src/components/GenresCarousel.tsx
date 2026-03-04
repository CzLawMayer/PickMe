import { useEffect, useMemo, useRef, useState } from "react";
import { allGenres, getGenreDescription, genreCatalog } from "@/searchData";
import "./GenresCarousel.css";

type GenresCarouselProps = { onPick?: (genre: string) => void };

const FALLBACK_W = 325; // keep in sync with CSS --stripe-w
const DURATION_MS = 380; // slide animation

type GenreFontKey =
  | "ABRIL"
  | "BEBAS"
  | "BLACKOPS"
  | "CINZEL"
  | "DMSERIF"
  | "RUBIKMONO"
  | "TEKO"
  | "UNIFRAKTUR";

function fontKeyToCssVar(key?: string): string {
  switch ((key || "").toUpperCase()) {
    case "ABRIL":
      return "--gfont-abr";
    case "BEBAS":
      return "--gfont-beb";
    case "BLACKOPS":
      return "--gfont-blk";
    case "CINZEL":
      return "--gfont-cin";
    case "DMSERIF":
      return "--gfont-dms";
    case "RUBIKMONO":
      return "--gfont-rmx";
    case "TEKO":
      return "--gfont-tek";
    case "UNIFRAKTUR":
      return "--gfont-uni";
    default:
      return "--gfont-beb";
  }
}

export default function GenresCarousel({ onPick }: GenresCarouselProps) {
  // Base list (names). Prefer the catalog order so it matches your database.
  // Fallback to allGenres if needed.
  const base = useMemo(() => {
    const fromCatalog = (genreCatalog || []).map((g: any) => g?.name).filter(Boolean);
    return fromCatalog.length ? fromCatalog : allGenres;
  }, []);
  const N = base.length;

  // triple list for seamless wrap
  const looped = useMemo(() => (N ? [...base, ...base, ...base] : []), [N, base]);
  const firstReal = N;
  const lastReal = 2 * N - 1;

  // active index lives in middle copy initially
  const [idx, setIdx] = useState(firstReal);
  const [anim, setAnim] = useState(true);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // live measurements
  const [vw, setVw] = useState(0);
  const [stripeW, setStripeW] = useState(FALLBACK_W);
  const [gapW, setGapW] = useState(0);



  const STRIPE_PALETTE: Array<[string, string]> = [
    // Start ORANGE (brand c1 zone)
    ["#ef5623", "#7a1f0d"], // brand orange → ember
    ["#ff6a3a", "#3a0b16"], // hot orange → wine shadow
    ["#c43a1f", "#1b050b"], // burnt orange → oxblood shadow

    // RED / WINE (your favorites)
    ["#8b0f2a", "#3a0716"], // blood red
    ["#6b0f1a", "#2a0610"], // crimson velvet
    ["#6a1632", "#2a0a16"], // wine
    ["#4c0b17", "#1b050b"], // oxblood

    // PINK (brand c2 zone)
    ["#e41f6c", "#5a0a26"], // brand pink → deep rose
    ["#ff2f86", "#2a0811"], // neon rose → noir base
    ["#b31552", "#170712"], // magenta wine → plum shadow

    // PURPLE → BLUE (smoothed, no alternating)
    ["#3b0f2a", "#170712"], // plum noir
    ["#6a1b9a", "#240a3a"], // brand purple → deep violet
    ["#7a2bc2", "#120c1a"], // brighter violet peak
    ["#2a1240", "#0f071c"], // violet noir
    ["#1a1b4b", "#0a0b22"], // indigo
    ["#122a5a", "#07102b"], // deep royal blue
    ["#0f1a4a", "#070b1f"], // midnight blue
    ["#1b2c48", "#0b121f"], // steel blue
    ["#1e88e5", "#0b1f3a"], // brand blue

    // WARM BRIDGE BACK (this is the key fix)
    ["#3a0f2a", "#160b12"], // warm plum bridge (kills blue→orange harsh jump)
    ["#6b0f1a", "#2a0610"], // crimson bridge
    ["#ef5623", "#2a0610"], // orange re-entry (wrap becomes orange-adjacent)
  ];



  // measure viewport width
  useEffect(() => {
    let raf = 0;
    const readVW = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVw(viewportRef.current?.clientWidth ?? 0);
      });
    };
    readVW();

    const ro = new ResizeObserver(readVW);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener("resize", readVW);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", readVW);
    };
  }, []);

  // measure stripe width & gap from DOM (works for grid/flex + gap/column-gap)
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;

      const first = track.querySelector<HTMLElement>(".genre-stripe");
      if (first) {
        const rect = first.getBoundingClientRect();
        if (rect.width > 0) setStripeW(rect.width);
      }
      const cs = getComputedStyle(track);
      const gapStr = cs.columnGap || cs.gap || "0";
      const gap = parseFloat(gapStr) || 0;
      setGapW(gap);
    };

    // now + next frame (after layout settles)
    measure();
    const id = requestAnimationFrame(measure);

    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [looped.length, vw]);

  // queued navigation (rapid clicks)
  const pendingRef = useRef(0);
  const movingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const kick = () => {
    if (movingRef.current || pendingRef.current === 0) return;
    movingRef.current = true;
    const step = Math.sign(pendingRef.current);
    pendingRef.current -= step;
    setIdx((p) => p + step);
  };

  const next = () => {
    pendingRef.current = Math.min(pendingRef.current + 1, 100);
    kick();
  };
  const prev = () => {
    pendingRef.current = Math.max(pendingRef.current - 1, -100);
    kick();
  };

  // center on a clicked base index (nearest copy of that genre)
  const centerOnBaseIndex = (baseIndex: number) => {
    if (!N) return;
    const candidates = [baseIndex, baseIndex + N, baseIndex + 2 * N];

    let target = candidates[0];
    let best = Math.abs(target - idx);
    for (const c of candidates) {
      const d = Math.abs(c - idx);
      if (d < best) {
        best = d;
        target = c;
      }
    }

    pendingRef.current = 0; // cancel queued steps
    setAnim(true);
    movingRef.current = true;
    setIdx(target);
  };

  // seamless wrap; finish queued steps
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const normalize = (val: number) => {
      while (val > lastReal) val -= N;
      while (val < firstReal) val += N;
      return val;
    };

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "transform") return;

      // jump invisibly back into middle copy if we slid into edges
      if (idx < firstReal || idx > lastReal) {
        setAnim(false);
        setIdx((p) => normalize(p));
        requestAnimationFrame(() => setAnim(true));
      }

      if (pendingRef.current !== 0) {
        requestAnimationFrame(() => {
          const step = Math.sign(pendingRef.current);
          pendingRef.current -= step;
          setIdx((p) => p + step);
        });
      } else {
        movingRef.current = false;
      }
    };

    el.addEventListener("transitionend", onEnd);

    // safety timeout in case transitionend is missed
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      movingRef.current = false;
      if (pendingRef.current !== 0) kick();
    }, DURATION_MS + 120);

    return () => {
      el.removeEventListener("transitionend", onEnd);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [idx, N, firstReal, lastReal]);

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!looped.length) return null;

  // layout math
  const STEP = stripeW + gapW;
  const centerPad = Math.max(0, (vw - stripeW) / 2);
  const offset = centerPad - idx * STEP;

  const activeName = base[((idx % N) + N) % N];
  const activeDesc = getGenreDescription(activeName) || "";

  // Find active genre's fontKey and map it to the CSS var
  const activeFontKey = (genreCatalog as any[]).find((g) => g.name === activeName)
    ?.fontKey as GenreFontKey | undefined;
  const fontVar = fontKeyToCssVar(activeFontKey);

  return (
    <div
      className="genres-overlay"
      role="region"
      aria-label="Genres carousel"
      style={{
        // this feeds your CSS rule: font-family: var(--genre-font)
        ["--genre-font" as any]: `var(${fontVar})`,
      }}
    >
      {/* Centered title + description */}
      <div className="genres-caption" aria-live="polite" aria-atomic="true">
        <div>
          <div className="genres-title-overlay">{activeName}</div>
          {activeDesc && <div className="genres-desc-overlay">{activeDesc}</div>}
        </div>
      </div>

      <button className="genres-nav genres-nav--left" aria-label="Previous" onClick={prev}>
        ‹
      </button>

      <div ref={viewportRef} className="genres-viewport" aria-hidden="true">
        <div
          ref={trackRef}
          className="genres-track"
          style={{
            transform: `translate3d(${offset}px,0,0)`,
            transition: anim ? `transform ${DURATION_MS}ms ease` : "none",
          }}
        >
          {looped.map((g, i) => {
            const baseIndex = ((i % N) + N) % N;
            const isActive = i === idx;

            const p = STRIPE_PALETTE[baseIndex % STRIPE_PALETTE.length];
            return (
              <button
                key={`${g}-${i}`}
                className="genre-stripe"
                data-active={isActive}
                title={g}
                aria-label={g}
                onClick={() => {
                  if (!isActive) {
                    // if it’s a side stripe, slide it to center
                    centerOnBaseIndex(baseIndex);
                  } else {
                    // centered: commit the pick
                    onPick?.(g);
                  }
                }}
                style={{
                  ["--stripe-a" as any]: p[0],
                  ["--stripe-b" as any]: p[1],
                }}
              />
            );
          })}
        </div>
      </div>

      <button className="genres-nav genres-nav--right" aria-label="Next" onClick={next}>
        ›
      </button>
    </div>
  );
}