import { Routes, Route } from "react-router-dom";
import PostList from "./pages/PostList.jsx";
import EditorPage from "./pages/Editor.jsx";

export default function App() {
  return (
    <div className="editor-shell">
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/edit/:section/:slug" element={<EditorPage />} />
        <Route path="/new" element={<EditorPage />} />
      </Routes>
    </div>
  );
}
