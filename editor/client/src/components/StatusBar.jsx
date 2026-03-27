import { useEffect, useState } from "react";

export default function StatusBar() {
  const [git, setGit] = useState(null);

  useEffect(() => {
    fetch("/api/git/status")
      .then((r) => r.json())
      .then(setGit)
      .catch(() => {});
  }, []);

  return (
    <div style={styles.bar}>
      <span style={styles.item}>
        {git ? (
          <>
            <span style={{ color: "var(--amber)" }}>{git.branch}</span>
            {" · "}
            {git.clean ? (
              <span style={{ color: "var(--green)" }}>clean</span>
            ) : (
              <span style={{ color: "var(--amber)" }}>{git.files} changed</span>
            )}
          </>
        ) : (
          "git: connecting…"
        )}
      </span>
      {git?.lastCommit && (
        <span style={styles.item}>
          <span style={{ color: "var(--ash)" }}>
            {git.lastCommit.hash} — {git.lastCommit.message}
          </span>
        </span>
      )}
    </div>
  );
}

const styles = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 var(--sp-2)",
    height: 28,
    background: "var(--carbon)",
    borderTop: "1px solid var(--smoke)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    flexShrink: 0,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
};
