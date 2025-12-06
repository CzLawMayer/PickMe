// src/components/SubmitFeaturePanel.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Reuse Write page styling for rm-shell / rm-title / rm-middle / rm-btn, etc.
import "../pages/Write.css";

type Status = "inProgress" | "published";

type SubmitFeatureBook = {
  id: string | number;
  title: string;
  author?: string;
  coverUrl?: string | null;
  tags?: string[];
  totalChapters?: number;
  status?: Status;
  // optional mainGenre if you add it to your data later
  mainGenre?: string;
};

interface SubmitFeaturePanelProps {
  book?: SubmitFeatureBook | null;
}

const SubmitFeaturePanel: React.FC<SubmitFeaturePanelProps> = ({ book }) => {
  const navigate = useNavigate();

  // Same brand placeholder as the old FeaturePanel
  const Brand = (
    <h3 className="brand-mark">
      <span className="brand-p">P</span>ic
      <span className="brand-k">k</span>
      <span className="brand-m">M</span>e
      <span className="brand-bang">!</span>
    </h3>
  );

  // If no book is selected, just show the brand placeholder
  if (!book) {
    return (
      <div className="feature-card submit-feature-card">
        <div className="feature-stack">
          <div className="feature-empty-inline" aria-label="No project selected">
            {Brand}
          </div>
        </div>
      </div>
    );
  }

  const status: Status = book.status ?? "inProgress";

  const title = book.title?.trim() || "Untitled project";

  const totalChaptersRaw =
    typeof (book as any).totalChapters === "number"
      ? (book as any).totalChapters
      : book.totalChapters;

  const totalChapters =
    typeof totalChaptersRaw === "number" && totalChaptersRaw > 0
      ? totalChaptersRaw
      : 0;

  const chaptersLabel =
    totalChapters > 0
      ? `${totalChapters} chapter${totalChapters === 1 ? "" : "s"}`
      : "0 chapters";

  const mainGenre =
    book.mainGenre ||
    (Array.isArray(book.tags) && book.tags.length > 0
      ? book.tags[0]
      : "Main genre not selected");

  const primaryLabel = "Edit";
  const secondaryLabel = "Preview";
  const tertiaryLabel = status === "published" ? "Unpublish" : "Publish";

  const handleEditClick = () => {
    // Later you can change this to /write?book=...
    navigate("/write");
  };

  return (
    <div className="feature-card submit-feature-card">
      <div className="rm-shell">
        <h2 className="rm-title">{title}</h2>

        <div className="rm-middle">
          <button type="button" className="rm-cover-btn">
            <div className="rm-cover-box">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={`${title} cover`} />
              ) : (
                <span className="rm-cover-plus">+</span>
              )}
            </div>
          </button>

          <div className="rm-meta">
            <div className="rm-chapters">{chaptersLabel}</div>
            <div className="rm-separator" />
            <div className="rm-genre">{mainGenre}</div>
          </div>
        </div>

        <div className="rm-actions">
          <button
            type="button"
            className="rm-btn rm-btn-preview"
            onClick={handleEditClick}
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            className="rm-btn rm-btn-save"
            onClick={() => {
              /* TODO: hook up Preview later */
            }}
          >
            {secondaryLabel}
          </button>

          <button
            type="button"
            className="rm-btn rm-btn-publish"
            onClick={() => {
              /* TODO: hook up Publish / Unpublish later */
            }}
          >
            {tertiaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitFeaturePanel;
