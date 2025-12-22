// src/components/CommentButton.tsx
import React from "react";
import { MessageCircle } from "lucide-react";

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
    >
      <MessageCircle
        className="meta-icon-svg"
        size={28}
        strokeWidth={1.5}
        fill={active ? "currentColor" : "none"}
      />
      <span className="meta-icon-count">{count}</span>
    </button>
  );
}
