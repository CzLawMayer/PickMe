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
          colors={["#fc5f2e", "#d81b60", "#ff0000ff", "#1e88e5"]} // add more if you like
          accentColor="#1e88e5"
          menuButtonColor="#fff"
          openMenuButtonColor="#000"
          changeMenuColorOnOpen
        />
    </header>
  );
}
