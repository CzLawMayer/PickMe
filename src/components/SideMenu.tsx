import { useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // ✅ import Link

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function SideMenu({ open, onClose }: SideMenuProps) {
  // Focus the first menu item when opened
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null); // ✅ anchor, not button

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

        <nav className="menu-list" onClick={onClose}>
          {/* Profile (Link) */}
          <Link
            ref={firstLinkRef}               // ✅ focus target
            to="/profile"
            className="menu-item fill profile"
          >
            <span className="menu-emoji">🧑</span>
            <span className="menu-text">Profile</span>
          </Link>

          {/* Keep the rest as buttons for now (or swap to Links later) */}
          <button className="menu-item fill library" type="button">
            <span className="menu-emoji">📚</span>
            <span className="menu-text">Library</span>
          </button>

          <button className="menu-item fill submit" type="button">
            <span className="menu-emoji">✍️</span>
            <span className="menu-text">Submit</span>
          </button>

          <button className="menu-item fill logout" type="button">
            <span className="menu-emoji">🚪</span>
            <span className="menu-text">Log Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
