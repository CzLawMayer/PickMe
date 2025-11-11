import { useState } from "react";
import AppHeader from "@/components/AppHeader";

export default function SubmitPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="submit-app-blank">
      <AppHeader
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onClickWrite={() => {}}
      />
    </div>
  );
}
