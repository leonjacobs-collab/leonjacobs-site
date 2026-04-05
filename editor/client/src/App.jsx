import { Routes, Route } from "react-router-dom";
import PostList from "./pages/PostList.jsx";
import EditorPage from "./pages/Editor.jsx";
import MastheadEditor from "./pages/MastheadEditor.jsx";

export default function App() {
  return (
    <div className="editor-shell">
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/edit/:section/:slug" element={<EditorPage />} />
        <Route path="/new" element={<EditorPage />} />
        <Route path="/masthead" element={<MastheadEditor />} />
      </Routes>
    </div>
  );
}
