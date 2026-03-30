import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Unified image insertion modal.
 * Three tabs: Upload, Browse (existing), URL.
 * Props:
 *   section, slug    — for upload/browse API paths
 *   onInsert(md)     — insert markdown at cursor
 *   onAsciiEdit(path)— open ASCII editor for an image
 *   onClose          — close the modal
 */
export default function ImagePickerModal({ section, slug, onInsert, onAsciiEdit, onClose }) {
  const [tab, setTab] = useState("upload");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Load existing images for this post
  const loadFiles = useCallback(() => {
    if (!section || !slug) return;
    fetch(`/api/media/${section}/${slug}`)
      .then((r) => r.json())
      .then(setFiles)
      .catch(() => {});
  }, [section, slug]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Upload handler
  async function uploadFiles(fileList) {
    if (!section || !slug || !fileList?.length) return;
    setUploading(true);
    const formData = new FormData();
    for (const file of fileList) {
      formData.append("files", file);
    }
    try {
      const res = await fetch(`/api/media/${section}/${slug}`, {
        method: "POST",
        body: formData,
      });
      const uploaded = await res.json();
      setFiles((prev) => [...prev, ...uploaded]);
      // If single file, insert it immediately
      if (uploaded.length === 1) {
        onInsert(uploaded[0].markdown);
      }
    } catch {
      // silent
    }
    setUploading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer?.files);
  }

  function handleUrlInsert() {
    if (!url.trim()) return;
    const altText = alt.trim() || "image";
    onInsert(`![${altText}](${url.trim()})`);
  }

  function handleFileClick(f) {
    onInsert(f.markdown);
  }

  function handleAscii(f) {
    onClose();
    if (onAsciiEdit) onAsciiEdit(f.path);
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tabs = [
    { key: "upload", label: "UPLOAD" },
    { key: "browse", label: `BROWSE${files.length ? ` (${files.length})` : ""}` },
    { key: "url", label: "URL" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>INSERT IMAGE</span>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              style={{
                ...styles.tab,
                ...(tab === t.key ? styles.tabActive : {}),
              }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={styles.body}>
          {/* ── Upload ── */}
          {tab === "upload" && (
            <div
              style={{
                ...styles.dropzone,
                borderColor: dragOver ? "var(--amber)" : "var(--smoke)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>▓</div>
              <div style={styles.dropLabel}>
                {uploading ? "UPLOADING..." : "DROP IMAGE HERE"}
              </div>
              <div style={styles.dropHint}>or click to browse</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.gif,.webp,.avif,.svg"
                style={{ display: "none" }}
                onChange={(e) => {
                  uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {/* ── Browse ── */}
          {tab === "browse" && (
            <div>
              {files.length === 0 ? (
                <div style={styles.emptyState}>
                  No images uploaded yet. Use the Upload tab first.
                </div>
              ) : (
                <div style={styles.grid}>
                  {files.map((f) => (
                    <div key={f.filename} style={styles.thumbWrap}>
                      <button
                        style={styles.thumb}
                        onClick={() => handleFileClick(f)}
                        title={`Insert ${f.filename}`}
                      >
                        <img src={f.path} alt={f.filename} style={styles.thumbImg} />
                        <span style={styles.thumbLabel}>{f.filename}</span>
                      </button>
                      {onAsciiEdit && (
                        <button
                          style={styles.asciiBtn}
                          onClick={(e) => { e.stopPropagation(); handleAscii(f); }}
                          title="Convert to ASCII art"
                        >
                          ▓ ASCII
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── URL ── */}
          {tab === "url" && (
            <div style={styles.urlForm}>
              <div className="field">
                <label>Image URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleUrlInsert(); }}
                />
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>Alt text</label>
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Description of the image"
                  onKeyDown={(e) => { if (e.key === "Enter") handleUrlInsert(); }}
                />
              </div>
              <button
                className="btn-primary"
                style={{ marginTop: 16, alignSelf: "flex-start" }}
                onClick={handleUrlInsert}
                disabled={!url.trim()}
              >
                INSERT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  box: {
    background: "var(--soot)",
    border: "1px solid var(--smoke)",
    width: "90vw",
    maxWidth: 560,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 var(--sp-2)",
    height: 40,
    borderBottom: "1px solid var(--smoke)",
    background: "var(--carbon)",
    flexShrink: 0,
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--amber)",
    letterSpacing: "0.15em",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--ash)",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
    fontFamily: "var(--font-mono)",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid var(--smoke)",
    background: "var(--carbon)",
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--ash)",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "8px 0",
    cursor: "pointer",
    letterSpacing: "0.12em",
    transition: "color 100ms, border-color 100ms",
  },
  tabActive: {
    color: "var(--amber)",
    borderBottomColor: "var(--amber)",
  },
  body: {
    flex: 1,
    overflow: "auto",
    padding: "var(--sp-2)",
  },
  dropzone: {
    border: "2px dashed var(--smoke)",
    padding: "48px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 150ms",
  },
  dropLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--enamel)",
    letterSpacing: "0.1em",
    marginBottom: 4,
  },
  dropHint: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--ash)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6,
  },
  thumbWrap: {
    position: "relative",
  },
  thumb: {
    background: "var(--carbon)",
    border: "1px solid var(--smoke)",
    padding: 4,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    width: "100%",
    transition: "border-color 100ms",
  },
  thumbImg: {
    width: "100%",
    height: 70,
    objectFit: "cover",
  },
  thumbLabel: {
    fontSize: "8px",
    color: "var(--ash)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    textAlign: "center",
  },
  asciiBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    fontFamily: "var(--font-mono)",
    fontSize: "8px",
    color: "var(--amber)",
    background: "rgba(26, 26, 26, 0.85)",
    border: "1px solid var(--amber-dim)",
    padding: "2px 5px",
    cursor: "pointer",
    letterSpacing: "0.08em",
    lineHeight: 1.2,
    zIndex: 1,
  },
  emptyState: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--ash)",
    textAlign: "center",
    padding: "32px 0",
  },
  urlForm: {
    display: "flex",
    flexDirection: "column",
  },
};
