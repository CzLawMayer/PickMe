import React from "react";

type Props = {
  count?: number;
  active: boolean;
  onOpenComments: () => void;
};

export default function CommentButton({ count = 0, active, onOpenComments }: Props) {
  return (
    <button
      type="button"
      className={`meta-icon-btn meta-comment-btn ${active ? "is-active" : ""}`}
      aria-pressed={active}
      aria-label="Open comments"
      title="Comments"
      onClick={(e) => {
        e.stopPropagation();
        onOpenComments();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onOpenComments();
        }
      }}
    >
      <span className="meta-icon-slot" aria-hidden="true">
        <span className="material-symbols-outlined meta-icon-glyph">chat_bubble</span>
      </span>
      <span className="meta-icon-count">{count}</span>
    </button>
  );
}
