// src/pages/Library.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";


import SideMenu from "@/components/SideMenu";
import FeaturePanel from "@/components/FeaturePanel";
import ProfileIdentity from "@/components/ProfileIdentity";

import "./Library.css";

// actions
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import StarButton from "@/components/StarButton";


// put near the top of Library.tsx (after imports)
function StarInlineExact({
  userRating,
  average = 0,
  ratingCount = 0,
  onRate,
  className,
}: {
  userRating?: number | null;
  average?: number | null;
  ratingCount?: number;
  onRate?: (v: number) => void;
  className?: string;
}) {
  const current = typeof userRating === "number" ? userRating : 0;
  const display = current > 0 ? current : (average ?? 0);

  return (
    <>
      {/* EXACT same classes as Profile/Home */}
      <StarButton
        className={`meta-icon-btn star ${current > 0 ? "is-active" : ""} ${className ?? ""}`}
        glyphClass="meta-icon-glyph"
        // pass every variant your app might use (StarButton will ignore extras)
        value={current}
        rating={current}
        userRating={current}
        average={average ?? 0}
        averageRating={average ?? 0}
        ratingCount={ratingCount}
        onRate={onRate}
        onChange={onRate}
        // behaviors used elsewhere so the popover auto-opens when unrated
        openPopoverIfUnrated
        autoOpenIfUnrated
        showPopoverIfUnrated
        // keep it visually “bare” (Profile/Home do their own styling)
        variant="bare"
        hideLabel
        hideText
      />
      <span className="meta-icon-count">
        {display ? Number(display).toFixed(display % 1 ? 1 : 0) : "—"}
      </span>
    </>
  );
}



function InlineStarExact({
  className,
  userRating,
  average = 0,
  onRate,
}: {
  className?: string;
  userRating?: number | null;
  average?: number | null;
  onRate?: (v: number) => void;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState<boolean>(!userRating || userRating <= 0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const current = useMemo(
    () => (typeof userRating === "number" ? userRating : 0),
    [userRating]
  );
  const display = current > 0 ? current : average || 0;

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: Math.round(r.bottom + 8), left: Math.round(r.left + r.width / 2) });
  };

  useEffect(() => {
    if (open) {
      updatePos();
      const onScroll = () => updatePos();
      const onResize = () => updatePos();
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onResize);
      };
    }
  }, [open]);

  useEffect(() => {
    if (!current || current <= 0) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      const pop = document.getElementById("star-popover-floating");
      if (!btnRef.current) return;
      if (pop && (pop.contains(t) || btnRef.current.contains(t))) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const handleRate = (v: number) => {
    onRate?.(v);
    setOpen(false);
  };

  return (
    <>
      {/* EXACT inline markup/classes like Profile/Home */}
      <button
        ref={btnRef}
        type="button"
        className={`meta-icon-btn star ${current > 0 ? "is-active" : ""} ${className ?? ""}`}
        aria-label={current > 0 ? `Rated ${current}/5` : "Rate this"}
        onClick={() => setOpen((o) => !o)}
      >
        {/* IMPORTANT: same glyph class stack */}
        <span className="material-symbols-outlined meta-icon-glyph" aria-hidden="true">
          grade
        </span>
      </button>
      <span className="meta-icon-count">
        {display ? Number(display).toFixed(display % 1 ? 1 : 0) : "—"}
      </span>

      {/* Popover in a portal, using your existing star-popover styles */}
      {open && pos &&
        createPortal(
          <div className="star-portal" role="dialog" aria-modal="true">
            <div
              id="star-popover-floating"
              className="star-popover"
              style={{ top: pos.top, left: pos.left, bottom: "auto", transform: "translate(-50%, 0)" }}
            >
              <div className="star-row" role="group" aria-label="Set your rating">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`star-item${v <= (current || 0) ? " is-on" : ""}`}
                    onMouseEnter={(e) => (e.currentTarget.parentElement!.dataset.hover = String(v))}
                    onMouseLeave={(e) => (e.currentTarget.parentElement!.dataset.hover = "")}
                    onClick={() => handleRate(v)}
                    aria-label={`${v} star${v > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="star-hint">
                {current ? `Your rating: ${current}/5` : `Average: ${average?.toFixed(1) || "—"}/5`}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}


/* ---------------------------------------------------------
   SmartStarButton:
   - Defers UI to StarButton (so it looks/behaves like elsewhere)
   - Auto-opens popover if unrated
   - Normalizes prop names (value/rating/userRating, onRate/onChange)
--------------------------------------------------------- */
type SmartStarButtonProps = {
  className?: string;
  glyphClass?: string;
  rating?: number | null;
  userRating?: number | null;
  value?: number | null;
  average?: number | null;
  averageRating?: number | null;
  ratingCount?: number;
  onRate?: (v: number) => void;
  onChange?: (v: number) => void;
};

function SmartStarButton({
  className,
  glyphClass = "meta-icon-glyph",
  rating,
  userRating,
  value,
  average,
  averageRating,
  ratingCount = 0,
  onRate,
  onChange,
}: SmartStarButtonProps) {
  const current = useMemo(() => {
    const v = userRating ?? rating ?? value ?? 0;
    return typeof v === "number" ? v : 0;
  }, [userRating, rating, value]);

  const avg = average ?? averageRating ?? 0;

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!current || current <= 0) setOpen(true);
    // open once on mount when unrated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRate = (v: number) => {
    onRate?.(v);
    onChange?.(v);
    setOpen(false);
  };

  const starProps: Record<string, any> = {
    className: `meta-icon-btn star ${current > 0 ? "is-active" : ""} ${className ?? ""}`,
    glyphClass,
    value: current || 0,
    rating: current || 0,
    userRating: current || 0,
    average: avg,
    averageRating: avg,
    ratingCount,
    onRate: handleRate,
    onChange: handleRate,
    open,
    onOpenChange: setOpen,
    openPopoverIfUnrated: true,
    autoOpenIfUnrated: true,
    showPopoverIfUnrated: true,
    variant: "bare",
    hideLabel: true,
    hideText: true,
  };

  // @ts-expect-error StarButton supports a superset of these props elsewhere in the app
  return <StarButton {...starProps} />;
}

export default function LibraryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // demo states (wire to real book data later)
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);      // <- keep name consistent
  const [userRating, setUserRating] = useState<number>(0);

  const [likeCount, setLikeCount] = useState(123);
  const [saveCount, setSaveCount] = useState(45);

  const onToggleLike = () => {
    setLiked(v => !v);
    setLikeCount(c => (liked ? Math.max(0, c - 1) : c + 1));
  };
  const onToggleSave = () => {
    setSaved(v => !v);                          // <- uses "saved"
    setSaveCount(c => (saved ? Math.max(0, c - 1) : c + 1));
  };

  return (
    <div className="library-app">
      {/* Header */}
      <header className="header">
        <h1 className="logo">
          <Link to="/" className="logo-link" aria-label="Go to home">
            Pick<span>M</span>e!
          </Link>
        </h1>

        <div className="header-icons">
          <button type="button" className="icon" aria-label="write">✏️</button>
          <button type="button" className="icon" aria-label="search">🔍</button>
          <button
            type="button"
            className="icon icon-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? "X" : "☰"}
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="library-layout">
        <div className="library-left">
          <section className="lib-hero" aria-label="Library header">
            <div className="identity-cell" style={{ minWidth: 0 }}>
              <ProfileIdentity compact />
            </div>

            <nav className="lib-tabs" aria-label="Library sections">
              <Link to="/profile" className="lib-tab">Profile</Link>
              <Link to="/library" className="lib-tab" aria-current="page">Library</Link>
              <Link to="/read" className="lib-tab">Read</Link>
              <Link to="/reviews" className="lib-tab">Reviews</Link>
            </nav>
          </section>

          <section className="lib-row" aria-label="Work area">
            <div className="lib-col">
              <div className="lib-card" aria-label="Book card in column 1">
                <div className="lib-cover" aria-label="Book cover placeholder" />
                <div className="lib-details" aria-label="Book details">
                  <div className="lib-line">Row 1 — sample sentence.</div>
                  <div className="lib-line">Row 2 — sample sentence.</div>

                  <div className="lib-row lib-row-actions is-inline" role="group" aria-label="Likes, rating, saves">
                    <LikeButton
                      className={`meta-icon-btn like ${liked ? "is-active" : ""}`}
                      glyphClass="meta-icon-glyph"
                      countClass="meta-icon-count"
                      active={liked}
                      count={likeCount}
                      onToggle={onToggleLike}
                      aria-label={liked ? "Unlike" : "Like"}
                    />

                    <StarButton
                      className={`meta-icon-btn star ${userRating > 0 ? "is-active" : ""}`}
                      glyphClass="meta-icon-glyph"
                      countClass="meta-icon-count"       // <- StarButton prints the count itself
                      rating={userRating || 0}
                      userRating={userRating || 0}
                      average={4.3}
                      averageRating={4.3}
                      ratingCount={128}
                      onRate={(v) => setUserRating(v)}
                      onChange={(v) => setUserRating(v)}
                    />

                    <SaveButton
                      className={`meta-icon-btn save ${saved ? "is-active" : ""}`}
                      glyphClass="meta-icon-glyph"
                      countClass="meta-icon-count"
                      active={saved}
                      count={saveCount}
                      onToggle={onToggleSave}
                      aria-label={saved ? "Unsave" : "Save"}
                    />
                  </div>


                  <div className="lib-line">Row 4 — sample sentence.</div>
                  <div className="lib-line">Row 5 — sample sentence.</div>
                </div>
              </div>
            </div>

            <div className="lib-col" />
            <div className="lib-col" />
            <div className="lib-col" />
          </section>

          <section className="lib-content" aria-label="Library content">
            {/* TODO: book grid/list */}
          </section>
        </div>

        <aside className="library-feature" aria-label="Featured">
          <FeaturePanel />
        </aside>
      </main>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
