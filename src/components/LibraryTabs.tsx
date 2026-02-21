// src/components/LibraryTabs.tsx
import { NavLink } from "react-router-dom";

type ActiveTab = "library" | "stories" | "read" | "reviews";

export default function LibraryTabs({ active }: { active: ActiveTab }) {
  return (
    <nav className="lib-tabs" aria-label="Library sections">
      <NavLink
        to="/library"
        className="lib-tab"
        end={active === "library"}
      >
        Saved
      </NavLink>

      <NavLink
        to="/stories"
        className="lib-tab"
        end={active === "stories"}
      >
        Published
      </NavLink>

      <NavLink
        to="/read"
        className="lib-tab"
        end={active === "read"}
      >
        Completed
      </NavLink>

      <NavLink
        to="/reviews"
        className={`lib-tab${active === "reviews" ? " is-active" : ""}`}
        end={active === "reviews"}
      >
        Reviews
      </NavLink>
    </nav>
  );
}