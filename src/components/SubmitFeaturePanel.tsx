// src/components/SubmitFeaturePanel.tsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import LikeButton from "@/components/LikeButton";
import CommentButton from "@/components/CommentButton";
import StarButton from "@/components/StarButton";
import SaveButton from "@/components/SaveButton";

import { profile } from "@/profileData";

// ✅ add this import (adjust path if needed)
import { useConfirm } from "@/components/ConfirmPopover";

type Status = "inProgress" | "published";

type SubmitPanelBook = {
  id: string | number;
  title: string;
  author?: string;
  coverUrl?: string | null;
  tags?: string[];
  rating?: number | string;
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

function colorFromString(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const bg = `hsl(${h} 70% 50% / 0.16)`;
  const border = `hsl(${h} 70% 50% / 0.38)`;
  const text = `hsl(${h} 85% 92%)`;
  return { bg, border, text };
}

export type SubmitFeatureMetaState = {
  liked: boolean;
  saved: boolean;
  likeCount: number;
  saveCount: number;
};

interface SubmitFeaturePanelProps {
  book?: SubmitPanelBook | null;
  metaState?: SubmitFeatureMetaState;
  onToggleLike?: () => void;
  onToggleSave?: () => void;

  // ✅ new prop
  onTogglePublish?: () => void;
}

const SubmitFeaturePanel: React.FC<SubmitFeaturePanelProps> = ({
  book,
  metaState,
  onToggleLike,
  onToggleSave,
  onTogglePublish,
}) => {
  const navigate = useNavigate();
  const confirm = useConfirm(); // ✅

  const coverSrc = useMemo(() => getCoverSrcFromBook(book), [book]);

  if (!book) {
    return (
      <div className="submit-feature-shell is-empty">
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
  const submission = book.project?.submission ?? {};
  const authorLabel = submission.author?.trim() || book.author?.trim() || "Unknown author";

  const tags =
    Array.isArray(book.tags) && book.tags.length > 0
      ? book.tags
      : submission.mainGenre
      ? [submission.mainGenre]
      : [];

  const liked = metaState?.liked ?? false;
  const saved = metaState?.saved ?? false;
  const displayLikes = metaState?.likeCount ?? 0;
  const displaySaves = metaState?.saveCount ?? 0;

  const combinedRating = Number(book?.rating ?? 0) || 0;
  const hasUserCommentedCenter = false;
  const hasUserReviewedCenter = false;

  const profileAvatarSrc = (profile as any)?.avatarUrl || (profile as any)?.photo || "";

  const openHomeAtBook = (mode?: "comments" | "reviews") => {
    const id = String(book.id ?? "");
    if (!id) return;
    const qs = mode
      ? `/?book=${encodeURIComponent(id)}&open=${mode}`
      : `/?book=${encodeURIComponent(id)}`;
    navigate(qs);
  };

  const handleEdit = () => {
    navigate("/write", {
      state: {
        project: book.project ?? null,
        shelfBook: {
          id: book.id,
          title: book.title,
          author: authorLabel,
          tags,
          coverUrl: book.coverUrl ?? null,
        },
        status: book.status,
      },
    });
  };

  const handlePreview = () => {
    if (!book.project) return;

    const chapters = book.project.chapters ?? [];
    navigate("/preview", {
      state: {
        book: {
          id: String(book.id),
          title: book.title,
          author: authorLabel,
          tags,
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

  const isPublished = book.status === "published";

  // ✅ confirmation wrapper for publish/unpublish
  const handlePublishClick = async () => {
    if (!onTogglePublish) return;

    const ok = await confirm({
      title: isPublished ? "Unpublish this book?" : "Publish this book?",
      message: isPublished
        ? "This will move it back to In progress."
        : "This will move it to Published.",
      confirmText: isPublished ? "Unpublish" : "Publish",
      cancelText: "Cancel",
      danger: isPublished, // only treat unpublish as “danger” if you want
    });

    if (ok) onTogglePublish();
  };

  return (
    <div className="submit-feature-shell">
      <div className="rm-shell">
        <div className="rm-cover-btn" aria-hidden="true">
          <div className="rm-cover-box">
            {coverSrc ? <img src={coverSrc} alt={`${book.title} cover`} /> : <span className="rm-cover-plus">+</span>}
          </div>
        </div>

        <h2 className="rm-title">{book.title || "Untitled project"}</h2>
        <hr className="meta-hr" />

        <div className="rm-middle">
          <div className="feature-author">
            <Link to="/profile" className="meta-avatar-link" aria-label="Open profile" onClick={(e) => e.stopPropagation()}>
              <span className="meta-avatar--sm" aria-hidden={true}>
                {profileAvatarSrc ? (
                  <img src={profileAvatarSrc} alt="" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
                    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                    <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                    <path d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </span>
            </Link>

            <Link to="/profile" className="meta-username" title={authorLabel} onClick={(e) => e.stopPropagation()}>
              <span className="feature-author-name">{authorLabel}</span>
            </Link>
          </div>

          <hr className="meta-hr" />
          <div className="meta-actions">
            <LikeButton className="meta-icon-btn like" count={displayLikes} active={liked} onToggle={onToggleLike} />
            <CommentButton active={hasUserCommentedCenter} onOpenComments={() => openHomeAtBook("comments")} />
            <StarButton rating={combinedRating} hasUserReviewed={hasUserReviewedCenter} onOpenReviews={() => openHomeAtBook("reviews")} />
            <SaveButton className="meta-icon-btn save" count={displaySaves} active={saved} onToggle={onToggleSave} />
          </div>

          <hr className="meta-hr" />
          <div className="align-left">
            <div className="meta-chapters-row">
              <p className="meta-chapters">
                <span>
                  {chapterCount} chapter{chapterCount === 1 ? "" : "s"}
                </span>
              </p>

              {tags[0] && (
                <span
                  className="genre-pill"
                  title={tags[0]}
                  style={{
                    backgroundColor: colorFromString(tags[0]).bg,
                    borderColor: colorFromString(tags[0]).border,
                    color: colorFromString(tags[0]).text,
                  }}
                >
                  {tags[0]}
                </span>
              )}
            </div>
          </div>

          <hr className="meta-hr" />
        </div>

        <div className="rm-actions">
          <button type="button" className="rm-btn rm-btn-preview" onClick={handleEdit}>
            Edit
          </button>
          <button type="button" className="rm-btn rm-btn-save" onClick={handlePreview}>
            Preview
          </button>

          {/* ✅ now uses confirm popover */}
          <button type="button" className="rm-btn rm-btn-publish" onClick={handlePublishClick}>
            {isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitFeaturePanel;