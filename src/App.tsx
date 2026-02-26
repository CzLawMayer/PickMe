// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { ConfirmProvider } from "@/components/ConfirmPopover";

import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";
import LibraryPage from "@/pages/Library";
import ReadPage from "@/pages/Read";
import ReviewsPage from "@/pages/Reviews";
import StoriesPage from "@/pages/Stories";
import SearchPage from "@/pages/Search";
import SubmitPage from "@/pages/Submit";
import WritePage from "@/pages/Write";
import PreviewPage from "@/pages/Preview";
import ForumPage from "@/pages/Forum";

export default function App() {
  return (
    <ConfirmProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/read" element={<ReadPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/forum" element={<ForumPage />} />
      </Routes>
    </ConfirmProvider>
  );
}