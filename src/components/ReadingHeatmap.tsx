// src/components/ReadingHeatmap.tsx
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import "@uiw/react-heat-map/dist.css";

/** Minimal value shape this lib accepts */
type Value = { date: string; count?: number };

/** Quick width observer for responsive sizing */
function useWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, width: w };
}


/** TEMP: mock data so you can see the grid right away */
function mockYearValues(year: number): Value[] {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const out: Value[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (Math.random() < 0.35) {
      out.push({ date: d.toISOString().slice(0, 10), count: 1 + Math.floor(Math.random() * 4) });
    }
  }
  return out;
}

type Props = {
  year?: number;          // default: current year (Jan 1 -> Dec 31)
  values?: Value[];       // pass real data later
};

export default function ReadingHeatmap({ year, values }: Props) {
  const targetYear = year ?? new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate   = new Date(targetYear, 11, 31);
  const data = useMemo(() => values ?? mockYearValues(targetYear), [values, targetYear]);

  // columns ≈ weeks; compute rect size from width so it fills nicely
  const msInDay = 24 * 3600 * 1000;
  const days = Math.max(1, Math.round((+endDate - +startDate) / msInDay) + 1);
  const weeks = Math.ceil(days / 7);
  const gap = 2;

  const { ref, width } = useWidth();
  const rectSize = Math.max(8, Math.floor((width - gap * (weeks - 1)) / weeks));



    useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const legend = root.querySelector(".w-heatmap-legend");
    if (!legend) return;

    // Desired labels in left→right order
    const tips = [
        "No activity",
        "Logged in",
        "Opened a book",
        "Saved a book",
        "Read one chapter",
        "Finished a book",
    ];

    // Create a floating tooltip element
    const tipEl = document.createElement("div");
    tipEl.className = "heatmap-float-tip";
    tipEl.style.position = "fixed";
    tipEl.style.zIndex = "9999";
    tipEl.style.pointerEvents = "none";
    tipEl.style.opacity = "0";
    tipEl.style.transition = "opacity 120ms ease, transform 120ms ease";
    tipEl.style.background = "rgba(0,0,0,0.92)";
    tipEl.style.color = "#fff";
    tipEl.style.fontSize = "12px";
    tipEl.style.fontWeight = "600";
    tipEl.style.padding = "6px 8px";
    tipEl.style.borderRadius = "8px";
    tipEl.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
    document.body.appendChild(tipEl);

    const showTip = (text: string, x: number, y: number) => {
        tipEl.textContent = text;
        tipEl.style.left = `${x}px`;
        tipEl.style.top = `${y - 14}px`;
        tipEl.style.opacity = "1";
        tipEl.style.transform = "translate(-50%, -8px)";
    };
    const hideTip = () => {
        tipEl.style.opacity = "0";
        tipEl.style.transform = "translate(-50%, 0)";
    };

    // Heuristic: collect legend “swatches” regardless of HTML/SVG
    const candidateNodes = Array.from(
        legend.querySelectorAll<HTMLElement>("li, span, div, svg, rect")
    );

    const looksLikeSwatch = (el: Element) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        const isSquareish = r.width >= 8 && r.width <= 24 && r.height >= 8 && r.height <= 24;
        const tag = el.tagName.toLowerCase();
        const cs = (el as HTMLElement).style;
        const hasInlineBg = !!cs.background || !!cs.backgroundColor;
        const isRect = tag === "rect";
        return isSquareish && (hasInlineBg || isRect);
    };

    const swatches = candidateNodes.filter(looksLikeSwatch).slice(0, 6);

    // Wire events; fallback order to avoid crashing if fewer swatches were found
    const cleanups: Array<() => void> = [];
    swatches.forEach((el, i) => {
        const label = tips[i] || "";
        const onEnter = (e: Event) => {
        const me = e as MouseEvent;
        showTip(label, me.clientX, me.clientY);
        };
        const onMove = (e: Event) => {
        const me = e as MouseEvent;
        showTip(label, me.clientX, me.clientY);
        };
        const onLeave = () => hideTip();

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);

        // cursor hint (works on HTML; harmless on SVG)
        (el as HTMLElement).style.cursor = "help";

        cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        });
    });

    return () => {
        cleanups.forEach((fn) => fn());
        document.body.removeChild(tipEl);
    };
    }, [ref, rectSize, startDate.getTime(), endDate.getTime()]);

    useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Force month & weekday labels to bright white, full opacity
    const groups = root.querySelectorAll<SVGGElement>(".w-heatmap-week, .w-heatmap-month");
    groups.forEach((g) => {
        g.style.opacity = "1";
        g.removeAttribute("opacity");
    });

    const texts = root.querySelectorAll<SVGTextElement>(".w-heatmap-week text, .w-heatmap-month text");
    texts.forEach((t) => {
        t.style.fill = "#fff";
        t.style.opacity = "1";
        t.style.fillOpacity = "1";
        t.setAttribute("fill", "#fff");
        t.setAttribute("opacity", "1");
        t.setAttribute("fill-opacity", "1");
    });
    }, [
    ref,            // wrapper
    rectSize,       // rerun when layout changes
    startDate.getTime(),
    endDate.getTime(),
    ]);

  return (
    <div className="reading-heatmap" ref={ref}>
      <HeatMap
        startDate={startDate}
        endDate={endDate}
        value={data}
        rectSize={rectSize}
        space={gap}
        panelColors={{
          0:  "rgba(255,255,255,0.06)",
          1:  "#a6c8ff",
          2:  "#6aa8ff",
          3:  "#6a5acd",
          4:  "#b36ae3",
          6:  "#ff7a45",
        }}
        rectRender={(props, v: Value | undefined) => (
          <rect {...props}>
            <title>
              {(v?.count ?? 0) > 0
                ? `${v?.count} read${(v?.count ?? 0) > 1 ? "s" : ""} on ${v?.date}`
                : `No reading on ${v?.date}`}
            </title>
          </rect>
        )}
      />
    </div>
  );
}
