// src/components/SubmitFeaturePanel.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

type Status = "inProgress" | "published";

type SubmitPanelBook = {
  id: string | number;
  title: string;
  author?: string;
  coverUrl?: string | null;
  tags?: string[];
  status: Status;
  project?: {
    submission?: {
      title?: string;
      author?: string;
      mainGenre?: string;
      dedication?: string;
      coverUrl?: string | null;
      backCoverUrl?: string | null;
    };
    chapters?: { id: string; title: string; content: string }[];
  };
};

function getCoverSrcFromBook(book?: SubmitPanelBook | null): string | null {
  if (!book) return null;
  if (book.coverUrl) return book.coverUrl || null;
  const submission = book.project?.submission;
  if (submission?.coverUrl) return submission.coverUrl || null;
  return null;
}

interface SubmitFeaturePanelProps {
  book?: SubmitPanelBook | null;
}

const SubmitFeaturePanel: React.FC<SubmitFeaturePanelProps> = ({ book }) => {
  const navigate = useNavigate();
  const coverSrc = useMemo(() => getCoverSrcFromBook(book), [book]);

  if (!book) {
    return (
      <div className="submit-feature-shell">
        <div className="rm-shell">
          <h3 className="brand-mark">
            <span className="brand-p">P</span>ic
            <span className="brand-k">k</span>
            <span className="brand-m">M</span>e
            <span className="brand-bang">!</span>
          </h3>
        </div>
      </div>
    );
  }

  const chapters = book.project?.chapters ?? [];
  const submission = book.project?.submission ?? {};
  const chapterCount = chapters.length;
  const mainGenre =
    submission.mainGenre ??
    (book.tags && book.tags.length > 0 ? book.tags[0] : "");

  const isPublished = book.status === "published";

  const handleEdit = () => {
    navigate("/write", {
      state: {
        project: book.project ?? null,
      },
    });
  };

  const handlePreview = () => {
    const project = book.project;
    if (!project) return;

    navigate("/preview", {
      state: {
        book: {
          id: String(book.id),
          title: book.title,
          author: submission.author ?? book.author ?? "",
          tags: book.tags ?? [],
          dedication: submission.dedication ?? "",
          chapters: chapters.map((c) => c.title),
          chapterTexts: chapters.map((c) => c.content),
          totalChapters: chapterCount,
          coverUrl:
            submission.coverUrl ?? book.coverUrl ?? undefined,
          backCoverUrl: submission.backCoverUrl ?? undefined,
        },
        project,
      },
    });
  };

  const handlePublishToggle = () => {
    // future: toggle status from here
  };

  return (
    <div className="submit-feature-shell">
      <div className="rm-shell">
        <h2 className="rm-title">{book.title || "Untitled project"}</h2>

        <div className="rm-middle">
          <div className="rm-cover-btn" aria-hidden="true">
            <div className="rm-cover-box">
              {coverSrc ? (
                <img src={coverSrc} alt={`${book.title} cover`} />
              ) : (
                <span className="rm-cover-plus">+</span>
              )}
            </div>
          </div>

          <div className="rm-meta">
            <div className="rm-chapters">
              {chapterCount} chapter{chapterCount === 1 ? "" : "s"}
            </div>
            <div className="rm-separator" />
            <div className="rm-genre">{mainGenre}</div>
          </div>
        </div>

        <div className="rm-actions">
          <button
            type="button"
            className="rm-btn rm-btn-preview"
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="rm-btn rm-btn-save"
            onClick={handlePreview}
          >
            Preview
          </button>
          <button
            type="button"
            className="rm-btn rm-btn-publish"
            onClick={handlePublishToggle}
          >
            {isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitFeaturePanel;
