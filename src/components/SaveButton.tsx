import React from "react";

type SaveButtonProps = {
  count?: number;
  active?: boolean;
  onToggle?: () => void;
};

export default function SaveButton({ count = 0, active = false, onToggle }: SaveButtonProps) {
  return (
    <button
      type="button"
      className={`meta-icon-btn save ${active ? "is-active" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span className="meta-icon-slot" aria-hidden="true">
        <span className="material-symbols-outlined meta-icon-glyph">bookmark</span>
      </span>
      <span className="meta-icon-count">{count}</span>
    </button>
  );
}
