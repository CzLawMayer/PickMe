import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

/** Minimal book shape for the rail */
export type RailItem = {
  id: string | number;
  coverUrl?: string;
  title?: string;    // optional: used only for aria-label / title attr
};

type Props = {
  items: RailItem[];
  onSelect?: (item: RailItem) => void;  // optional, e.g. to feed a FeaturePanel later
  onPreview?: (item: RailItem) => void; // optional hover preview
  /** When true, renders the “+” add tile at the end (like your screenshot) */
  addTileHref?: string;
};

/**
 * StoriesRail – exact DOM & classes the Profile stories strip uses:
 * .stories-strip > .stories-viewport > .stories-track > .story-cover
 * plus the bottom scrollbar pill (.stories-progress/.stories-thumb)
 * No side buttons. Wheel-to-horizontal scrolling is preserved.
 */
export default function StoriesRail({ items, onSelect, onPreview, addTileHref }: Props) {
  const storiesRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const [canScrollStories, setCanScrollStories] = useState(false); // show/hide pill
  const [storiesProgress, setStoriesProgress] = useState(0);       // 0..1
  const [thumbPct, setThumbPct] = useState(1);                     // 0..1

  const recomputeStories = () => {
    const vp = storiesRef.current;
    if (!vp) return;

    const total = vp.scrollWidth;
    const visible = vp.clientWidth;
    const max = Math.max(0, total - visible);

    setCanScrollStories(max > 0.5);
    setThumbPct(total > 0 ? visible / total : 1);
    setStoriesProgress(max ? vp.scrollLeft / max : 0);
  };

  // Wheel-to-horizontal
  useLayoutEffect(() => {
    const el = storiesRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const hasOverflowX = el.scrollWidth > el.clientWidth;
      if (!hasOverflowX) return;

      const vertDominates = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      if (vertDominates) {
        e.preventDefault();
        const speed = e.shiftKey ? 2 : 1;
        el.scrollLeft += e.deltaY * speed;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as EventListener);
  }, []);

  // Mount / resize / element-size changes
  useLayoutEffect(() => {
    recomputeStories();

    const onResize = () => recomputeStories();
    window.addEventListener("resize", onResize);

    const vp = storiesRef.current;
    let ro: ResizeObserver | undefined;
    if (vp) {
      ro = new ResizeObserver(recomputeStories);
      ro.observe(vp);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, []);

  // Keep pill in sync with natural horizontal scrolling
  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;
    const onScroll = () => recomputeStories();
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, []);

  // Recompute once covers load (background-image)
  useLayoutEffect(() => {
    const vp = storiesRef.current;
    if (!vp) return;

    const tiles = Array.from(vp.querySelectorAll<HTMLElement>(".story-cover"));
    if (tiles.length === 0) { recomputeStories(); return; }

    let pending = tiles.length;
    const done = () => { if (--pending <= 0) recomputeStories(); };

    const loaders: HTMLImageElement[] = [];
    tiles.forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.startsWith("url(") ? bg.match(/^url\(["']?(.*?)["']?\)$/) : null;
      const src = m?.[1];
      if (!src) { done(); return; }
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = src;
      loaders.push(img);
    });
  }, [items]);

  // Drag handling for the pill
  const onDragAt = (clientX: number) => {
    const vp = storiesRef.current;
    const bar = progressRef.current;
    if (!vp || !bar) return;

    const rect = bar.getBoundingClientRect();
    const t = thumbPct;
    const usable = rect.width * (1 - t);
    const clamped = Math.max(0, Math.min(usable, clientX - rect.left - (t * rect.width) / 2));
    const ratio = usable > 0 ? clamped / usable : 0;

    const max = vp.scrollWidth - vp.clientWidth;
    vp.scrollTo({ left: ratio * max });
  };

  const onPointerDownPill = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    progressRef.current?.setPointerCapture(e.pointerId);
    onDragAt(e.clientX);
  };
  const onPointerMovePill = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    onDragAt(e.clientX);
  };
  const onPointerUpPill = () => { draggingRef.current = false; };

  return (
    <div className="strip stories-strip" onMouseLeave={() => { /* nothing special here */ }}>
      <div className="stories-viewport" ref={storiesRef} aria-label="Stories">
        <div className="stories-track">
          {items.map((book) => (
            <div
              key={book.id}
              className="story-cover"
              title={book.title ?? String(book.id)}         /* title attr only; no visible caption */
              aria-label={book.title ? `Story: ${book.title}` : `Story ${book.id}`}
              tabIndex={0}
              onMouseEnter={() => onPreview?.(book)}
              onPointerDown={() => flushSync(() => onSelect?.(book))}
              onClick={() => onSelect?.(book)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(book);
                }
              }}
              style={{
                backgroundImage: book.coverUrl ? `url(${book.coverUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: "#1b1b1b",
              }}
            />
          ))}

          {addTileHref && (
            <a
              className="story-cover"
              href={addTileHref}
              aria-label="Add new submission"
              title="Add new submission"
              style={{
                display: "grid",
                placeItems: "center",
                background: "#262626",
                textDecoration: "none",
                color: "#fff",
                fontWeight: 800,
                fontSize: "clamp(28px, 3.2vw, 40px)",
              }}
            >
              +
            </a>
          )}
        </div>
      </div>

      {canScrollStories && (
        <div
          className="stories-progress"
          ref={progressRef}
          role="slider"
          aria-label="Scroll stories"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(storiesProgress * 100)}
          tabIndex={0}
          onPointerDown={onPointerDownPill}
          onPointerMove={onPointerMovePill}
          onPointerUp={onPointerUpPill}
          onPointerCancel={onPointerUpPill}
          onKeyDown={(e) => {
            const vp = storiesRef.current;
            if (!vp) return;
            const max = vp.scrollWidth - vp.clientWidth;
            const step = vp.clientWidth * 0.1;
            if (e.key === "ArrowRight") vp.scrollTo({ left: Math.min(vp.scrollLeft + step, max) });
            if (e.key === "ArrowLeft")  vp.scrollTo({ left: Math.max(vp.scrollLeft - step, 0) });
          }}
        >
          <div
            className="stories-thumb"
            style={{ width: `${thumbPct * 100}%`, left: `${storiesProgress * (100 - thumbPct * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
