// src/components/AppHeader.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import StaggeredMenu from "@/components/StaggeredMenu";
import { menuItems, socialItems } from "@/constants/nav";
import "./AppHeader.css"; // <-- link the CSS

type Props = {
  onClickWrite?: () => void;
  onClickSearch?: () => void;
};

export default function AppHeader({ onClickWrite, onClickSearch }: Props) {
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

      {/* We keep only Write/Search here. The Menu (+) stays inside StaggeredMenu. */}
      <div className="header-icons">
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Search"
          onClick={onClickSearch}
        >
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
        </button>

        <button
          type="button"
          className="header-icon-btn"
          aria-label="Write a story"
          onClick={onClickWrite}
        >
          <span className="material-symbols-outlined" aria-hidden="true">edit</span>
        </button>
      </div>

      {/* Global StaggeredMenu with its own internal (+) toggle */}
        <StaggeredMenu
            isFixed
            position="right"
            items={menuItems}
            socialItems={socialItems}
            displaySocials
            displayItemNumbering
            colors={["#1e1e22", "#35353c"]}
            accentColor="#fc5f2e"
            menuButtonColor="#fff"
            openMenuButtonColor="#000"
            changeMenuColorOnOpen
        />
    </header>
  );
}
