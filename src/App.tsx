// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";
import LibraryPage from "@/pages/Library";
import ReadPage from "@/pages/Read";
import ReviewsPage from "@/pages/Reviews";
import StoriesPage from "@/pages/Stories";
import SearchPage from "@/pages/Search";
import SubmitPage from "@/pages/Submit";
import WritePage from "@/pages/Write";
import PreviewPage from "@/pages/Preview"; // <-- ADD

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/read" element={<ReadPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/submit" element={<SubmitPage />} />
      <Route path="/write" element={<WritePage />} />
      <Route path="/preview" element={<PreviewPage />} /> {/* <-- ADD */}
    </Routes>
  );
}
