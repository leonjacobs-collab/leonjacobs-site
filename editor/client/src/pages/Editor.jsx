import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FrontmatterForm from "../components/FrontmatterForm.jsx";
import MarkdownEditor from "../components/MarkdownEditor.jsx";
import Preview from "../components/Preview.jsx";
import MediaPanel from "../components/MediaPanel.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import AsciiEditorModal from "../components/AsciiEditorModal.jsx";
import ImagePickerModal from "../components/ImagePickerModal.jsx";
import StatusBar from "../components/StatusBar.jsx";

const DEFAULT_FM = {
  title: "",
  slug: "",
  section: "writing",
  tags: [],
  date: new Date().toISOString().slice(0, 10),
  description: "",
  draft: true,
  code: "",
};

export default function EditorPage() {
  const { section, slug } = useParams();
  const navigate = useNavigate();
  const isNew = !section && !slug;

  const [frontmatter, setFrontmatter] = useState({ ...DEFAULT_FM });
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null); // null | "success" | { error: string }
  const [mediaOpen, setMediaOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [asciiModal, setAsciiModal] = useState(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const editorViewRef = useRef(null);

  // Load existing post
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/posts/${section}/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setFrontmatter({
          title: data.frontmatter.title || "",
          slug: slug,
          section: data.frontmatter.section || section,
          tags: data.frontmatter.tags || [],
          date: data.frontmatter.date || "",
          description: data.frontmatter.description || "",
          draft: data.frontmatter.draft !== false,
          code: data.frontmatter.code || slug.slice(0, 3).toUpperCase(),
        });
        setBody(data.body || "");
      })
      .catch(() => {});
  }, [section, slug, isNew]);

  // Save
  const handleSave = useCallback(async (asDraft) => {
    setSaving(true);
    const fm = { ...frontmatter };
    if (asDraft !== undefined) fm.draft = asDraft;

    try {
      if (isNew) {
        await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fm.title,
            section: fm.section,
            tags: fm.tags,
            date: fm.date,
            description: fm.description,
            draft: fm.draft,
            code: fm.code,
            body,
          }),
        });
        // Navigate to the new post's edit URL
        const newSlug = fm.slug || fm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        navigate(`/edit/${fm.section}/${newSlug}`, { replace: true });
      } else {
        await fetch(`/api/posts/${section}/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontmatter: fm, body }),
        });
      }
    } catch {
      // error handling could be added
    }
    setSaving(false);
  }, [frontmatter, body, isNew, section, slug, navigate]);

  // Publish
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setPublishResult(null);

    // First save with draft: false
    const fm = { ...frontmatter, draft: false };
    setFrontmatter(fm);

    try {
      // Save the file
      const saveEndpoint = isNew ? "/api/posts" : `/api/posts/${section}/${slug}`;
      const saveMethod = isNew ? "POST" : "PUT";
      await fetch(saveEndpoint, {
        method: saveMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew
            ? { ...fm, body }
            : { frontmatter: fm, body }
        ),
      });

      // Then git commit + push
      const res = await fetch("/api/git/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `content: ${fm.title}` }),
      });
      const result = await res.json();
      setPublishResult(result.success ? "success" : { error: result.error || "Push failed" });
    } catch (err) {
      setPublishResult({ error: err.message || "Request failed" });
    }
    setPublishing(false);
    setTimeout(() => setPublishResult(null), 4000);
  }, [frontmatter, body, isNew, section, slug]);

  // Delete
  const handleDelete = useCallback(async () => {
    if (isNew) return;
    await fetch(`/api/posts/${section}/${slug}`, { method: "DELETE" });
    navigate("/");
  }, [section, slug, isNew, navigate]);

  // Preview in dev server
  const handlePreview = useCallback(() => {
    const s = frontmatter.section || section || "writing";
    const sl = frontmatter.slug || slug;
    window.open(`http://localhost:3000/${s}/${sl}`, "_blank");
  }, [frontmatter, section, slug]);

  // Insert media markdown at cursor
  const handleMediaInsert = useCallback((md) => {
    const view = editorViewRef.current;
    if (view) {
      const cursor = view.state.selection.main.head;
      view.dispatch({ changes: { from: cursor, insert: md } });
    }
  }, []);

  // Open ASCII editor for an image
  const handleAsciiEdit = useCallback((imagePath) => {
    setAsciiModal({ imagePath });
  }, []);

  // Insert image markdown from the image picker modal
  const handleImagePickerInsert = useCallback((md) => {
    const view = editorViewRef.current;
    if (view) {
      const cursor = view.state.selection.main.head;
      view.dispatch({ changes: { from: cursor, insert: md } });
    }
    setImagePickerOpen(false);
  }, []);

  // Insert ASCII art MDX tag at cursor
  const handleAsciiInsert = useCallback((mdxTag) => {
    const view = editorViewRef.current;
    if (view) {
      const cursor = view.state.selection.main.head;
      view.dispatch({ changes: { from: cursor, insert: mdxTag } });
    }
    setAsciiModal(null);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <button
          onClick={() => navigate("/")}
          style={{ ...navBtn, marginRight: "auto" }}
        >
          &larr; POSTS
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn-secondary"
            onClick={() => setMediaOpen(!mediaOpen)}
          >
            {mediaOpen ? "Close Media" : "Media"}
          </button>
          <button className="btn-secondary" onClick={handlePreview}>
            Preview
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            className="btn-primary"
            onClick={() => handleSave(undefined)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            className="btn-primary"
            onClick={handlePublish}
            disabled={publishing}
            style={
              publishResult === "success"
                ? { background: "var(--green)" }
                : publishResult?.error
                ? { background: "var(--red)" }
                : {}
            }
          >
            {publishing ? "Publishing…" : publishResult === "success" ? "✓ Published" : publishResult?.error ? "✗ Failed" : "Publish"}
          </button>
          {!isNew && (
            <button className="btn-danger" onClick={() => setDeleteModal(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Publish error banner */}
      {publishResult?.error && (
        <div style={{ background: "var(--red)", color: "#fff", padding: "4px 12px", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>
          {publishResult.error}
        </div>
      )}

      {/* Frontmatter form */}
      <FrontmatterForm data={frontmatter} onChange={setFrontmatter} />

      {/* Editor + Preview split */}
      <div style={styles.split}>
        <div style={styles.editorPane}>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            viewRef={editorViewRef}
            onImageClick={() => setImagePickerOpen(true)}
          />
        </div>
        <div style={styles.previewPane}>
          <Preview markdown={body} frontmatter={frontmatter} />
        </div>
        <MediaPanel
          section={frontmatter.section || section || "writing"}
          slug={frontmatter.slug || slug || ""}
          open={mediaOpen}
          onInsert={handleMediaInsert}
          onAsciiEdit={handleAsciiEdit}
        />
      </div>

      <StatusBar />

      {deleteModal && (
        <ConfirmModal
          title="Delete post?"
          message={`This will move "${frontmatter.title || slug}" to .trash/. You can recover it manually.`}
          onConfirm={() => { setDeleteModal(false); handleDelete(); }}
          onCancel={() => setDeleteModal(false)}
        />
      )}

      {imagePickerOpen && (
        <ImagePickerModal
          section={frontmatter.section || section || "writing"}
          slug={frontmatter.slug || slug || ""}
          onInsert={handleImagePickerInsert}
          onAsciiEdit={handleAsciiEdit}
          onClose={() => setImagePickerOpen(false)}
        />
      )}

      {asciiModal && (
        <AsciiEditorModal
          imagePath={asciiModal.imagePath}
          onInsert={handleAsciiInsert}
          onClose={() => setAsciiModal(null)}
        />
      )}
    </>
  );
}

const navBtn = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  color: "var(--ash)",
  background: "none",
  border: "none",
  cursor: "pointer",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "4px 8px",
};

const styles = {
  split: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  editorPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  previewPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
};
