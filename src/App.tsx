// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";
import LibraryPage from "@/pages/Library";
import ReadPage from "@/pages/Read";
import ReviewsPage from "@/pages/Reviews";   // <-- add
import StoriesPage from "@/pages/Stories";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/read" element={<ReadPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />  {/* <-- new */}
    </Routes>
  );
}
