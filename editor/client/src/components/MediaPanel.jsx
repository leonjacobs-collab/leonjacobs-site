import { useEffect, useState, useCallback } from "react";

export default function MediaPanel({ section, slug, onInsert, onAsciiEdit, open }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadFiles = useCallback(() => {
    if (!section || !slug) return;
    fetch(`/api/media/${section}/${slug}`)
      .then((r) => r.json())
      .then(setFiles)
      .catch(() => {});
  }, [section, slug]);

  useEffect(() => {
    if (open) loadFiles();
  }, [open, loadFiles]);

  function handleDrop(e) {
    e.preventDefault();
    if (!section || !slug) return;
    const droppedFiles = e.dataTransfer?.files;
    if (!droppedFiles?.length) return;
    uploadFiles(droppedFiles);
  }

  function handleFileSelect(e) {
    if (!section || !slug) return;
    if (!e.target.files?.length) return;
    uploadFiles(e.target.files);
    e.target.value = "";
  }

  async function uploadFiles(fileList) {
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
    } catch {
      // silently fail
    }
    setUploading(false);
  }

  if (!open) return null;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.label}>Media</span>
      </div>

      {/* Drop zone */}
      <div
        style={styles.dropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <p style={styles.dropText}>
          {uploading ? "Uploading…" : "Drop images here"}
        </p>
        <label style={styles.browseBtn}>
          Browse
          <input
            type="file"
            multiple
            accept="image/*,.gif,.webp,.avif,.svg"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Thumbnail grid */}
      <div style={styles.grid}>
        {files.map((f) => (
          <div key={f.filename} style={styles.thumbWrap}>
            <button
              style={styles.thumb}
              onClick={() => onInsert(f.markdown)}
              title={`Insert ${f.filename}`}
            >
              <img
                src={f.path}
                alt={f.filename}
                style={styles.thumbImg}
              />
              <span style={styles.thumbLabel}>{f.filename}</span>
            </button>
            {onAsciiEdit && (
              <button
                style={styles.asciiBtn}
                onClick={() => onAsciiEdit(f.path)}
                title="Convert to ASCII art"
              >
                ▓ ASCII
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    width: 240,
    background: "var(--carbon)",
    borderLeft: "1px solid var(--smoke)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
  },
  header: {
    padding: "0 var(--sp-1)",
    height: 32,
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid var(--smoke)",
  },
  label: {
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  dropzone: {
    margin: "var(--sp-1)",
    padding: "var(--sp-2) var(--sp-1)",
    border: "1px dashed var(--smoke)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  dropText: {
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
  },
  browseBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--amber)",
    border: "1px solid var(--amber-dim)",
    padding: "4px 12px",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  grid: {
    flex: 1,
    overflow: "auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
    padding: "var(--sp-1)",
  },
  thumbWrap: {
    position: "relative",
  },
  thumb: {
    background: "var(--soot)",
    border: "1px solid var(--smoke)",
    padding: 4,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    width: "100%",
    transition: "border-color 100ms ease",
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
  thumbImg: {
    width: "100%",
    height: 60,
    objectFit: "cover",
  },
  thumbLabel: {
    fontSize: "9px",
    color: "var(--ash)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    textAlign: "center",
  },
};
