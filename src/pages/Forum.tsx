import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  FormEvent,
  MouseEvent as ReactMouseEvent,
  ChangeEvent,
} from "react";
import {
  BookOpen,
  Send,
  Plus,
  ArrowLeft,
  Filter,
  Star,
  SmilePlus,
  CheckSquare,
  X,
  Heart,
  Clock,
  TrendingUp,
  MessageSquarePlus,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import "./Forum.css";

/* -------------------------------------------------------
   Mock Data
------------------------------------------------------- */
const MOCK_USER_ID = "localUser123";

// Start with an EMPTY topics list
const MOCK_TOPICS: any[] = [];

/* -------------------------------------------------------
   Reaction Helpers
------------------------------------------------------- */
const reactionEmojis = ["👍", "❤️", "😂", "📖"];

function toggleReaction(
  reactions: Record<string, string[]>,
  emoji: string,
  userId: string
) {
  const usersWhoReacted = reactions[emoji] || [];
  let newUsersWhoReacted: string[];

  if (usersWhoReacted.includes(userId)) {
    newUsersWhoReacted = usersWhoReacted.filter((id) => id !== userId);
  } else {
    newUsersWhoReacted = [...usersWhoReacted, userId];
  }

  const newReactions: Record<string, string[]> = {
    ...reactions,
    [emoji]: newUsersWhoReacted,
  };

  if (newReactions[emoji].length === 0) {
    delete newReactions[emoji];
  }
  return newReactions;
}

/* -------------------------------------------------------
   Avatar Component (profile click removed)
------------------------------------------------------- */
type AvatarProps = {
  userId: string;
};

function Avatar({ userId }: AvatarProps) {
  const colors = [
    "#ef6c00",
    "#d81b60",
    "#6a1b9a",
    "#1e88e5",
    "#00897b",
    "#fbc02d",
  ];

  const charCodeSum = (userId || "default")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];
  const initial = userId ? userId[0].toUpperCase() : "?";

  return (
    <div
      style={{
        backgroundColor: color,
        width: 40,
        height: 40,
        borderRadius: "999px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontWeight: 700,
        boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
    >
      <span>{initial}</span>
    </div>
  );
}

/* -------------------------------------------------------
   ReactionBar Component
------------------------------------------------------- */
type ReactionBarProps = {
  reactions: Record<string, string[]>;
  userId: string;
  onReact: (emoji: string) => void;
};

function ReactionBar({ reactions, userId, onReact }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="reaction-bar">
      {Object.entries(reactions || {})
        .filter(([, users]) => users.length > 0)
        .map(([emoji, users]) => {
          const active = users.includes(userId);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className={
                "reaction-pill" + (active ? " reaction-pill-active" : "")
              }
            >
              <span>{emoji}</span>
              <span>{users.length}</span>
            </button>
          );
        })}

      <button
        type="button"
        className="reaction-picker-toggle"
        onClick={() => setShowPicker((prev) => !prev)}
      >
        <SmilePlus size={16} />
      </button>

      {showPicker && (
        <div className="reaction-picker-panel">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="reaction-picker-emoji"
              onClick={() => {
                onReact(emoji);
                setShowPicker(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Main Page Component (only Forum + BookClub)
------------------------------------------------------- */
export default function ForumPage() {
  const [userId] = useState(MOCK_USER_ID);

  // Lifted State
  const [topics, setTopics] = useState(MOCK_TOPICS);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Sidebar view state (ONLY Forum + BookClub now)
  const [currentView, setCurrentView] = useState<"Forum" | "BookClub">("Forum");

  const handleSelectTopic = (topicId: string | null) => {
    setSelectedTopicId(topicId);
    setCurrentView("Forum");
  };

  const selectedTopic = useMemo(
    () => topics.find((t: any) => t.id === selectedTopicId),
    [selectedTopicId, topics]
  );

  // Categories used by Forum filter dropdown (kept as before)
  const categories = [
    "Adventure",
    "Anthology",
    "Biography",
    "Coming of Age",
    "Contemporary",
    "Crime",
    "Cyberpunk",
    "Detective",
    "Drama",
    "Dystopian",
    "Fantasy",
    "Family Saga",
    "Historical Fiction",
    "Horror",
    "Humor",
    "Literary",
    "Magical Realism",
    "Memoir",
    "Mystery",
    "New Adult",
    "Non-Fiction",
    "Paranormal",
    "Poetry",
    "Post-Apocalyptic",
    "Psychological Thriller",
    "Romance",
    "Science Fiction",
    "Self-Help",
    "Short Stories",
    "Space Opera",
    "Steampunk",
    "Thriller",
    "Time Travel",
    "Urban Fantasy",
    "Young Adult",
  ];

  return (
    <div className="forum-page">
      <AppHeader />

      <div className="forum-root">
        <Sidebar
          userId={userId}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />

        <main className="forum-main">
          {currentView === "Forum" && (
            <Forum
              userId={userId}
              categories={categories}
              topics={topics}
              setTopics={setTopics}
              selectedTopic={selectedTopic}
              onSelectTopic={handleSelectTopic}
            />
          )}

          {currentView === "BookClub" && <BookClub userId={userId} />}
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Sidebar Component (ONLY Forum + BookClub)
------------------------------------------------------- */
type SidebarProps = {
  userId: string;
  currentView: "Forum" | "BookClub";
  setCurrentView: (v: "Forum" | "BookClub") => void;
};

function Sidebar({ userId, currentView, setCurrentView }: SidebarProps) {
  return (
    <nav className="forum-sidebar">
      <div className="forum-sidebar-userblock">
        <div className="forum-sidebar-userrow">
          <div>
            <Avatar userId={userId} />
          </div>
          <div className="forum-sidebar-username">
            <h2>Book Lover</h2>
            <p>@{userId}</p>
          </div>
        </div>
        <div className="forum-sidebar-underline">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="forum-sidebar-divider" />

      <div>
        <div className="forum-sidebar-view-label">View</div>

        <button
          type="button"
          onClick={() => setCurrentView("Forum")}
          className={[
            "forum-sidebar-view-btn",
            "forum-sidebar-view-btn-forum",
            currentView === "Forum" ? "is-active-view" : "",
          ].join(" ")}
        >
          <BookOpen size={20} />
          <span>Forum</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView("BookClub")}
          className={[
            "forum-sidebar-view-btn",
            "forum-sidebar-view-btn-bookclub",
            currentView === "BookClub" ? "is-active-view" : "",
          ].join(" ")}
        >
          <Star size={20} />
          <span>Book Club</span>
        </button>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------
   Poll Creator
------------------------------------------------------- */
type PollCreatorProps = {
  pollQuestion: string;
  setPollQuestion: (q: string) => void;
  pollOptions: string[];
  setPollOptions: (opts: string[]) => void;
  pollError: string;
  setPollError: (v: string) => void;
};

function PollCreator({
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
  pollError,
  setPollError,
}: PollCreatorProps) {
  const addOption = () => {
    if (pollOptions.length < 5) setPollOptions([...pollOptions, ""]);
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
    if (pollError) setPollError("");
  };

  return (
    <div className="poll-creator">
      <input
        type="text"
        value={pollQuestion}
        onChange={(e) => {
          setPollQuestion(e.target.value);
          if (pollError) setPollError("");
        }}
        placeholder="Poll Question"
        className="forum-input"
      />

      <div style={{ marginTop: "0.5rem" }}>
        {pollOptions.map((option, index) => (
          <div key={index} className="poll-option-row">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="forum-input"
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              disabled={pollOptions.length <= 2}
              className="forum-btn"
              style={{
                padding: "0.25rem",
                borderRadius: "0.375rem",
                background: "transparent",
                color: "#9ca3af",
              }}
              title="Remove option"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        disabled={pollOptions.length >= 5}
        className="forum-btn"
        style={{
          marginTop: "0.5rem",
          padding: "0.25rem 0.75rem",
          borderRadius: "0.5rem",
          backgroundColor: "rgba(255,255,255,0.06)",
          color: "#e5e7eb",
          fontSize: "0.75rem",
        }}
      >
        Add Option
      </button>

      {/* ✅ nicer UX error block (no alert) */}
      {pollError && (
        <div
          style={{
            marginTop: "0.6rem",
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.10)",
            color: "#fecaca",
            borderRadius: "0.6rem",
            padding: "0.55rem 0.7rem",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
          role="alert"
        >
          <span style={{ lineHeight: 1.35 }}>{pollError}</span>
          <button
            type="button"
            onClick={() => setPollError("")}
            className="forum-btn"
            style={{
              padding: "0.15rem",
              borderRadius: "0.45rem",
              background: "transparent",
              color: "#fecaca",
              flexShrink: 0,
            }}
            aria-label="Dismiss poll error"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Poll Display
------------------------------------------------------- */
type PollDisplayProps = {
  poll: {
    question: string;
    options: Record<string, string[]>;
  };
  userId: string;
  onVote: (optionKey: string) => void;
};

function PollDisplay({ poll, userId, onVote }: PollDisplayProps) {
  const totalVotes = Object.values(poll.options || {}).reduce(
    (acc, users) => acc + users.length,
    0
  );

  const userVote = Object.keys(poll.options || {}).find((option) =>
    poll.options[option].includes(userId)
  );

  const handleVote = (optionKey: string) => {
    if (userVote) return;
    onVote(optionKey);
  };

  return (
    <div className="poll-display">
      <h4
        style={{
          marginBottom: "0.75rem",
          fontWeight: 600,
          color: "#ffffff",
          fontSize: "0.95rem",
        }}
      >
        {poll.question}
      </h4>

      <div className="stack-vertical-4">
        {Object.entries(poll.options || {}).map(([option, users]) => {
          const voteCount = users.length;
          const percentage =
            totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
          const isUserVote = userVote === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleVote(option)}
              className={[
                "poll-choice-btn",
                isUserVote ? "poll-choice-active" : "",
                userVote && !isUserVote ? "poll-choice-disabled" : "",
              ].join(" ")}
              disabled={!!userVote}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#ffffff",
                }}
              >
                <span>{option}</span>
                <span>{voteCount} votes</span>
              </div>
              <div className="poll-progress-track">
                <div
                  className="poll-progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="poll-percentage-text">{percentage}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   BookClub Component (unchanged behavior, no profile modal)
------------------------------------------------------- */
type BookClubProps = {
  userId: string;
};

function BookClub({ userId }: BookClubProps) {
  const book = {
    title: "Dune",
    author: "Frank Herbert",
    description:
      'The Book of the Month is "Dune"! Grab your copy and join the discussion!',
    imageUrl:
      "https://placehold.co/300x450/111/FFF?text=Book+Cover+Here&font=sans",
  };

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || (!newMessage.trim() && !attachedImage)) return;

    const newMessageObj = {
      id: Date.now(),
      text: newMessage.trim(),
      userId,
      timestamp: new Date(),
      reactions: {} as Record<string, string[]>,
      imageUrl: attachedImage || null,
    };

    setMessages((prev) => [...prev, newMessageObj]);
    setNewMessage("");
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReact = (messageId: number, emoji: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === messageId) {
          const newReactions = toggleReaction(
            msg.reactions || {},
            emoji,
            userId
          );
          return { ...msg, reactions: newReactions };
        }
        return msg;
      })
    );
  };

  const handleImagePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachedImage(url);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const canSend = !!newMessage.trim() || !!attachedImage;

  return (
    <div className="bookclub-root">
      <header className="forum-header">
        <div className="forum-header-title">
          <Star size={24} color="#d81b60" />
          <span>Book of the Month Club</span>
        </div>
      </header>

      <div className="bookclub-layout">
        <div className="bookclub-info-panel">
          <h3 className="bookclub-title">{book.title}</h3>
          <p className="bookclub-author">by {book.author}</p>
          <img
            src={book.imageUrl}
            alt="Book cover"
            className="bookclub-cover"
          />
          <p className="bookclub-desc">{book.description}</p>
        </div>

        <div className="bookclub-discussion">
          <h4 className="bookclub-discussion-title">Discussion</h4>

          <div className="forum-body-scroll custom-scrollbar">
            <div className="chat-message-list">
              {messages.map((msg) => (
                <div key={msg.id} className="chat-message-card">
                  <Avatar userId={msg.userId} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="chat-message-meta">
                      <span className="chat-message-username">{msg.userId}</span>
                      <span className="chat-message-timestamp">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {msg.text && <p className="chat-message-text">{msg.text}</p>}

                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Attachment"
                        className="forum-image-attachment"
                      />
                    )}

                    <ReactionBar
                      reactions={msg.reactions || {}}
                      userId={userId}
                      onReact={(emoji) => handleReact(msg.id, emoji)}
                    />
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form className="chat-input-bar" onSubmit={handleSendMessage}>
            <div className="chat-input-inner">
              <Avatar userId={userId} />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Discuss the book..."
                className="forum-input"
              />

              <button
                type="button"
                className="forum-btn forum-attach-btn"
                onClick={openFilePicker}
              >
                <ImageIcon size={18} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImagePick}
              />

              <button
                type="submit"
                className="forum-btn forum-btn-pink"
                disabled={!canSend}
              >
                <Send size={20} />
              </button>
            </div>

            {attachedImage && (
              <div className="forum-attach-preview forum-attach-preview-compact">
                <div className="forum-attach-thumb">
                  <img src={attachedImage} alt="Preview" />
                </div>

                <div className="forum-attach-meta">
                  <div className="forum-attach-title">Image attached</div>
                  <div className="forum-attach-subtitle">Will send with your message</div>
                </div>

                <button
                  type="button"
                  className="forum-attach-remove"
                  onClick={() => {
                    setAttachedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Remove attached image"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Forum Component (poll UX improved + buttons pinned at bottom)
------------------------------------------------------- */
type ForumProps = {
  userId: string;
  categories: string[];
  topics: any[];
  setTopics: React.Dispatch<React.SetStateAction<any[]>>;
  selectedTopic: any | undefined;
  onSelectTopic: (id: string | null) => void;
};

function Forum({
  userId,
  categories,
  topics,
  setTopics,
  selectedTopic,
  onSelectTopic,
}: ForumProps) {
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollError, setPollError] = useState("");

  const [currentCategory, setCurrentCategory] = useState<string>("All");
  const [newTopicCategory, setNewTopicCategory] = useState<string>(categories[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<
    "Newest" | "Most Comments" | "Most Reactions"
  >("Newest");

  const [newTopicImage, setNewTopicImage] = useState<string | null>(null);
  const newTopicImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: ReactMouseEvent | globalThis.MouseEvent) {
      const target = e.target;
      if (!filterMenuRef.current) return;
      if (target instanceof Node && !filterMenuRef.current.contains(target)) {
        setShowFilterMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside as any);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as any);
    };
  }, []);

  const getTotalReactions = (topic: any) => {
    return Object.values(topic.reactions || {}).reduce(
      (acc: number, users: any) => acc + users.length,
      0
    );
  };

  const filteredAndSortedTopics = useMemo(() => {
    const filtered = topics
      .filter((topic) => {
        if (currentCategory === "All") return true;
        return topic.category === currentCategory;
      })
      .filter(
        (topic) =>
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

    switch (sortBy) {
      case "Most Comments":
        return [...filtered].sort(
          (a, b) => (b.commentCount || 0) - (a.commentCount || 0)
        );
      case "Most Reactions":
        return [...filtered].sort(
          (a, b) => getTotalReactions(b) - getTotalReactions(a)
        );
      case "Newest":
      default:
        return [...filtered].sort(
          (a, b) =>
            (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0)
        );
    }
  }, [topics, currentCategory, searchQuery, sortBy]);

  const handleTopicImagePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNewTopicImage(url);
  };

  const validatePoll = () => {
    if (!showPollCreator) return { ok: true };

    const q = pollQuestion.trim();
    const opts = pollOptions.map((o) => o.trim()).filter(Boolean);

    if (!q) return { ok: false, msg: "Please enter a poll question." };
    if (opts.length < 2)
      return { ok: false, msg: "Please add at least two poll options." };

    // IMPORTANT: options are object keys; duplicates overwrite
    const normalized = opts.map((o) => o.toLowerCase());
    const uniq = new Set(normalized);
    if (uniq.size !== opts.length) {
      return {
        ok: false,
        msg: "Poll options must be unique. Please rename any duplicates.",
      };
    }

    return { ok: true, q, opts };
  };

  const handleCreateTopic = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !newTopicTitle.trim() || !newTopicContent.trim()) return;

    setPollError("");

    const pollCheck = validatePoll();
    if (!pollCheck.ok) {
      setPollError((pollCheck as any).msg || "Invalid poll.");
      return;
    }

    const newTopic: any = {
      id: `t${Date.now()}`,
      title: newTopicTitle.trim(),
      content: newTopicContent.trim(),
      userId,
      category: newTopicCategory,
      commentCount: 0,
      timestamp: new Date(),
      reactions: {},
      comments: [],
      imageUrl: newTopicImage || null,
    };

    if (showPollCreator) {
      const { q, opts } = pollCheck as any;
      newTopic.poll = {
        question: q,
        options: (opts as string[]).reduce(
          (acc: Record<string, string[]>, opt: string) => {
            acc[opt] = [];
            return acc;
          },
          {}
        ),
      };
    }

    setTopics((prev) => [newTopic, ...prev]);

    // reset
    setNewTopicTitle("");
    setNewTopicContent("");
    setShowCreateForm(false);
    setNewTopicCategory(categories[0]);
    setShowPollCreator(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollError("");
    setNewTopicImage(null);
    if (newTopicImageInputRef.current) newTopicImageInputRef.current.value = "";
  };

  const handleAddComment = (newComment: string) => {
    if (!userId || !newComment.trim() || !selectedTopic) return;

    const newCommentObj = {
      id: `c${Date.now()}`,
      text: newComment.trim(),
      userId,
      timestamp: new Date(),
      reactions: {} as Record<string, string[]>,
    };

    const updatedTopic = {
      ...selectedTopic,
      comments: [...selectedTopic.comments, newCommentObj],
      commentCount: (selectedTopic.commentCount || 0) + 1,
    };

    setTopics((prevTopics) =>
      prevTopics.map((t) => (t.id === selectedTopic.id ? updatedTopic : t))
    );
  };

  const handlePollVote = (optionKey: string) => {
    if (!selectedTopic || !selectedTopic.poll) return;

    const userVote = Object.keys(selectedTopic.poll.options).find((option) =>
      selectedTopic.poll.options[option].includes(userId)
    );
    if (userVote) return;

    const newOptions = {
      ...selectedTopic.poll.options,
      [optionKey]: [...selectedTopic.poll.options[optionKey], userId],
    };

    const updatedTopic = {
      ...selectedTopic,
      poll: { ...selectedTopic.poll, options: newOptions },
    };

    setTopics((prevTopics) =>
      prevTopics.map((t) => (t.id === selectedTopic.id ? updatedTopic : t))
    );
  };

  const handleTopicReaction = (emoji: string) => {
    if (!selectedTopic) return;
    const newReactions = toggleReaction(
      selectedTopic.reactions || {},
      emoji,
      userId
    );
    const updatedTopic = { ...selectedTopic, reactions: newReactions };

    setTopics((prevTopics) =>
      prevTopics.map((t) => (t.id === selectedTopic.id ? updatedTopic : t))
    );
  };

  const handleCommentReaction = (commentId: string, emoji: string) => {
    if (!selectedTopic) return;

    const newComments = selectedTopic.comments.map((comment: any) => {
      if (comment.id === commentId) {
        const newReactions = toggleReaction(
          comment.reactions || {},
          emoji,
          userId
        );
        return { ...comment, reactions: newReactions };
      }
      return comment;
    });

    const updatedTopic = { ...selectedTopic, comments: newComments };

    setTopics((prevTopics) =>
      prevTopics.map((t) => (t.id === selectedTopic.id ? updatedTopic : t))
    );
  };

  if (selectedTopic) {
    return (
      <SingleTopicView
        userId={userId}
        topic={selectedTopic}
        onClose={() => onSelectTopic(null)}
        onVote={handlePollVote}
        onReact={handleTopicReaction}
        onComment={handleAddComment}
        onCommentReact={handleCommentReaction}
      />
    );
  }

  return (
    <div className="forum-view-root">
      <header className="forum-header">
        <div className="forum-header-row">
          <div className="forum-filters-row">
            <button
              type="button"
              className={[
                "forum-btn",
                "forum-btn-pill",
                currentCategory === "All" ? "forum-btn-pill-active" : "",
              ].join(" ")}
              onClick={() => {
                setCurrentCategory("All");
                setShowFilterMenu(false);
              }}
            >
              All
            </button>

            <div className="forum-filter-dropdown" ref={filterMenuRef}>
              <button
                type="button"
                className={[
                  "forum-btn",
                  "forum-btn-pill",
                  currentCategory !== "All" ? "forum-btn-pill-active" : "",
                ].join(" ")}
                onClick={() => setShowFilterMenu((prev) => !prev)}
              >
                <Filter size={14} />
                <span>
                  {currentCategory !== "All" ? currentCategory : "Filter"}
                </span>
              </button>

              {showFilterMenu && (
                <div className="forum-filter-menu custom-scrollbar">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setCurrentCategory(category);
                        setShowFilterMenu(false);
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="forum-sort-group">
              <button
                type="button"
                className={[
                  "forum-btn",
                  "forum-btn-pill",
                  sortBy === "Newest" ? "forum-btn-pill-active" : "",
                ].join(" ")}
                onClick={() => setSortBy("Newest")}
              >
                <Clock size={14} />
                <span>Newest</span>
              </button>

              <button
                type="button"
                className={[
                  "forum-btn",
                  "forum-btn-pill",
                  sortBy === "Most Reactions" ? "forum-btn-pill-active" : "",
                ].join(" ")}
                onClick={() => setSortBy("Most Reactions")}
              >
                <TrendingUp size={14} />
                <span>Reactions</span>
              </button>

              <button
                type="button"
                className={[
                  "forum-btn",
                  "forum-btn-pill",
                  sortBy === "Most Comments" ? "forum-btn-pill-active" : "",
                ].join(" ")}
                onClick={() => setSortBy("Most Comments")}
              >
                <MessageSquarePlus size={14} />
                <span>Comments</span>
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              columnGap: "0.5rem",
              width: "100%",
              maxWidth: "28rem",
              marginLeft: "auto",
            }}
          >
            <div className="forum-search-wrapper">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={"forum-input forum-input-search"}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="forum-btn forum-btn-primary"
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <Plus size={18} style={{ marginRight: 6 }} />
                {showCreateForm ? "Cancel" : "New Topic"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="forum-body-scroll custom-scrollbar">
        {showCreateForm && (
          <form
            onSubmit={handleCreateTopic}
            className="forum-panel forum-newtopic-form"
          >
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              Create New Topic
            </h3>

            <div className="stack-vertical-4">
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Topic Title"
                className="forum-input"
              />

              <div>
                <label
                  htmlFor="category-select"
                  style={{
                    display: "block",
                    marginBottom: "0.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#d1d5db",
                  }}
                >
                  Category
                </label>

                <select
                  id="category-select"
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  className="forum-select custom-scrollbar"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={newTopicContent}
                onChange={(e) => setNewTopicContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="forum-textarea"
              />

              <div className="forum-image-attach-row">
                <button
                  type="button"
                  className="forum-btn forum-attach-btn"
                  onClick={() => newTopicImageInputRef.current?.click()}
                >
                  <ImageIcon size={18} />
                  <span>Attach image</span>
                </button>

                <input
                  ref={newTopicImageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleTopicImagePick}
                />
                {newTopicImage && (
                  <div className="forum-attach-preview">
                    <div className="forum-attach-thumb">
                      <img src={newTopicImage} alt="Preview" />
                    </div>

                    <div className="forum-attach-meta">
                      <div className="forum-attach-title">Image attached</div>
                      <div className="forum-attach-subtitle">Ready to post</div>
                    </div>

                    <button
                      type="button"
                      className="forum-attach-remove"
                      onClick={() => {
                        setNewTopicImage(null);
                        if (newTopicImageInputRef.current) newTopicImageInputRef.current.value = "";
                      }}
                      aria-label="Remove attached image"
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* ✅ Poll is rendered ABOVE the buttons so buttons stay pinned to the bottom */}
              {showPollCreator && (
                <PollCreator
                  pollQuestion={pollQuestion}
                  setPollQuestion={setPollQuestion}
                  pollOptions={pollOptions}
                  setPollOptions={setPollOptions}
                  pollError={pollError}
                  setPollError={setPollError}
                />
              )}

              <div className="forum-newtopic-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setShowPollCreator((prev) => {
                      const next = !prev;
                      if (!next) {
                        setPollQuestion("");
                        setPollOptions(["", ""]);
                        setPollError("");
                      }
                      return next;
                    });
                  }}
                  className="forum-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    columnGap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                  }}
                >
                  <CheckSquare size={18} />
                  <span>{showPollCreator ? "Remove Poll" : "Add Poll"}</span>
                </button>

                <button
                  type="submit"
                  className="forum-btn forum-btn-primary"
                  disabled={!newTopicTitle.trim() || !newTopicContent.trim()}
                >
                  Post Topic
                </button>

                {/* ✅ NEW Cancel button */}
                <button
                  type="button"
                  className="forum-btn"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#e5e7eb",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  onClick={() => {
                    // close + reset everything (matches the top-right cancel behavior)
                    setShowCreateForm(false);
                    setNewTopicTitle("");
                    setNewTopicContent("");
                    setNewTopicCategory(categories[0]);

                    setShowPollCreator(false);
                    setPollQuestion("");
                    setPollOptions(["", ""]);
                    setPollError("");

                    setNewTopicImage(null);
                    if (newTopicImageInputRef.current) newTopicImageInputRef.current.value = "";
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="forum-topic-list">
          {filteredAndSortedTopics.map((topic: any) => (
            <div
              key={topic.id}
              className="forum-topic-card"
              onClick={() => onSelectTopic(topic.id)}
            >
              <Avatar userId={topic.userId} />

              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 className="forum-topic-title">{topic.title}</h3>
                <p className="forum-topic-excerpt">{topic.content}</p>

                {topic.imageUrl && (
                  <img
                    src={topic.imageUrl}
                    alt="Topic attachment"
                    className="forum-image-attachment-small"
                  />
                )}

                <span className="forum-topic-meta-small">
                  Posted by{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#e5e7eb",
                      wordBreak: "break-all",
                    }}
                  >
                    {topic.userId}
                  </span>
                  {topic.timestamp?.toLocaleDateString &&
                    ` on ${topic.timestamp.toLocaleDateString()}`}
                </span>
              </div>

              <div className="forum-topic-meta-right">
                <div className="forum-topic-meta-right-group">
                  <MessageCircle size={18} />
                  <span>{topic.commentCount || 0}</span>
                </div>
                <div className="forum-topic-meta-right-group">
                  <Heart size={18} />
                  <span>{getTotalReactions(topic)}</span>
                </div>
              </div>
            </div>
          ))}

          {topics.length === 0 && !showCreateForm && (
            <p className="forum-empty-text">
              No topics in this category yet. Be the first to create one!
            </p>
          )}

          {topics.length > 0 &&
            filteredAndSortedTopics.length === 0 &&
            !showCreateForm && (
              <p className="forum-empty-text">
                No topics found matching your search.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SingleTopicView
------------------------------------------------------- */
type SingleTopicViewProps = {
  userId: string;
  topic: any;
  onClose: () => void;
  onVote: (optionKey: string) => void;
  onReact: (emoji: string) => void;
  onComment: (text: string) => void;
  onCommentReact: (commentId: string, emoji: string) => void;
};

function SingleTopicView({
  userId,
  topic: selectedTopic,
  onClose,
  onVote,
  onReact,
  onComment,
  onCommentReact,
}: SingleTopicViewProps) {
  const [newComment, setNewComment] = useState("");
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTopic.comments]);

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !newComment.trim()) return;
    onComment(newComment);
    setNewComment("");
  };

  if (!selectedTopic) {
    return (
      <div className="topic-view-root">
        <p className="forum-empty-text">Loading topic...</p>
      </div>
    );
  }

  return (
    <div className="topic-view-root">
      <header className="forum-header">
        <div className="topic-header-title-row">
          <button type="button" className="topic-back-btn" onClick={onClose}>
            <ArrowLeft size={20} />
          </button>

          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedTopic.title}
          </h2>
        </div>
      </header>

      <div className="forum-body-scroll custom-scrollbar">
        <div className="forum-panel topic-main-card">
          <div
            style={{
              display: "flex",
              columnGap: "1rem",
              alignItems: "flex-start",
            }}
          >
            <Avatar userId={selectedTopic.userId} />

            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 className="forum-topic-title">{selectedTopic.title}</h3>
              <p
                style={{
                  marginBottom: "0.75rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "0.875rem",
                  color: "#e5e7eb",
                }}
              >
                {selectedTopic.content}
              </p>

              {selectedTopic.imageUrl && (
                <img
                  src={selectedTopic.imageUrl}
                  alt="Attachment"
                  className="forum-image-attachment"
                />
              )}

              <span className="forum-topic-meta-small">
                Posted by{" "}
                <span
                  style={{
                    fontWeight: 500,
                    color: "#e5e7eb",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedTopic.userId}
                </span>
                {selectedTopic.timestamp?.toLocaleDateString &&
                  ` on ${selectedTopic.timestamp.toLocaleDateString()}`}
              </span>
            </div>
          </div>

          {selectedTopic.poll && (
            <PollDisplay poll={selectedTopic.poll} userId={userId} onVote={onVote} />
          )}

          <ReactionBar
            reactions={selectedTopic.reactions || {}}
            userId={userId}
            onReact={onReact}
          />
        </div>

        <h4 className="topic-comments-title">
          Comments ({selectedTopic.comments.length})
        </h4>

        <div className="chat-message-list">
          {selectedTopic.comments.map((comment: any) => (
            <div key={comment.id} className="chat-message-card">
              <Avatar userId={comment.userId} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="chat-message-meta">
                  <span className="chat-message-username">{comment.userId}</span>
                  <span className="chat-message-timestamp">
                    {comment.timestamp?.toLocaleTimeString &&
                      comment.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                <p className="chat-message-text">{comment.text}</p>

                <ReactionBar
                  reactions={comment.reactions || {}}
                  userId={userId}
                  onReact={(emoji) => onCommentReact(comment.id, emoji)}
                />
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>

      <form className="chat-input-bar" onSubmit={handleAddComment}>
        <div className="chat-input-inner">
          <Avatar userId={userId} />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="forum-input"
          />
          <button
            type="submit"
            className="forum-btn forum-btn-primary"
            disabled={!newComment.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}