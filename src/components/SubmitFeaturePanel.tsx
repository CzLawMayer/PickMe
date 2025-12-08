// src/components/SubmitFeaturePanel.tsx
import React, { useEffect, useMemo, useState } from "react";
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
      coverFile?: File | null;
      backCoverFile?: File | null;
    };
    chapters?: { id: string; title: string; content: string }[];
  };
};

function getCoverSrcFromBook(book?: SubmitPanelBook | null): string | null {
  if (!book) return null;
  if (book.coverUrl) return book.coverUrl;

  const file = book.project?.submission?.coverFile;
  if (file instanceof File) {
    const cached = (book.project as any).__coverUrl as string | undefined;
    if (cached) return cached;
    const url = URL.createObjectURL(file);
    (book.project as any).__coverUrl = url;
    return url;
  }
  return null;
}

interface SubmitFeaturePanelProps {
  book?: SubmitPanelBook | null;
  // NEW: let SubmitPage control publishing
  onPublish?: (book: SubmitPanelBook) => void;
}

const SubmitFeaturePanel: React.FC<SubmitFeaturePanelProps> = ({
  book,
  onPublish,
}) => {
  const navigate = useNavigate();
  const [coverSrc, setCoverSrc] = useState<string | null>(null);

  const memoCover = useMemo(() => getCoverSrcFromBook(book), [book]);

  useEffect(() => {
    let revokeUrl: string | null = null;

    if (!book) {
      setCoverSrc(null);
      return;
    }

    if (book.coverUrl) {
      setCoverSrc(book.coverUrl);
    } else {
      const file = book.project?.submission?.coverFile;
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        setCoverSrc(url);
        revokeUrl = url;
      } else {
        setCoverSrc(memoCover);
      }
    }

    return () => {
      if (revokeUrl) {
        try {
          URL.revokeObjectURL(revokeUrl);
        } catch {}
      }
    };
  }, [book, memoCover]);

  // Empty state (no book selected)
  if (!book) {
    return (
      <div className="submit-feature-shell">
        <div className="rm-shell">
          <h3 className="brand-mark">
            <span className="brand-p">P</span>ic<span className="brand-k">k</span>
            <span className="brand-m">M</span>e<span className="brand-bang">!</span>
          </h3>
        </div>
      </div>
    );
  }

  const chapterCount = book.project?.chapters?.length ?? 0;
  const mainGenre =
    book.project?.submission?.mainGenre ??
    (book.tags && book.tags.length > 0 ? book.tags[0] : "");

  const handleEdit = () => {
    navigate("/write", {
      state: {
        project: book.project ?? null,
        shelfBook: {
          id: book.id,
          title: book.title,
          author: book.author ?? "",
          tags: book.tags ?? [],
          coverUrl: null, // let Write/Preview recreate from project if needed
        },
        status: book.status,
      },
    });
  };

  const handlePreview = () => {
    if (!book.project) return;

    const chapters = book.project.chapters ?? [];
    const submission = book.project.submission ?? {};

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
          totalChapters: chapters.length,
          coverFile: submission.coverFile ?? null,
          backCoverFile: submission.backCoverFile ?? null,
        },
        project: book.project,
      },
    });
  };

  // NEW: always “publish” (no unpublish logic needed)
  const handlePublish = () => {
    if (!book) return;
    if (onPublish) {
      onPublish(book);
    }
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
            onClick={handlePublish}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitFeaturePanel;
