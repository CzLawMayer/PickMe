import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  FormEvent,
  MouseEvent,
} from "react";
import {
  BookOpen,
  Send,
  Plus,
  ArrowLeft,
  User,
  Hash,
  MessageCircle,
  MessageSquare,
  Search,
  Filter,
  Star,
  SmilePlus,
  CheckSquare,
  X,
  Heart,
  PenSquare,
  Clock,
  TrendingUp,
  MessageSquarePlus,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import "./Forum.css";

// --- Mock Data ---
const MOCK_USER_ID = "localUser123";

// Start with an EMPTY messages map
const MOCK_MESSAGES: Record<string, any[]> = {};

// Start with an EMPTY topics list
const MOCK_TOPICS: any[] = [];

// --- NEW MOCK DATA for Writing Corner ---
const MOCK_POEMS: any[] = [];
const MOCK_PHILOSOPHY: any[] = [];
const MOCK_STORIES: any[] = [];

// --- Reaction Helpers ---
const reactionEmojis = ["👍", "❤️", "😂", "📖"];

// --- Avatar Component ---
type AvatarProps = {
  userId: string;
  onViewProfile?: (userId: string) => void;
};

function Avatar({ userId, onViewProfile }: AvatarProps) {
  const colors = [
    "#ef6c00", // Orange
    "#d81b60", // Pink
    "#6a1b9a", // Purple
    "#1e88e5", // Blue
    "#00897b", // Teal
    "#fbc02d", // Yellow
  ];

  const charCodeSum = (userId || "default")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];
  const initial = userId ? userId[0].toUpperCase() : "?";

  const avatarCore = (
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

  if (!onViewProfile) return avatarCore;

  return (
    <button
      className="forum-avatar-button"
      type="button"
      onClick={() => onViewProfile(userId)}
    >
      {avatarCore}
    </button>
  );
}

// --- Main App Component ---
export default function ForumPage() {
  const [userId] = useState(MOCK_USER_ID);

  // --- Lifted State ---
  const [topics, setTopics] = useState(MOCK_TOPICS);
  const [poems, setPoems] = useState(MOCK_POEMS);
  const [philosophy, setPhilosophy] = useState(MOCK_PHILOSOPHY);
  const [stories, setStories] = useState(MOCK_STORIES);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // --- State for Sidebar Navigation ---
  const [currentView, setCurrentView] = useState<
    "Forum" | "BookClub" | "WritingCorner" | "Chat"
  >("Forum");
  const [currentChannel, setCurrentChannel] = useState("Fantasy");

  // List of available channels/categories
  const channels = [
    "Adventure",
    "Anthology",
    "Balls",
    "Big Juicy Balls",
    "Biography",
    "Bruh",
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
    "Music",
    "Mystery",
    "New Adult",
    "Non-Fiction",
    "Paranormal",
    "Philosophy",
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

  const handleViewProfile = (id: string) => {
    setViewingProfileId(id);
  };

  const handleSelectTopic = (topicId: string | null) => {
    setSelectedTopicId(topicId);
    setCurrentView("Forum");
    setViewingProfileId(null);
  };

  // Find the full topic object from the ID
  const selectedTopic = useMemo(
    () => topics.find((t: any) => t.id === selectedTopicId),
    [selectedTopicId, topics]
  );

  return (
    <div className="forum-page">
      {/* Global header */}
      <AppHeader />

        <div className="forum-root">
        {/* Sidebar */}
        <Sidebar
            userId={userId}
            channels={channels}
            currentChannel={currentChannel}
            setCurrentChannel={setCurrentChannel}
            currentView={currentView}
            setCurrentView={setCurrentView}
            onViewProfile={handleViewProfile}
        />

        {/* Content Area */}
        <main className="forum-main">
            {currentView === "Forum" && (
            <Forum
                userId={userId}
                categories={channels}
                topics={topics}
                setTopics={setTopics}
                selectedTopic={selectedTopic}
                onSelectTopic={handleSelectTopic}
                onViewProfile={handleViewProfile}
            />
            )}
            {currentView === "BookClub" && (
            <BookClub userId={userId} onViewProfile={handleViewProfile} />
            )}
            {currentView === "WritingCorner" && (
            <WritingCorner
                userId={userId}
                poems={poems}
                setPoems={setPoems}
                philosophy={philosophy}
                setPhilosophy={setPhilosophy}
                stories={stories}
                setStories={setStories}
                onViewProfile={handleViewProfile}
            />
            )}
            {currentView === "Chat" && (
            <Chatroom
                userId={userId}
                currentChannel={currentChannel}
                onViewProfile={handleViewProfile}
            />
            )}
        </main>

        {/* --- User Profile Modal --- */}
        {viewingProfileId && (
            <UserProfileModal
            userId={viewingProfileId}
            allTopics={topics}
            allPoems={poems}
            allPhilosophy={philosophy}
            allStories={stories}
            onClose={() => setViewingProfileId(null)}
            onSelectTopic={handleSelectTopic}
            />
        )}
        </div>
    </div>
  );
}

// --- Sidebar Component ---
type SidebarProps = {
  userId: string;
  channels: string[];
  currentChannel: string;
  setCurrentChannel: (ch: string) => void;
  currentView: "Forum" | "BookClub" | "WritingCorner" | "Chat";
  setCurrentView: (v: "Forum" | "BookClub" | "WritingCorner" | "Chat") => void;
  onViewProfile: (id: string) => void;
};

function Sidebar({
  userId,
  channels,
  currentChannel,
  setCurrentChannel,
  currentView,
  setCurrentView,
  onViewProfile,
}: SidebarProps) {
  return (
    <nav className="forum-sidebar">
      {/* User Info */}
      <div className="forum-sidebar-userblock">
        <div className="forum-sidebar-userrow">
          <div>
            <Avatar userId={userId} onViewProfile={onViewProfile} />
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

      {/* View Toggles */}
      <div>
        <div className="forum-sidebar-view-label">View</div>

      <button
        type="button"
        onClick={() => setCurrentView("Forum")}
        className={[
          "forum-sidebar-view-btn",
          "forum-sidebar-view-btn-forum",                     // theme identifier
          currentView === "Forum" ? "is-active-view" : "",    // NOT the colored class
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

      <button
        type="button"
        onClick={() => setCurrentView("WritingCorner")}
        className={[
          "forum-sidebar-view-btn",
          "forum-sidebar-view-btn-writing",
          currentView === "WritingCorner" ? "is-active-view" : "",
        ].join(" ")}
      >
        <PenSquare size={20} />
        <span>Writing Corner</span>
      </button>

      <button
        type="button"
        onClick={() => setCurrentView("Chat")}
        className={[
          "forum-sidebar-view-btn",
          "forum-sidebar-view-btn-chat",
          currentView === "Chat" ? "is-active-view" : "",
        ].join(" ")}
      >
        <MessageSquare size={20} />
        <span>Chat</span>
      </button>


      </div>

      {/* Channels (for Chat) */}
      {currentView === "Chat" && (
        <div className="forum-sidebar-channels custom-scrollbar">
          <div className="forum-sidebar-channels-title">Chat Channels</div>
          {channels.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => setCurrentChannel(channel)}
              className={[
                "forum-sidebar-channel-btn",
                currentChannel === channel
                  ? "forum-sidebar-channel-btn-active"
                  : "",
              ].join(" ")}
            >
              <Hash size={16} />
              <span>{channel}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// --- Local Reaction Logic ---
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

// --- ReactionBar Component ---
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

// --- Chatroom Component ---
type ChatroomProps = {
  userId: string;
  currentChannel: string;
  onViewProfile: (id: string) => void;
};

function Chatroom({ userId, currentChannel, onViewProfile }: ChatroomProps) {
  const [messages, setMessages] =
    useState<Record<string, any[]>>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentMessages = messages[currentChannel] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !newMessage.trim()) return;

    const newMessageObj = {
      id: Date.now(),
      text: newMessage.trim(),
      userId,
      timestamp: new Date(),
      channel: currentChannel,
      reactions: {} as Record<string, string[]>,
    };

    setMessages((prev) => ({
      ...prev,
      [currentChannel]: [...(prev[currentChannel] || []), newMessageObj],
    }));
    setNewMessage("");
  };

  const handleReact = (messageId: number, emoji: string) => {
    setMessages((prev) => {
      const channelMessages = prev[currentChannel] || [];
      const newChannelMessages = channelMessages.map((msg) => {
        if (msg.id === messageId) {
          const newReactions = toggleReaction(
            msg.reactions || {},
            emoji,
            userId
          );
          return { ...msg, reactions: newReactions };
        }
        return msg;
      });
      return {
        ...prev,
        [currentChannel]: newChannelMessages,
      };
    });
  };

  return (
    <div className="chatroom-root">
      <header className="forum-header">
        <div className="forum-header-title">
          <Hash size={24} color="#1e88e5" />
          <span>{currentChannel} - Chat</span>
        </div>
      </header>

      <div className="forum-body-scroll custom-scrollbar">
        <div className="chat-message-list">
          {currentMessages.map((msg) => (
            <div key={msg.id} className="chat-message-card">
              <Avatar userId={msg.userId} onViewProfile={onViewProfile} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="chat-message-meta">
                  <span className="chat-message-username">{msg.userId}</span>
                  <span className="chat-message-timestamp">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="chat-message-text">{msg.text}</p>
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
          <Avatar userId={userId} onViewProfile={onViewProfile} />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${currentChannel}...`}
            className="forum-input"
          />
          <button
            type="submit"
            className="forum-btn forum-btn-blue"
            disabled={!newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

// --- BookClub Component ---
type BookClubProps = {
  userId: string;
  onViewProfile: (id: string) => void;
};

function BookClub({ userId, onViewProfile }: BookClubProps) {
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !newMessage.trim()) return;

    const newMessageObj = {
      id: Date.now(),
      text: newMessage.trim(),
      userId,
      timestamp: new Date(),
      reactions: {} as Record<string, string[]>,
    };
    setMessages((prev) => [...prev, newMessageObj]);
    setNewMessage("");
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

  return (
    <div className="bookclub-root">
      <header className="forum-header">
        <div className="forum-header-title">
          <Star size={24} color="#d81b60" />
          <span>Book of the Month Club</span>
        </div>
      </header>

      <div className="bookclub-layout">
        {/* Left - book info */}
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

        {/* Right - discussion */}
        <div className="bookclub-discussion">
          <h4 className="bookclub-discussion-title">Discussion</h4>
          <div className="forum-body-scroll custom-scrollbar">
            <div className="chat-message-list">
              {messages.map((msg) => (
                <div key={msg.id} className="chat-message-card">
                  <Avatar userId={msg.userId} onViewProfile={onViewProfile} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="chat-message-meta">
                      <span className="chat-message-username">
                        {msg.userId}
                      </span>
                      <span className="chat-message-timestamp">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="chat-message-text">{msg.text}</p>
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
              <Avatar userId={userId} onViewProfile={onViewProfile} />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Discuss the book..."
                className="forum-input"
              />
              <button
                type="submit"
                className="forum-btn forum-btn-pink"
                disabled={!newMessage.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- WritingCorner Component ---
type WritingCornerProps = {
  userId: string;
  poems: any[];
  setPoems: React.Dispatch<React.SetStateAction<any[]>>;
  philosophy: any[];
  setPhilosophy: React.Dispatch<React.SetStateAction<any[]>>;
  stories: any[];
  setStories: React.Dispatch<React.SetStateAction<any[]>>;
  onViewProfile: (id: string) => void;
};

function WritingCorner({
  userId,
  poems,
  setPoems,
  philosophy,
  setPhilosophy,
  stories,
  setStories,
  onViewProfile,
}: WritingCornerProps) {
  const [subView, setSubView] = useState<"Poems" | "Philosophy" | "Short Stories">(
    "Poems"
  );
  const [newPost, setNewPost] = useState("");
  const postsEndRef = useRef<HTMLDivElement | null>(null);

  const PROMPTS: Record<string, string> = {
    Poems: "This month's prompt: Write a poem about a forgotten bookmark.",
    Philosophy: "This month's question: What makes a character 'good' or 'evil'?",
    "Short Stories":
      "This month's prompt: Start a story with the line: 'The book was heavier than it looked.'",
  };

  const PLACEHOLDERS: Record<string, string> = {
    Poems: "Write your poem...",
    Philosophy: "Share your thoughts...",
    "Short Stories": "Write your short story...",
  };

  const charLimit = subView === "Short Stories" ? 1000 : 200;
  const charsRemaining = charLimit - newPost.length;

  const { currentPosts, setPosts } = useMemo(() => {
    if (subView === "Poems") {
      return { currentPosts: poems, setPosts: setPoems };
    }
    if (subView === "Philosophy") {
      return { currentPosts: philosophy, setPosts: setPhilosophy };
    }
    if (subView === "Short Stories") {
      return { currentPosts: stories, setPosts: setStories };
    }
    return { currentPosts: poems, setPosts: setPoems };
  }, [subView, poems, setPoems, philosophy, setPhilosophy, stories, setStories]);

  const handlePost = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !newPost.trim()) return;

    const newPostObj = {
      id: Date.now(),
      text: newPost.trim(),
      userId,
      timestamp: new Date(),
      reactions: {} as Record<string, string[]>,
    };
    setPosts((prev: any[]) => [...prev, newPostObj]);
    setNewPost("");
  };

  const handleReact = (postId: number, emoji: string) => {
    setPosts((prevPosts: any[]) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const newReactions = toggleReaction(
            post.reactions || {},
            emoji,
            userId
          );
          return { ...post, reactions: newReactions };
        }
        return post;
      })
    );
  };

  return (
    <div className="writing-root">
      <header className="forum-header">
        <div className="writing-header-row">
          <div className="forum-header-title">
            <PenSquare size={24} color="#6a1b9a" />
            <span>Writing Corner</span>
          </div>
          <div className="writing-mode-toggle-group">
            <button
              type="button"
              className={
                "writing-mode-btn" +
                (subView === "Poems" ? " writing-mode-btn-active" : "")
              }
              onClick={() => setSubView("Poems")}
            >
              Poems
            </button>
            <button
              type="button"
              className={
                "writing-mode-btn" +
                (subView === "Philosophy" ? " writing-mode-btn-active" : "")
              }
              onClick={() => setSubView("Philosophy")}
            >
              Philosophy
            </button>
            <button
              type="button"
              className={
                "writing-mode-btn" +
                (subView === "Short Stories"
                  ? " writing-mode-btn-active"
                  : "")
              }
              onClick={() => setSubView("Short Stories")}
            >
              Short Stories
            </button>
          </div>
        </div>
      </header>

      <div className="forum-body-scroll custom-scrollbar">
        <div className="writing-prompt-block">
          <div className="writing-prompt-title">
            {subView === "Philosophy"
              ? "This Month's Question"
              : "This Month's Prompt"}
          </div>
          <p className="writing-prompt-text">{PROMPTS[subView]}</p>
        </div>

        <div className="stack-vertical-4">
          {currentPosts.map((post: any) => (
            <div
              key={post.id}
              className={
                "writing-post-card" +
                (subView === "Short Stories" ? " writing-post-card-wide" : "")
              }
            >
              <div style={{ display: "flex", columnGap: "1rem" }}>
                <Avatar userId={post.userId} onViewProfile={onViewProfile} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="chat-message-meta">
                    <span className="chat-message-username">
                      {post.userId}
                    </span>
                    <span className="chat-message-timestamp">
                      {post.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p
                    style={{
                      marginTop: "0.5rem",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      fontStyle: "italic",
                      fontSize: "0.875rem",
                      color: "#e5e7eb",
                    }}
                  >
                    {post.text}
                  </p>
                  <ReactionBar
                    reactions={post.reactions || {}}
                    userId={userId}
                    onReact={(emoji) => handleReact(post.id, emoji)}
                  />
                </div>
              </div>
            </div>
          ))}
          <div ref={postsEndRef} />
        </div>
      </div>

      <form className="chat-input-bar" onSubmit={handlePost}>
        <div className="chat-input-inner" style={{ alignItems: "flex-start" }}>
          <Avatar userId={userId} onViewProfile={onViewProfile} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={PLACEHOLDERS[subView]}
              className="forum-textarea"
              rows={4}
              maxLength={charLimit}
            />
            <div className="writing-input-footer">
              <span
                className="writing-chars-remaining"
                style={{
                  color:
                    charsRemaining < charLimit * 0.1 ? "#ef4444" : "#6b7280",
                }}
              >
                {charsRemaining} characters remaining
              </span>
              <button
                type="submit"
                className="forum-btn forum-btn-purple"
                disabled={!newPost.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// --- Poll Creation Component ---
type PollCreatorProps = {
  pollQuestion: string;
  setPollQuestion: (q: string) => void;
  pollOptions: string[];
  setPollOptions: (opts: string[]) => void;
};

function PollCreator({
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
}: PollCreatorProps) {
  const addOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
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
  };

  return (
    <div className="poll-creator">
      <input
        type="text"
        value={pollQuestion}
        onChange={(e) => setPollQuestion(e.target.value)}
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
    </div>
  );
}

// --- Poll Display Component ---
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

          const isDisabled = !!userVote && !isUserVote;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleVote(option)}
              className={[
                "poll-choice-btn",
                isUserVote ? "poll-choice-active" : "",
                isDisabled ? "poll-choice-disabled" : "",
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

// --- Forum Component ---
type ForumProps = {
  userId: string;
  categories: string[];
  topics: any[];
  setTopics: React.Dispatch<React.SetStateAction<any[]>>;
  selectedTopic: any | undefined;
  onSelectTopic: (id: string | null) => void;
  onViewProfile: (id: string) => void;
};

function Forum({
  userId,
  categories,
  topics,
  setTopics,
  selectedTopic,
  onSelectTopic,
  onViewProfile,
}: ForumProps) {
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [currentCategory, setCurrentCategory] = useState<string>("All");
  const [newTopicCategory, setNewTopicCategory] = useState<string>(
    categories[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<"Newest" | "Most Comments" | "Most Reactions">(
    "Newest"
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | globalThis.MouseEvent) {
      if (
        filterMenuRef.current &&
        !(filterMenuRef.current as any).contains(e.target)
      ) {
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

  const handleCreateTopic = (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !newTopicTitle.trim() || !newTopicContent.trim()) return;

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
    };

    if (
      showPollCreator &&
      pollQuestion.trim() &&
      pollOptions.filter((opt) => opt.trim() !== "").length >= 2
    ) {
      const poll = {
        question: pollQuestion.trim(),
        options: pollOptions
          .filter((opt) => opt.trim() !== "")
          .reduce((acc: Record<string, string[]>, opt) => {
            acc[opt.trim()] = [];
            return acc;
          }, {}),
      };
      newTopic.poll = poll;
    }

    setTopics((prev) => [newTopic, ...prev]);
    setNewTopicTitle("");
    setNewTopicContent("");
    setShowCreateForm(false);
    setNewTopicCategory(categories[0]);
    setShowPollCreator(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
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
        onViewProfile={onViewProfile}
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
              <Search size={18} />
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

              <button
                type="button"
                onClick={() => setShowPollCreator((prev) => !prev)}
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

              {showPollCreator && (
                <PollCreator
                  pollQuestion={pollQuestion}
                  setPollQuestion={setPollQuestion}
                  pollOptions={pollOptions}
                  setPollOptions={setPollOptions}
                />
              )}

              <button
                type="submit"
                className="forum-btn forum-btn-primary"
                disabled={!newTopicTitle.trim() || !newTopicContent.trim()}
              >
                Post Topic
              </button>
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
              <Avatar userId={topic.userId} onViewProfile={onViewProfile} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 className="forum-topic-title">{topic.title}</h3>
                <p className="forum-topic-excerpt">{topic.content}</p>
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

// --- SingleTopicView Component ---
type SingleTopicViewProps = {
  userId: string;
  topic: any;
  onClose: () => void;
  onVote: (optionKey: string) => void;
  onReact: (emoji: string) => void;
  onComment: (text: string) => void;
  onCommentReact: (commentId: string, emoji: string) => void;
  onViewProfile: (id: string) => void;
};

function SingleTopicView({
  userId,
  topic: selectedTopic,
  onClose,
  onVote,
  onReact,
  onComment,
  onCommentReact,
  onViewProfile,
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
          <button
            type="button"
            className="topic-back-btn"
            onClick={onClose}
          >
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
          <div style={{ display: "flex", columnGap: "1rem" }}>
            <Avatar
              userId={selectedTopic.userId}
              onViewProfile={onViewProfile}
            />
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
            <PollDisplay
              poll={selectedTopic.poll}
              userId={userId}
              onVote={onVote}
            />
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
              <Avatar
                userId={comment.userId}
                onViewProfile={onViewProfile}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="chat-message-meta">
                  <span className="chat-message-username">
                    {comment.userId}
                  </span>
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
          <Avatar userId={userId} onViewProfile={onViewProfile} />
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

// --- UserProfileModal Component ---
type UserProfileModalProps = {
  userId: string;
  allTopics: any[];
  allPoems: any[];
  allPhilosophy: any[];
  allStories: any[];
  onClose: () => void;
  onSelectTopic: (id: string | null) => void;
};

function UserProfileModal({
  userId,
  allTopics,
  allPoems,
  allPhilosophy,
  allStories,
  onClose,
  onSelectTopic,
}: UserProfileModalProps) {
  const userTopics = allTopics.filter((t) => t.userId === userId);
  const userPoems = allPoems.filter((p) => p.userId === userId);
  const userPhilosophy = allPhilosophy.filter((p) => p.userId === userId);
  const userStories = allStories.filter((s) => s.userId === userId);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="profile-modal-backdrop" onClick={handleBackdropClick}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="profile-modal-close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="profile-modal-header">
          <Avatar userId={userId} />
          <div>
            <span className="profile-modal-subtitle">Profile</span>
            <h2 className="profile-modal-username">{userId}</h2>
          </div>
        </div>

        <div className="profile-modal-body custom-scrollbar">
          {/* Topics */}
          <div>
            <h3 className="profile-section-title">Topics</h3>
            {userTopics.length > 0 ? (
              <div>
                {userTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    className="profile-topic-btn"
                    onClick={() => onSelectTopic(topic.id)}
                  >
                    <span className="profile-topic-title">{topic.title}</span>
                    <p className="profile-topic-excerpt">{topic.content}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="forum-empty-text">No topics posted yet.</p>
            )}
          </div>

          {/* Poems */}
          <div className="profile-section">
            <h3 className="profile-section-title">Poems</h3>
            {userPoems.length > 0 ? (
              <div>
                {userPoems.map((poem) => (
                  <div key={poem.id} className="profile-prose-card">
                    <p className="profile-prose-text">{poem.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="forum-empty-text">No poems posted yet.</p>
            )}
          </div>

          {/* Philosophy */}
          <div className="profile-section">
            <h3 className="profile-section-title">Philosophy</h3>
            {userPhilosophy.length > 0 ? (
              <div>
                {userPhilosophy.map((entry) => (
                  <div key={entry.id} className="profile-prose-card">
                    <p className="profile-prose-text">{entry.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="forum-empty-text">No philosophy posted yet.</p>
            )}
          </div>

          {/* Short Stories */}
          <div className="profile-section">
            <h3 className="profile-section-title">Short Stories</h3>
            {userStories.length > 0 ? (
              <div>
                {userStories.map((story) => (
                  <div key={story.id} className="profile-prose-card">
                    <p className="profile-prose-text">{story.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="forum-empty-text">No stories posted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
