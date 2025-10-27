import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      setTimeout(() => firstLinkRef.current?.focus(), 0);

      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
  }, [open, onClose]);

  return (
    <>
      {/* Overlay (click to close) */}
      <div
        className={`menu-overlay ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Sliding panel */}
      <aside
        className={`side-menu colorful ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <div className="menu-header">
          <span className="menu-emoji">📖</span>
          <span className="menu-title">Menu</span>
        </div>

        {/* Close menu after any item click */}
        <nav className="menu-list" onClick={onClose}>
          {/* Profile */}
          <Link
            ref={firstLinkRef}
            to="/profile"                // <— change to "/profile" if that's your route
            className="menu-item fill profile"
            aria-label="Go to Profile"
          >
            <span className="menu-emoji">🧑</span>
            <span className="menu-text">Profile</span>
          </Link>

          {/* Library (now a Link) */}
          <Link
            to="/library"
            className="menu-item fill library"
            aria-label="Go to Library"
          >
            <span className="menu-emoji">📚</span>
            <span className="menu-text">Library</span>
          </Link>

          {/* Submit (still a button for now) */}
          <button className="menu-item fill submit" type="button">
            <span className="menu-emoji">✍️</span>
            <span className="menu-text">Submit</span>
          </button>

          {/* Log Out (still a button for now) */}
          <button className="menu-item fill logout" type="button">
            <span className="menu-emoji">🚪</span>
            <span className="menu-text">Log Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
