import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";

const TABS = ["ALL", "WRITING", "BUILDING", "DESIGNING", "SHOWCASING"];

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tab === "ALL" ? posts : posts.filter((p) => p.section?.toUpperCase() === tab);

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <span className="topbar-title">leonmay.be — editor</span>
        <button className="btn-primary" onClick={() => navigate("/new")}>
          + New Post
        </button>
      </div>

      {/* Section tabs */}
      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tab,
              color: tab === t ? "var(--amber)" : "var(--ash)",
              borderBottomColor: tab === t ? "var(--amber)" : "transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Post table */}
      <div style={styles.tableWrap}>
        {loading ? (
          <p style={styles.empty}>Loading&hellip;</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>No posts found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>CODE</th>
                <th style={{ ...styles.th, flex: 3 }}>TITLE</th>
                <th style={styles.th}>SECTION</th>
                <th style={styles.th}>DATE</th>
                <th style={{ ...styles.th, width: 60, textAlign: "center" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr
                  key={`${post.section}-${post.slug}`}
                  style={styles.row}
                  onClick={() => navigate(`/edit/${post.section}/${post.slug}`)}
                >
                  <td style={styles.tdCode}>{post.code}</td>
                  <td style={styles.tdTitle}>{post.title}</td>
                  <td style={styles.tdSection}>{post.section}</td>
                  <td style={styles.tdDate}>{post.date}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span className={`dot ${post.draft ? "dot-draft" : "dot-published"}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <StatusBar />
    </>
  );
}

const styles = {
  tabs: {
    display: "flex",
    gap: 0,
    background: "var(--carbon)",
    borderBottom: "1px solid var(--smoke)",
    paddingLeft: "var(--sp-2)",
    flexShrink: 0,
  },
  tab: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "10px 18px",
    cursor: "pointer",
    transition: "color 120ms ease, border-color 120ms ease",
  },
  tableWrap: {
    flex: 1,
    overflow: "auto",
    padding: "var(--sp-2)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "1px solid var(--smoke)",
    fontWeight: "normal",
  },
  row: {
    cursor: "pointer",
    transition: "background 100ms ease",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--smoke)",
    fontSize: "var(--text-sm)",
  },
  tdCode: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--smoke)",
    fontSize: "var(--text-sm)",
    color: "var(--amber)",
    fontWeight: "normal",
    letterSpacing: "0.1em",
    width: 70,
  },
  tdTitle: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--smoke)",
    fontSize: "var(--text-sm)",
    color: "var(--enamel)",
  },
  tdSection: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--smoke)",
    fontSize: "var(--text-xs)",
    color: "var(--cement)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    width: 120,
  },
  tdDate: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--smoke)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    width: 110,
  },
  empty: {
    color: "var(--ash)",
    fontSize: "var(--text-sm)",
    textAlign: "center",
    marginTop: "var(--sp-6)",
  },
};
