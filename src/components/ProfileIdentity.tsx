// src/components/ProfileIdentity.tsx
import React, { useLayoutEffect, useRef, useState } from "react";
import { profile as defaultProfile } from "@/profileData";

type UserProfile = {
  name: string;
  username: string;
  avatarUrl?: string;
};

type Props = {
  profile?: UserProfile;
  /** When true, slightly reduces typography to fit tighter spaces (e.g., Library hero) */
  compact?: boolean;
};

function useFitText(minPx = 12, maxPx = 48) {
  const ref = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const parent = el.parentElement;
      if (!parent) return;

      let lo = minPx;
      let hi = maxPx;

      // Binary search largest size that fits on one line
      for (let i = 0; i < 18; i++) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = `${mid}px`;
        const fitsWidth = el.scrollWidth <= el.clientWidth;
        const isOneLine =
          el.scrollHeight <= el.clientHeight || el.getClientRects().length <= 1;
        if (fitsWidth && isOneLine) lo = mid + 1;
        else hi = mid - 1;
      }
      const finalSize = Math.max(minPx, hi);
      el.style.fontSize = `${finalSize}px`;
      setSize(finalSize);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [minPx, maxPx]);

  return { ref, fontSize: size };
}

export default function ProfileIdentity({ profile, compact }: Props) {
  const p = profile ?? defaultProfile;

  // Slightly different fit ranges for compact vs full
  const nameFit = useFitText(compact ? 16 : 18, compact ? 32 : 42);
  const handleFit = useFitText(12, compact ? 18 : 24);

  return (
    <div className="profile-identity">
      <div className="profile-card">
        <div className="profile-avatar" aria-hidden={true}>
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={p.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
                display: "block",
              }}
            />
          ) : (
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
              <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <div className="profile-id" style={{ display: "grid", alignContent: "start" }}>
          <h2
            className="profile-name"
            ref={nameFit.ref as React.RefObject<HTMLHeadingElement>}
            style={{
              margin: "0 0 2px",
              fontWeight: 800,
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={p.name}
          >
            {p.name}
          </h2>

          <div
            className="profile-handle"
            ref={handleFit.ref as React.RefObject<HTMLDivElement>}
            style={{
              margin: "0 0 8px",
              opacity: 0.8,
              fontWeight: 600,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={`@${p.username}`}
          >
            @{p.username}
          </div>

          <div
            className="profile-bars"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              height: 8,
              gap: 0,
              width: compact ? "60%" : "75%",
              marginLeft: 0,
              justifySelf: "start",
            }}
          >
            <div className="bar bar-1" />
            <div className="bar bar-2" />
            <div className="bar bar-3" />
            <div className="bar bar-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
