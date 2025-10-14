import { Routes, Route } from "react-router-dom";   // <-- no BrowserRouter here
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}