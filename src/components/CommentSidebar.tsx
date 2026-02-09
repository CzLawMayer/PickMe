// src/components/CommentSidebar.tsx
// @ts-nocheck
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
} from "react";
import {
  MessageSquare,
  X,
  CornerDownRight,
  Send,
  BarChart,
  MoreVertical,
  Smile,
} from "lucide-react";

import "./CommentSidebar.css";

const CURRENT_USER_ID = "CurrentUser";
const PAGE_AUTHOR_ID = "BobJohnsonTheSuperLongUsernameTester";
const ADMIN_ID = "AdminUser";
const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡"];

/* ----------------- Icons ----------------- */

const IconStarSharp = ({ size = 16, fill = "none", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconStarHalfSharp = ({ size = 16, fill = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    <path
      d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={fill}
      stroke="none"
    />
  </svg>
);

/* ----------------- Time ago ----------------- */

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const useTimeAgo = (date: number | string) => {
  const [timeAgo, setTimeAgo] = useState(() =>
    typeof date === "string" ? date : formatTimeAgo(date)
  );

  useEffect(() => {
    if (typeof date === "string") {
      setTimeAgo(date);
      return;
    }

    setTimeAgo(formatTimeAgo(date));
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(date));
    }, 30000);

    return () => clearInterval(interval);
  }, [date]);

  return timeAgo;
};

/* ----------------- Small pieces ----------------- */

const ReactionDetailsPopover = forwardRef(
  ({ reactions, onReactionClick }: any, ref: any) => {
    const reactionEntries = Object.entries(reactions || {}).filter(
      ([, count]) => count > 0
    );

    return (
      <div ref={ref} className="cs-reaction-popover">
        <div className="cs-reaction-popover-inner">
          {reactionEntries.length > 0 ? (
            reactionEntries.map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReactionClick(emoji)}
                className="cs-reaction-chip"
              >
                <span className="cs-reaction-chip-emoji">{emoji}</span>
                <span className="cs-reaction-chip-count">{count as number}</span>
              </button>
            ))
          ) : (
            <p className="cs-reaction-popover-empty">No reactions yet.</p>
          )}
        </div>
      </div>
    );
  }
);

function ConfirmationModal({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
}: any) {
  if (!isOpen) return null;

  return (
    <div className="cs-modal-backdrop">
      <div className="cs-modal">
        <h2 className="cs-modal-title">{title}</h2>
        <p className="cs-modal-text">{message}</p>
        <div className="cs-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cs-btn cs-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cs-btn cs-btn-danger"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const _CommentForm = (
  { onSubmit, placeholder = "Add a comment...", initialText = "" }: any,
  ref: any
) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);

    if (ref && ref.current) {
      ref.current.focus();
      requestAnimationFrame(() => {
        try {
          ref.current.setSelectionRange(
            initialText.length,
            initialText.length
          );
        } catch {
          // ignore
        }
      });
    }
  }, [initialText, ref]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (trimmedText) {
      if (trimmedText.startsWith("@") && trimmedText.split(" ").length === 1) {
        return;
      }
      onSubmit(trimmedText);
      setText("");

      if (ref && ref.current) {
        ref.current.style.height = "auto";
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cs-comment-form">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        placeholder={placeholder}
        className="cs-comment-input comment-input-scrollbar"
        aria-label={placeholder}
        rows={2}
      />
      <button
        type="submit"
        className="cs-comment-send-btn"
        aria-label="Send comment"
      >
        <Send size={16} />
      </button>
    </form>
  );
};

const CommentForm = forwardRef(_CommentForm);

function CommentSkeleton() {
  return (
    <div className="cs-comment-skeleton">
      <div className="cs-comment-skeleton-row">
        <div className="cs-comment-skeleton-avatar" />
        <div className="cs-comment-skeleton-lines">
          <div className="cs-comment-skeleton-line short" />
          <div className="cs-comment-skeleton-line" />
          <div className="cs-comment-skeleton-line medium" />
        </div>
      </div>
    </div>
  );
}

const ReactionSummary = forwardRef(
  (
    { reactions, userReaction, onOpenModal, onReactionClick }: any,
    ref: any
  ) => {
    const emojis = Object.keys(reactions || {});
    const totalCount = Object.values(reactions || {}).reduce(
      (sum: number, count: any) => sum + (count as number),
      0
    );

    if (totalCount === 0) return null;

    const isReacted = userReaction && reactions[userReaction];
    const hasOneReaction = emojis.length === 1;

    const cls = [
      "cs-reaction-summary",
      isReacted ? "cs-reaction-summary--active" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        onClick={
          hasOneReaction ? () => onReactionClick(emojis[0]) : onOpenModal
        }
        className={cls}
      >
        <span className="cs-reaction-summary-emojis">
          {emojis.slice(0, 3).map((emoji) => (
            <span key={emoji} className="cs-reaction-summary-emoji">
              {emoji}
            </span>
          ))}
        </span>
        <span className="cs-reaction-summary-count">{totalCount}</span>
      </button>
    );
  }
);

/* ----------------- Comment (single) ----------------- */

function Comment({
  comment,
  onAddReply,
  isReply = false,
  rating,
  onEdit,
  onDelete,
  onReport,
}: any) {
  const [reactions, setReactions] = useState(comment.reactions || {});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyState, setReplyState] = useState<"hidden" | "replyingTop" | "replyingBottom">(
    "hidden"
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);

  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLButtonElement | null>(null);
  const addReactionRef = useRef<HTMLButtonElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);

  const timeAgo = useTimeAgo(comment.date);

  useEffect(() => {
    if (replyState === "replyingTop" || replyState === "replyingBottom") {
      replyInputRef.current?.focus();
    }
  }, [replyState]);

  useEffect(() => {
    if (!isReactionModalOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsidePopover =
        popoverRef.current && !popoverRef.current.contains(target);
      const isOutsideSummary =
        summaryRef.current && !summaryRef.current.contains(target);

      if (isOutsidePopover && isOutsideSummary) {
        setIsReactionModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isReactionModalOpen]);

  useEffect(() => {
    if (!isReactionPickerOpen) return;

    function handleClickOutsidePicker(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsidePicker =
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(target);
      const isOutsideButton =
        addReactionRef.current && !addReactionRef.current.contains(target);

      if (isOutsidePicker && isOutsideButton) {
        setIsReactionPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsidePicker);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsidePicker);
  }, [isReactionPickerOpen]);

  const handleAddReply = (text: string) => {
    onAddReply(text);
    setReplyState("hidden");
    if (!isReply) {
      setShowReplies(true);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEdit) {
      const trimmedText = editText.trim();
      if (trimmedText) {
        onEdit(comment.id, trimmedText);
      }
    }
    setIsEditing(false);
  };

  const handleReactionClick = (emoji: string) => {
    const newReactions: Record<string, number> = { ...reactions };

    if (userReaction) {
      newReactions[userReaction]--;
      if (newReactions[userReaction] === 0) {
        delete newReactions[userReaction];
      }
    }

    if (userReaction === emoji) {
      setUserReaction(null);
    } else {
      newReactions[emoji] = (newReactions[emoji] || 0) + 1;
      setUserReaction(emoji);
    }

    setReactions(newReactions);
    setIsReactionPickerOpen(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(comment.id);
    setIsDeleteModalOpen(false);
  };

  const TRUNCATE_LENGTH = 200;
  const isTruncated = comment.text.length > TRUNCATE_LENGTH;
  const displayText =
    isTruncated && !isExpanded
      ? comment.text.slice(0, TRUNCATE_LENGTH) + "..."
      : comment.text;

  const containerClasses = [
    "cs-comment",
    isReply ? "cs-comment--reply" : "cs-comment--root",
  ]
    .filter(Boolean)
    .join(" ");

  const isMyComment = comment.username === CURRENT_USER_ID;
  const isAdmin = CURRENT_USER_ID === ADMIN_ID;

  return (
    <>
      <div className={containerClasses}>
        <div className="cs-comment-main-row">
          <img
            src={comment.pfpUrl}
            alt={`${comment.username}'s profile picture`}
            className="cs-comment-avatar"
          />
          <div className="cs-comment-body">
            <div className="cs-comment-header-row">
              <div className="cs-comment-user-wrap">
                <span className="cs-comment-username">{comment.username}</span>
                {comment.username === PAGE_AUTHOR_ID && (
                  <span className="cs-badge cs-badge--author">Author</span>
                )}
                {comment.username === ADMIN_ID && (
                  <span className="cs-badge cs-badge--admin">Admin</span>
                )}
              </div>
              <span className="cs-comment-time">{timeAgo}</span>
            </div>

            {rating && (
              <div className="cs-comment-rating-row">
                <StarRating rating={rating} />
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="cs-comment-edit-form">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="cs-comment-edit-input comment-input-scrollbar"
                  aria-label="Edit comment"
                  rows={4}
                  autoFocus
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div className="cs-comment-edit-actions">
                  <button type="submit" className="cs-btn cs-btn-small">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="cs-link cs-link-small"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="cs-comment-text">{displayText}</p>
                {isTruncated && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="cs-link cs-link-small cs-comment-show-more"
                  >
                    {isExpanded ? "Show Less" : "Show More"}
                  </button>
                )}

                <div className="cs-comment-actions">
                  <div className="cs-comment-reaction-area">
                    <div className="cs-comment-reaction-buttons">
                      <div className="cs-reaction-picker-wrap">
                        <button
                          ref={addReactionRef}
                          onClick={() =>
                            setIsReactionPickerOpen((current) => !current)
                          }
                          className="cs-icon-btn"
                          aria-label="Add reaction"
                        >
                          <Smile size={16} />
                        </button>
                        {isReactionPickerOpen && (
                          <div
                            ref={reactionPickerRef}
                            className="cs-reaction-picker"
                          >
                            {EMOJI_LIST.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReactionClick(emoji)}
                                className="cs-reaction-picker-emoji"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="cs-reaction-summary-wrap">
                        <ReactionSummary
                          ref={summaryRef}
                          reactions={reactions}
                          userReaction={userReaction}
                          onOpenModal={() =>
                            setIsReactionModalOpen((current) => !current)
                          }
                          onReactionClick={handleReactionClick}
                        />
                        {isReactionModalOpen && (
                          <ReactionDetailsPopover
                            ref={popoverRef}
                            reactions={reactions}
                            onReactionClick={(emoji: string) => {
                              handleReactionClick(emoji);
                              setIsReactionModalOpen(false);
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setReplyState((current) =>
                          current === "replyingTop" ? "hidden" : "replyingTop"
                        )
                      }
                      className="cs-link cs-link-small cs-comment-reply-btn"
                    >
                      Reply
                    </button>

                    <div className="cs-comment-menu-wrap">
                      <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="cs-icon-btn"
                        aria-label="Open menu"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div
                          className="cs-comment-menu"
                          onMouseLeave={() => setIsMenuOpen(false)}
                        >
                          <div>
                            {isMyComment && (
                              <button
                                onClick={() => {
                                  setEditText(comment.text);
                                  setIsEditing(true);
                                  setIsMenuOpen(false);
                                }}
                                className="cs-menu-item"
                              >
                                Edit
                              </button>
                            )}
                            {(isMyComment || isAdmin) && (
                              <button
                                onClick={() => {
                                  setIsDeleteModalOpen(true);
                                  setIsMenuOpen(false);
                                }}
                                className="cs-menu-item cs-menu-item--danger"
                              >
                                Delete
                              </button>
                            )}
                            {!isMyComment && (
                              <button
                                onClick={() => {
                                  onReport("Comment reported!");
                                  setIsMenuOpen(false);
                                }}
                                className="cs-menu-item"
                              >
                                Report
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isReply &&
                    comment.replies &&
                    comment.replies.length > 0 && (
                      <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="cs-link cs-link-small cs-comment-toggle-replies"
                      >
                        <CornerDownRight size={14} className="cs-icon-inline" />
                        {showReplies ? "Hide" : "Show"}{" "}
                        {comment.replies.length}{" "}
                        {comment.replies.length === 1
                          ? "response"
                          : "responses"}
                      </button>
                    )}
                </div>
              </>
            )}
          </div>
        </div>

        {replyState === "replyingTop" && (
          <div className="cs-comment-reply-form-top">
            <CommentForm
              ref={replyInputRef}
              onSubmit={handleAddReply}
              placeholder="Reply..."
              initialText={`@${comment.username} `}
            />
          </div>
        )}

        {!isReply && comment.replies && comment.replies.length > 0 && (
          <>
            {showReplies && (
              <div className="cs-comment-replies">
                <div className="cs-comment-replies-list">
                  {[...comment.replies]
                    .sort((a, b) => a.date - b.date)
                    .map((reply) => (
                      <Comment
                        key={reply.id}
                        comment={reply}
                        onAddReply={(text: string) => onAddReply(text)}
                        isReply={true}
                        rating={reply.rating}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReport={onReport}
                      />
                    ))}
                </div>

                <button
                  onClick={() =>
                    setReplyState((current) =>
                      current === "replyingBottom" ? "hidden" : "replyingBottom"
                    )
                  }
                  className="cs-link cs-link-small cs-comment-reply-bottom-btn"
                >
                  Reply
                </button>

                {replyState === "replyingBottom" && (
                  <div className="cs-comment-reply-form-bottom">
                    <CommentForm
                      ref={replyInputRef}
                      onSubmit={handleAddReply}
                      placeholder="Reply..."
                      initialText={`@${comment.username} `}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
      />
    </>
  );
}

/* ----------------- Stars ----------------- */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="cs-star-rating">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        if (rating >= starValue) {
          return (
            <IconStarSharp
              key={index}
              size={16}
              fill="currentColor"
              className="cs-star cs-star--full"
            />
          );
        } else if (rating >= starValue - 0.5) {
          return (
            <IconStarHalfSharp
              key={index}
              size={16}
              fill="currentColor"
              className="cs-star cs-star--half"
            />
          );
        } else {
          return (
            <IconStarSharp
              key={index}
              size={16}
              className="cs-star cs-star--empty"
            />
          );
        }
      })}
    </div>
  );
}

function StarInput({ rating, setRating }: any) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index: number) => {
    const newRating = index + 1;
    if (newRating === rating && !Number.isInteger(rating)) {
      setRating(newRating);
    } else if (newRating === rating) {
      setRating(newRating - 0.5);
    } else {
      setRating(newRating);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="cs-star-input">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        let starIcon;

        if (displayRating >= starValue) {
          starIcon = (
            <IconStarSharp
              key={index}
              size={32}
              fill="currentColor"
              className="cs-star cs-star--full"
            />
          );
        } else if (displayRating >= starValue - 0.5) {
          starIcon = (
            <IconStarHalfSharp
              key={index}
              size={32}
              fill="currentColor"
              className="cs-star cs-star--half"
            />
          );
        } else {
          starIcon = (
            <IconStarSharp
              key={index}
              size={32}
              className="cs-star cs-star--empty"
            />
          );
        }

        return (
          <button
            type="button"
            key={`btn_${index}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            className="cs-star-input-btn"
          >
            {starIcon}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------- Review modal + toast ----------------- */

export function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialReview,
}: any) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating);
      setText(initialReview.text);
    } else {
      setRating(0);
      setText("");
    }
  }, [initialReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      console.warn("Please select a rating.");
      return;
    }
    onSubmit({ rating, text });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <div className="cs-modal-backdrop">
      <div className="cs-modal cs-modal--review">
        <button
          onClick={onClose}
          className="cs-modal-close-btn"
          aria-label="Close review modal"
        >
          <X size={20} />
        </button>
        <h2 className="cs-modal-title">
          {initialReview ? "Edit Your Review" : "Add a Review"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="cs-modal-section">
            <label className="cs-modal-label">Your Rating</label>
            <StarInput rating={rating} setRating={setRating} />
          </div>
          <div className="cs-modal-section">
            <label htmlFor="review-text" className="cs-modal-label">
              Your Review (Optional)
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="cs-modal-textarea comment-input-scrollbar"
              rows={5}
              placeholder="What did you think?"
            />
          </div>
          <div className="cs-modal-footer">
            <div className="cs-modal-left">
              {initialReview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="cs-link cs-link-danger"
                >
                  Delete Review
                </button>
              )}
            </div>
            <button type="submit" className="cs-btn cs-btn-success">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Toast({ message, isVisible }: any) {
  const cls = [
    "cs-toast",
    isVisible ? "cs-toast--visible" : "cs-toast--hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={cls}>{message}</div>;
}

/* ----------------- Main sidebar component ----------------- */

export default function CommentSidebar({
  isOpen,
  onToggle,
  comments,
  reviews,
  onAddComment,
  requestedView,
  onAddReply,
  onAddReviewReply,
  onOpenReviewModal,
  hasUserReviewed,
  filterSort,
  onFilterChange,
  onEditComment,
  onEditReview,
  onDeleteComment,
  onDeleteReview,
  isLoading,
  onReport,
  toastMessage,
  isToastVisible,
}: any) {
  const [activeView, setActiveView] = useState<"comments" | "reviews">("comments");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const mainCommentInputRef = useRef<HTMLTextAreaElement | null>(null);

  // ---- Resizable / expandable panel ----
  const DEFAULT_W = 384;   // your current max-width
  const EXPANDED_W = 520;  // "expanded" target
  const MIN_W = 320;
  const MAX_W = 620;

  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_W);
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startWidth: number;
    pointerId: number | null;
  }>({ dragging: false, startX: 0, startWidth: DEFAULT_W, pointerId: null });

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  useEffect(() => {
    if (requestedView === "comments" || requestedView === "reviews") {
      setActiveView(requestedView);
      onFilterChange("newest");
      setIsFilterOpen(false);
    }
  }, [requestedView]);

  // Optional: when you close the sidebar, stop any dragging and keep width as-is
  useEffect(() => {
    if (!isOpen) {
      dragRef.current.dragging = false;
      dragRef.current.pointerId = null;
    }
  }, [isOpen]);

  const handleTabChange = (view: "comments" | "reviews") => {
    setActiveView(view);
    onFilterChange("newest");
    setIsFilterOpen(false);
  };

  const handleFilterSelect = (filterValue: string) => {
    onFilterChange(filterValue);
    setIsFilterOpen(false);
  };

  const commentFilters = [
    { value: "newest", label: "Newest", color: "#ef5623" },
    { value: "oldest", label: "Oldest", color: "#e41f6c" },
    { value: "mostLiked", label: "Most Liked", color: "#6a1b9a" },
    { value: "mostReplies", label: "Most Replies", color: "#1e88e5" },
  ];

  const reviewFilters = [
    { value: "newest", label: "Newest", color: "#ef5623" },
    { value: "oldest", label: "Oldest", color: "#e41f6c" },
    { value: "mostLiked", label: "Most Liked", color: "#6a1b9a" },
    { value: "highestRating", label: "Highest Rating", color: "#1e88e5" },
    { value: "lowestRating", label: "Lowest Rating", color: "#ffa000" },
  ];

  const activeFilters = activeView === "comments" ? commentFilters : reviewFilters;

  const sidebarPanelClass = [
    "cs-sidebar-panel",
    isOpen ? "cs-sidebar-panel--open" : "cs-sidebar-panel--closed",
  ]
    .filter(Boolean)
    .join(" ");

  const commentsTabClass = [
    "cs-tab",
    activeView === "comments" ? "cs-tab--active cs-tab--comments" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const reviewsTabClass = [
    "cs-tab",
    activeView === "reviews" ? "cs-tab--active cs-tab--reviews" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ---- Drag handlers (resize expands LEFT because right side is fixed) ----
  const onResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) return;

    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startWidth = panelWidth;
    dragRef.current.pointerId = e.pointerId;

    document.body.classList.add("cs-resizing");
  };

  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    if (dragRef.current.pointerId !== e.pointerId) return;

    // Dragging LEFT should INCREASE width.
    // When clientX decreases vs startX, delta becomes positive.
    const delta = dragRef.current.startX - e.clientX;
    const next = clamp(dragRef.current.startWidth + delta, MIN_W, MAX_W);
    setPanelWidth(next);
  };

  const stopResizing = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;

    dragRef.current.dragging = false;
    dragRef.current.pointerId = null;
    document.body.classList.remove("cs-resizing");

    try {
      const el = e.currentTarget as HTMLElement;
      el.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const toggleExpanded = () => {
    setPanelWidth((w) => (w < (DEFAULT_W + EXPANDED_W) / 2 ? EXPANDED_W : DEFAULT_W));
  };

  return (
    <div className="cs-sidebar-root">
      {/* Toggle button sitting outside the panel */}
      <button
        onClick={onToggle}
        className="cs-sidebar-toggle"
        aria-label={isOpen ? "Close comments" : "Open comments"}
      >
        <MessageSquare size={24} />
      </button>

      <div
        className={sidebarPanelClass}
        style={{
          width: `${panelWidth}px`,
          maxWidth: "none",
        }}
      >
        {/* RESIZE HANDLE (drag me) */}
        <div
          className="cs-sidebar-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize comments panel"
          title="Drag to resize"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isOpen) return;
            toggleExpanded();
          }}
        />

        {/* Header: tabs + filter + close button */}
        <div className="cs-sidebar-header">
          <div className="cs-sidebar-tabs">
            <button onClick={() => handleTabChange("comments")} className={commentsTabClass}>
              Comments
            </button>
            <button onClick={() => handleTabChange("reviews")} className={reviewsTabClass}>
              Reviews
            </button>

            <div className="cs-filter-wrap">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="cs-icon-btn"
                aria-label="Open filter menu"
              >
                <BarChart size={18} />
              </button>

              {isFilterOpen && (
                <div className="cs-filter-menu" onMouseLeave={() => setIsFilterOpen(false)}>
                  <div>
                    {activeFilters.map((filter) => {
                      const isActive = filterSort === filter.value;
                      const itemClass = [
                        "cs-filter-item",
                        isActive ? "cs-filter-item--active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <button
                          key={filter.value}
                          onClick={() => handleFilterSelect(filter.value)}
                          className={itemClass}
                          style={isActive ? { backgroundColor: filter.color } : undefined}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="cs-sidebar-header-right">
            {/* Expand/collapse width button (optional but useful) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="cs-icon-btn"
              aria-label="Expand panel"
              title="Expand / collapse"
            >
              {/* tiny visual; no extra imports */}
              <span style={{ fontSize: 16, lineHeight: 1 }}>↔︎</span>
            </button>

            <button onClick={onToggle} className="cs-icon-btn" aria-label="Close comments">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="cs-sidebar-content comment-list-scrollbar">
          {isLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : activeView === "comments" ? (
            <>
              {comments && comments.length > 0 ? (
                comments.map((comment: any) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onAddReply={(text: string) => onAddReply(comment.id, text)}
                    onEdit={onEditComment}
                    onDelete={onDeleteComment}
                    onReport={onReport}
                  />
                ))
              ) : (
                <p className="cs-sidebar-empty">No comments yet. Be the first!</p>
              )}
            </>
          ) : (
            <>
              {reviews && reviews.length > 0 ? (
                reviews.map((review: any) => (
                  <Comment
                    key={review.id}
                    comment={review}
                    onAddReply={(text: string) => onAddReviewReply(review.id, text)}
                    rating={review.rating}
                    onEdit={onEditReview}
                    onDelete={onDeleteReview}
                    onReport={onReport}
                  />
                ))
              ) : (
                <p className="cs-sidebar-empty">No reviews yet.</p>
              )}
            </>
          )}
        </div>

        {/* Footer: comment form or review button */}
        {activeView === "comments" && (
          <div className="cs-sidebar-footer">
            <CommentForm ref={mainCommentInputRef} onSubmit={onAddComment} placeholder="Add a comment..." />
          </div>
        )}

        {activeView === "reviews" && (
          <div className="cs-sidebar-footer cs-sidebar-footer--reviews">
            <button
              onClick={onOpenReviewModal}
              className={
                hasUserReviewed
                  ? "cs-btn cs-btn-full cs-btn-review-edit"
                  : "cs-btn cs-btn-full cs-btn-review-new"
              }
            >
              {hasUserReviewed ? "Edit Your Review" : "Add Review"}
            </button>
          </div>
        )}

        <Toast message={toastMessage} isVisible={isToastVisible} />
      </div>
    </div>
  );
}
