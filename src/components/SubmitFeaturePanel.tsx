// src/components/SubmitFeaturePanel.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BookWithStatus } from "@/pages/Submit";

type Status = "inProgress" | "published";

type SubmitPanelBook = BookWithStatus;

interface SubmitFeaturePanelProps {
  book?: SubmitPanelBook | null;
}

const SubmitFeaturePanel: React.FC<SubmitFeaturePanelProps> = ({ book }) => {
  const navigate = useNavigate();
  const [coverSrc, setCoverSrc] = useState<string | null>(null);

  // Build a usable cover URL for both static and user-created books
  useEffect(() => {
    let revokeUrl: string | null = null;

    if (!book) {
      setCoverSrc(null);
      return;
    }

    if (book.coverUrl) {
      setCoverSrc(book.coverUrl);
    } else if (book.project?.submission?.coverFile instanceof File) {
      const url = URL.createObjectURL(book.project.submission.coverFile);
      setCoverSrc(url);
      revokeUrl = url;
    } else {
      setCoverSrc(null);
    }

    return () => {
      if (revokeUrl) {
        try {
          URL.revokeObjectURL(revokeUrl);
        } catch {}
      }
    };
  }, [book]);

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

  const chapterCount = book.project?.chapters?.length ?? 0;
  const mainGenre =
    book.project?.submission?.mainGenre ??
    (book.tags && book.tags.length > 0 ? book.tags[0] : "");

  const isPublished = book.status === "published";

  const handleEdit = () => {
    navigate("/write", {
      state: {
        project: book.project ?? null,
        shelfBook: {
          id: book.id,
          title: book.title,
          author: book.author ?? "",
          tags: book.tags ?? [],
          coverUrl: null, // let Write/Preview rebuild from project if needed
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
        status: book.status,
      },
    });
  };

  const handlePublish = () => {
    if (!book.project) return;

    navigate("/submit", {
      state: {
        shelfBook: {
          id: book.id,
          title: book.title,
          author: book.author ?? "",
          year: "",
          coverUrl: null, // Submit will rebuild from File
          likes: book.likes ?? 0,
          bookmarks: book.bookmarks ?? 0,
          rating: book.rating ?? 0,
          userRating: book.userRating ?? 0,
          tags: book.tags ?? [],
        },
        status: "published" as Status,
        project: book.project,
      },
    });
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
            disabled={isPublished}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitFeaturePanel;
