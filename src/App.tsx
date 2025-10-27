import { Routes, Route } from "react-router-dom";   // <-- no BrowserRouter here
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";
import LibraryPage from "@/pages/Library";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/library" element={<LibraryPage />} />
    </Routes>
  );
}