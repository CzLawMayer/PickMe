import { useEffect, useRef } from "react"

type SideMenuProps = {
  open: boolean
  onClose: () => void
}

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const firstLinkRef = useRef<HTMLButtonElement | null>(null)

  // Close on ESC, focus first item on open, lock body scroll
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", onKey)
      setTimeout(() => firstLinkRef.current?.focus(), 0)
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.removeEventListener("keydown", onKey)
        document.body.style.overflow = prev
      }
    }
  }, [open, onClose])

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
        {/* Dark header bar like your mock */}
        <div className="menu-header">
          <div className="menu-burger">
            <i />
            <i />
            <i />
          </div>
          <span className="menu-title">Menu</span>
        </div>

        {/* Full-color items */}
        <nav className="menu-list">
          <button
            ref={firstLinkRef}
            className="menu-item fill profile"
            onClick={() => {}}
          >
            <span className="menu-emoji">🧑</span>
            <span className="menu-text">Profile</span>
          </button>

          <button className="menu-item fill library" onClick={() => {}}>
            <span className="menu-emoji">📚</span>
            <span className="menu-text">Library</span>
          </button>

          <button className="menu-item fill submit" onClick={() => {}}>
            <span className="menu-emoji">✍️</span>
            <span className="menu-text">Submit</span>
          </button>

          <button className="menu-item fill logout" onClick={() => {}}>
            <span className="menu-emoji">🚪</span>
            <span className="menu-text">Log Out</span>
          </button>
        </nav>
      </aside>
    </>
  )
}
