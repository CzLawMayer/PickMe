// src/components/Trackers.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BookOpen,
  Check,
  Clock,
  Compass,
  FileText,
  Flame,
  Globe,
  Hash,
  Heart,
  Layers,
  Library,
  MessageSquare,
  PenTool,
  Settings2,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import "./Trackers.css";

type Tier = {
  level: number;
  name: string;
  colorClass: string;
  fillClass: string;
};

type CategoryKey = "books" | "chapters" | "pages" | "words" | "minutes" | "hours";

type CategoryConfig = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  unit: string;
};

type Badge = {
  id: number;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  val: number;
  thresholds: number[];
  isOneOff?: boolean;
};

type Timeframe = { id: "daily" | "weekly" | "monthly" | "yearly"; label: string; days: number };

type FixedPos = { top: number; right: number };

export function TrackersInline() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
  const [view, setView] = useState<"progress" | "customize">("progress");

  const tiers: Tier[] = useMemo(
    () => [
      { level: 1, name: "Bronze", colorClass: "tierColor--orange", fillClass: "tierFill--orange" },
      { level: 2, name: "Pink", colorClass: "tierColor--pink", fillClass: "tierFill--pink" },
      { level: 3, name: "Purple", colorClass: "tierColor--purple", fillClass: "tierFill--purple" },
      { level: 4, name: "Blue", colorClass: "tierColor--blue", fillClass: "tierFill--blue" },
      { level: 5, name: "Yellow", colorClass: "tierColor--yellow", fillClass: "tierFill--yellow" },
    ],
    []
  );

  const categories: Record<CategoryKey, CategoryConfig> = useMemo(
    () => ({
      books: { label: "Books", icon: BookOpen, unit: "books" },
      chapters: { label: "Chapters", icon: Layers, unit: "chapters" },
      pages: { label: "Pages", icon: FileText, unit: "pages" },
      words: { label: "Words", icon: Hash, unit: "words" },
      minutes: { label: "Minutes", icon: Clock, unit: "mins" },
      hours: { label: "Hours", icon: Timer, unit: "hrs" },
    }),
    []
  );

  const timeframes: Timeframe[] = useMemo(
    () => [
      { id: "daily", label: "Daily", days: 1 },
      { id: "weekly", label: "Weekly", days: 7 },
      { id: "monthly", label: "Monthly", days: 30 },
      { id: "yearly", label: "Yearly", days: 365 },
    ],
    []
  );

  const [activeCategory, setActiveCategory] = useState<CategoryKey>("books");
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe["id"]>("monthly");
  const [goalValue, setGoalValue] = useState<number>(1);

  // Demo progress (wire real values later)
  const [progress] = useState<Record<CategoryKey, number>>({
    books: 0,
    chapters: 0,
    pages: 0,
    words: 0,
    minutes: 0,
    hours: 0,
  });

  const [badges] = useState<Badge[]>([
    { id: 1, title: "Bibliophile", desc: "Read total books", icon: BookOpen, val: 0, thresholds: [1, 5, 10, 25, 50] },
    { id: 2, title: "Critic", desc: "Rate books read", icon: Star, val: 0, thresholds: [1, 10, 25, 50, 100] },
    { id: 3, title: "Socialite", desc: "Add new friends", icon: UserPlus, val: 0, thresholds: [1, 5, 15, 30, 50] },
    { id: 4, title: "Author", desc: "Write your own books", icon: PenTool, val: 0, thresholds: [1, 2, 5, 10, 20] },
    { id: 5, title: "Engaged", desc: "Leave comments", icon: MessageSquare, val: 0, thresholds: [5, 20, 50, 100, 500] },
    { id: 6, title: "Influencer", desc: "Gain followers", icon: Users, val: 0, thresholds: [5, 25, 100, 500, 1000] },
    { id: 7, title: "Collector", desc: "Books in library", icon: Library, val: 0, thresholds: [10, 50, 100, 250, 500] },
    { id: 8, title: "Elite", desc: "Book of the Month winner", icon: Trophy, val: 0, thresholds: [1], isOneOff: true },
    { id: 9, title: "Speaker", desc: "Forum topics started", icon: Globe, val: 0, thresholds: [1, 5, 10, 25, 50] },
    { id: 10, title: "Polymath", desc: "Read different genres", icon: Compass, val: 0, thresholds: [2, 5, 8, 12, 20] },
    { id: 11, title: "Lexical", desc: "Total words read", icon: Hash, val: 0, thresholds: [10000, 100000, 500000, 1000000, 5000000] },
    { id: 12, title: "Streak", desc: "Longest day streak", icon: Flame, val: 0, thresholds: [3, 7, 14, 30, 365] },
    { id: 13, title: "Trendsetter", desc: "Get likes on reviews", icon: Heart, val: 0, thresholds: [10, 50, 200, 500, 1000] },
    { id: 14, title: "Scholar", desc: "Finish chapters", icon: Layers, val: 0, thresholds: [5, 25, 100, 250, 500] },
    { id: 15, title: "Veteran", desc: "Total hours read", icon: Timer, val: 0, thresholds: [1, 10, 100, 500, 1000] },
  ]);

  const getBadgeLevel = (badge: Badge) => {
    let level = 0;
    badge.thresholds.forEach((t, i) => {
      if (badge.val >= t) level = i + 1;
    });
    if (badge.isOneOff && level > 0) return 5;
    return level;
  };

  const earnedCount = useMemo(
    () => badges.reduce((acc, b) => acc + (getBadgeLevel(b) > 0 ? 1 : 0), 0),
    [badges]
  );

  const currentVal = progress[activeCategory] ?? 0;
  const goalPercent = goalValue > 0 ? Math.min(Math.round((currentVal / goalValue) * 100), 100) : 0;

  const badgeRef = useRef<HTMLDivElement | null>(null);
  const goalRef = useRef<HTMLDivElement | null>(null);

  // Fixed positions for portal panels
  const [badgePos, setBadgePos] = useState<FixedPos | null>(null);
  const [goalPos, setGoalPos] = useState<FixedPos | null>(null);

  const measure = () => {
    const badgeBtn = badgeRef.current?.querySelector("button.trackersIconBtn") as HTMLButtonElement | null;
    const goalBtn = goalRef.current?.querySelector("button.trackersIconBtn") as HTMLButtonElement | null;

    if (badgeBtn) {
      const r = badgeBtn.getBoundingClientRect();
      setBadgePos({
        top: r.bottom + 12,
        right: window.innerWidth - r.right,
      });
    }
    if (goalBtn) {
      const r = goalBtn.getBoundingClientRect();
      setGoalPos({
        top: r.bottom + 12,
        right: window.innerWidth - r.right,
      });
    }
  };

  useEffect(() => {
    // Click outside closes
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;

      // If click is inside either trigger wrapper, do nothing
      if (badgeRef.current && badgeRef.current.contains(t)) return;
      if (goalRef.current && goalRef.current.contains(t)) return;

      setIsBadgesOpen(false);
      setIsPopoverOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Keep portal aligned on scroll/resize
    const onMove = () => {
      if (isBadgesOpen || isPopoverOpen) measure();
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [isBadgesOpen, isPopoverOpen]);

  useEffect(() => {
    if (isBadgesOpen || isPopoverOpen) measure();
  }, [isBadgesOpen, isPopoverOpen]);

  const getPaceMessage = () => {
    const remaining = Math.max(0, goalValue - currentVal);
    if (remaining <= 0) return null;

    const daysInPeriod = timeframes.find((t) => t.id === activeTimeframe)?.days ?? 30;

    if (activeCategory === "books") {
      const pPerDay = Math.ceil((remaining * 300) / daysInPeriod);
      return (
        <>
          Read ~<span className="paceStrong">{pPerDay} pages</span> / day
        </>
      );
    }

    const pace = (remaining / daysInPeriod).toFixed(activeCategory === "words" || activeCategory === "pages" ? 0 : 1);
    return (
      <>
        Read <span className="paceStrong">{pace + " " + categories[activeCategory].unit}</span> / day
      </>
    );
  };

  // Portal panels
  const AchievementsPanel =
    isBadgesOpen && badgePos
      ? createPortal(
          <div
            className="trackersPanel trackersPanel--wide trackersPanel--portal"
            style={{ top: badgePos.top, right: badgePos.right }}
            role="dialog"
            aria-label="Achievements panel"
          >
            <div className="trackersPanelHead">
              <h2 className="trackersPanelTitle">Achievements</h2>
              <button
                type="button"
                onClick={() => {
                    setIsBadgesOpen((v) => {
                        const next = !v;
                        if (next) {
                        setIsPopoverOpen(false);     // close Goal
                        setView("progress");         // optional: reset goal view if you want
                        }
                        return next;
                    });
                }}
                className="trackersPanelClose"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="trackersPanelBody custom-scrollbar">
              {badges.map((badge) => {
                const level = getBadgeLevel(badge);
                const isMax = level === 5;
                const IconComp = badge.icon;

                const badgeActive = level > 0;
                const tierIdx = Math.max(0, Math.min(4, level - 1));
                const tier = tiers[tierIdx];

                return (
                  <div key={badge.id} className="badgeRow">
                    <div
                      className={[
                        "badgeIconBox",
                        badgeActive ? "badgeIconBox--active" : "badgeIconBox--inactive",
                        badgeActive ? tier.colorClass : "",
                      ].join(" ")}
                    >
                      <IconComp size={20} />
                    </div>

                    <div className="badgeMain">
                      <div className="badgeTop">
                        <div className="badgeText">
                          <h3 className={`badgeTitle ${badgeActive ? "badgeTitle--on" : "badgeTitle--off"}`}>
                            {badge.title}
                          </h3>
                          <p className="badgeDesc">{badge.desc}</p>
                        </div>

                        <div className="badgeMeta">
                          <p className={`badgeTag ${badgeActive ? tier.colorClass : "badgeTag--off"}`}>
                            {badge.isOneOff ? (level > 0 ? "UNLOCKED" : "EPIC") : isMax ? "MAX" : `LVL ${level}`}
                          </p>
                          <p className="badgeCurrent">{badge.val.toLocaleString()} current</p>
                        </div>
                      </div>

                      <div className="badgeBars">
                        <div className="barRow">
                          {badge.isOneOff ? (
                            <div className="barCell">
                              <div
                                className={`barFill ${tiers[4].fillClass}`}
                                style={{ width: `${level > 0 ? 100 : 0}%` }}
                              />
                            </div>
                          ) : (
                            [0, 1, 2, 3, 4].map((idx) => {
                              const t = badge.thresholds[idx];
                              const pT = idx === 0 ? 0 : badge.thresholds[idx - 1];

                              let fill = 0;
                              if (badge.val >= t) fill = 100;
                              else if (badge.val > pT) fill = ((badge.val - pT) / (t - pT)) * 100;

                              return (
                                <div key={idx} className="barCell">
                                  <div className={`barFill ${tiers[idx].fillClass}`} style={{ width: `${fill}%` }} />
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="thresholdRow">
                          {badge.isOneOff ? (
                            <span className="thresholdCell">{badge.thresholds[0]?.toLocaleString()}</span>
                          ) : (
                            badge.thresholds.map((t, idx) => (
                              <span key={idx} className="thresholdCell">
                                {t.toLocaleString()}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  const GoalPanel =
    isPopoverOpen && goalPos
      ? createPortal(
          <div
            className="trackersPanel trackersPanel--goal trackersPanel--portal"
            style={{ top: goalPos.top, right: goalPos.right }}
            role="dialog"
            aria-label="Goal panel"
          >
            {view === "progress" && (
              <>
                <h2 className="panelKicker">{activeTimeframe} goal</h2>

                <div className="goalNums">
                  <span className="goalNow">{currentVal.toLocaleString()}</span>
                  <span className="goalTotal">
                    / {goalValue} {categories[activeCategory].unit}
                  </span>
                </div>

                <div className="goalBar">
                  <div className="goalBarFill" style={{ width: `${goalPercent}%` }} />
                </div>

                <div className="paceBox">
                  <div className="paceIcon">
                    <TrendingUp size={16} />
                  </div>
                  <div className="paceText">
                    <p className="paceLabel">Estimated Pace</p>
                    <p className="paceValue">
                      {goalValue - currentVal > 0 ? (
                        getPaceMessage()
                      ) : (
                        <span className="goalDone">
                          Goal achieved! <Check size={12} />
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button type="button" onClick={() => setView("customize")} className="btnAdjust">
                  <Settings2 size={14} />
                  Adjust Target
                </button>
              </>
            )}

            {view === "customize" && (
              <div className="customize">
                <h2 className="panelKicker panelKicker--tight">Customize Goal</h2>

                <div className="seg">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => setActiveTimeframe(tf.id)}
                      className={`segBtn ${activeTimeframe === tf.id ? "segBtn--on" : ""}`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <div className="catGrid">
                  {Object.entries(categories).map(([key, config]) => {
                    const k = key as CategoryKey;
                    const Icon = config.icon;

                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setActiveCategory(k)}
                        className={`catBtn ${activeCategory === k ? "catBtn--on" : ""}`}
                      >
                        <Icon size={12} />
                        <span className="catBtnText">{config.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="numBox">
                  <input
                    type="number"
                    value={goalValue === 0 ? "" : goalValue}
                    onChange={(e) => setGoalValue(e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                    placeholder="0"
                    className="numInput"
                    autoFocus
                  />
                </div>

                <div className="btnRow">
                  <button type="button" onClick={() => setView("progress")} className="btnBack">
                    Back
                  </button>
                  <button type="button" onClick={() => setView("progress")} className="btnSet">
                    Set Goal
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="trackersInline">
        {/* Achievements trigger */}
        <div className="trackersItem" ref={badgeRef}>
          <button
            type="button"
            className="header-icon-btn trackersIconBtn"
            aria-label="Achievements"
            onClick={() => {
              const next = !isBadgesOpen;
              if (next) setIsPopoverOpen(false); // close Goal when opening Achievements
              setIsBadgesOpen(next);
            }}
          >
            <Award size={18} />
            {earnedCount > 0 && <span className="trackersDot" />}
          </button>
        </div>

        {/* Goal trigger */}
        <div className="trackersItem" ref={goalRef}>
          <button
            type="button"
            className="header-icon-btn trackersIconBtn"
            aria-label="Goal tracker"
            onClick={() => {
              const next = !isPopoverOpen;
              if (next) setIsBadgesOpen(false); // close Achievements when opening Goal
              setIsPopoverOpen(next);
              setView("progress");
            }}
          >
            <svg className="ring" viewBox="0 0 40 40" aria-hidden="true">
              <circle className="ringBase" cx="20" cy="20" r="16" />
              <circle
                className="ringProg"
                cx="20"
                cy="20"
                r="16"
                style={{ strokeDashoffset: 100.5 - (goalPercent / 100) * 100.5 }}
              />
            </svg>
            <Target size={14} />
          </button>
        </div>
      </div>

      {/* Portaled overlays */}
      {AchievementsPanel}
      {GoalPanel}
    </>
  );
}

export default TrackersInline;