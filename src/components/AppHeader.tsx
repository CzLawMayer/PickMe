// src/components/AppHeader.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import StaggeredMenu from "@/components/StaggeredMenu";
import { menuItems, socialItems } from "@/constants/nav";
import "./AppHeader.css";

type Props = {
  onClickWrite?: () => void;
};

export default function AppHeader({ onClickWrite }: Props) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <header
      className={
        "app-header " + (isHome ? "app-header--transparent" : "app-header--dark")
      }
      role="banner"
    >
      <h1 className="logo">
        <Link to="/" className="logo-link" aria-label="Go to home">
          Pick<span>M</span>e!
        </Link>
      </h1>

      <div className="header-icons">
        {/* Search as a Link */}
        <Link
          to="/search"
          className="header-icon-btn"
          aria-label="Search"
        >
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <span className="sr-only">Search</span>
        </Link>

        {/* Write remains a button (keeps custom handler) */}
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Write a story"
          onClick={onClickWrite}
        >
          <span className="material-symbols-outlined" aria-hidden="true">edit</span>
          <span className="sr-only">Write</span>
        </button>
      </div>

      {/* Global StaggeredMenu with its own (+) toggle */}
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
    </header>
  );
}
