import React from "react";
import { Share2 } from "lucide-react";

type ShareButtonProps = {
  count?: number;
};

export default function ShareButton({ count = 0 }: ShareButtonProps) {
  return (
    <button
      type="button"
      className="meta-icon-btn share"
      aria-label="Share"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="meta-icon-slot" aria-hidden="true">
        <Share2 className="meta-icon-svg" />
      </span>
      <span className="meta-icon-count">{count}</span>
    </button>
  );
}