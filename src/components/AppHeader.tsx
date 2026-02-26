// src/components/AppHeader.tsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import StaggeredMenu from "@/components/StaggeredMenu";
import { menuItems, socialItems } from "@/constants/nav";
import TrackersInline from "@/components/Trackers";
import "./AppHeader.css";

type Props = {
  onClickWrite?: () => void;
};

export default function AppHeader({ onClickWrite }: Props) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  const [trackersOpen, setTrackersOpen] = useState(false);

  return (
    <header
      className={"app-header " + (isHome ? "app-header--transparent" : "app-header--dark")}
      role="banner"
    >
      <h1 className="logo">
        <Link to="/" className="logo-link" aria-label="Go to home">
          <span className="logo-split" aria-hidden="true">
            <span className="logo-left">
              <span className="logo-left-text">
                <span className="logo-ital">Odd</span>
                <span className="logo-roman">Cha</span>
              </span>

              <span className="logo-bar" aria-hidden="true">
                <span className="seg-1" />
                <span className="seg-2" />
                <span className="seg-3" />
                <span className="seg-4" />
              </span>
            </span>

            <span className="logo-right">
              <span className="logo-roman">pter</span>
            </span>
          </span>

          <span className="sr-only">OddChapter</span>
        </Link>
      </h1>

      <div className="header-icons">
        <TrackersInline />

        {/* Search */}
        <Link to="/search" className="header-icon-btn" aria-label="Search">
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>
          <span className="sr-only">Search</span>
        </Link>

        {/* Submit */}
        <Link to="/submit" className="header-icon-btn" aria-label="Submit a story">
          <span className="material-symbols-outlined" aria-hidden="true">
            edit
          </span>
          <span className="sr-only">Submit</span>
        </Link>
      </div>

      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering
        colors={["#fc5f2e", "#d81b60", "#6a1b9a", "#1e88e5"]}
        accentColor="#1e88e5"
        menuButtonColor="#fff"
        openMenuButtonColor="#000"
        changeMenuColorOnOpen
      />

      {trackersOpen && <Trackers onClose={() => setTrackersOpen(false)} />}
    </header>
  );
}