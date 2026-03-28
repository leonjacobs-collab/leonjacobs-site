import { useState } from "react";
import SECTIONS from "../../../../lib/sections.json";

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function FrontmatterForm({ data, onChange }) {
  const [tagInput, setTagInput] = useState("");

  function update(key, value) {
    onChange({ ...data, [key]: value });
  }

  function handleTitleChange(e) {
    const title = e.target.value;
    const updates = { ...data, title };
    // Auto-generate slug if it hasn't been manually edited
    if (!data._slugEdited) {
      updates.slug = slugify(title);
    }
    // Auto-generate code from slug
    updates.code = slugify(title).slice(0, 3).toUpperCase();
    onChange(updates);
  }

  function addTag(e) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !(data.tags || []).includes(tag)) {
      update("tags", [...(data.tags || []), tag]);
    }
    setTagInput("");
  }

  function removeTag(tag) {
    update("tags", (data.tags || []).filter((t) => t !== tag));
  }

  return (
    <div style={styles.grid}>
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label>Title</label>
        <input
          type="text"
          value={data.title || ""}
          onChange={handleTitleChange}
          placeholder="Post title"
        />
      </div>

      <div className="field">
        <label>Slug</label>
        <input
          type="text"
          value={data.slug || ""}
          onChange={(e) => { update("slug", e.target.value); update("_slugEdited", true); }}
          placeholder="auto-generated"
        />
      </div>

      <div className="field">
        <label>Section</label>
        <select value={data.section || "writing"} onChange={(e) => update("section", e.target.value)}>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Date</label>
        <input
          type="date"
          value={data.date || new Date().toISOString().slice(0, 10)}
          onChange={(e) => update("date", e.target.value)}
        />
      </div>

      <div className="field">
        <label>Code</label>
        <input
          type="text"
          value={data.code || ""}
          onChange={(e) => update("code", e.target.value.toUpperCase().slice(0, 3))}
          maxLength={3}
          placeholder="ABC"
          style={{ width: 60, letterSpacing: "0.15em" }}
        />
      </div>

      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label>Description</label>
        <input
          type="text"
          value={data.description || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="One-liner for SEO / list views"
        />
      </div>

      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label>Tags</label>
        <div style={styles.tagRow}>
          {(data.tags || []).map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
              <button onClick={() => removeTag(tag)}>&times;</button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="add tag + enter"
            style={{ border: "none", flex: 1, minWidth: 100, padding: "4px 0" }}
          />
        </div>
      </div>

      <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <label style={{ margin: 0 }}>Draft</label>
        <button
          type="button"
          onClick={() => update("draft", !data.draft)}
          style={{
            ...styles.toggle,
            background: data.draft ? "var(--amber)" : "var(--green)",
          }}
        >
          {data.draft ? "DRAFT" : "LIVE"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "var(--sp-1) var(--sp-2)",
    padding: "var(--sp-2)",
    borderBottom: "1px solid var(--smoke)",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    borderBottom: "1px solid var(--smoke)",
    paddingBottom: 4,
  },
  toggle: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    letterSpacing: "0.1em",
    color: "var(--carbon)",
    border: "none",
    padding: "4px 12px",
    cursor: "pointer",
  },
};
