// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";
import LibraryPage from "@/pages/Library";
import ReadPage from "@/pages/Read";            // <-- add

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/read" element={<ReadPage />} />   {/* <-- new */}
    </Routes>
  );
}
