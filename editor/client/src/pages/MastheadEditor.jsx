import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";

/* ── canonical block-heavy art ──────────────────────────── */

const CANONICAL_ART = [
  "██╗     ███████╗ ██████╗ ███╗   ██╗",
  "██║     ██╔════╝██╔═══██╗████╗  ██║",
  "██║     █████╗  ██║   ██║██╔██╗ ██║",
  "██║     ██╔══╝  ██║   ██║██║╚██╗██║",
  "███████╗███████╗╚██████╔╝██║ ╚████║",
  "╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝",
  "     ██╗ █████╗  ██████╗ ██████╗ ██████╗ ███████╗",
  "     ██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝",
  "     ██║███████║██║     ██║   ██║██████╔╝███████╗",
  "██   ██║██╔══██║██║     ██║   ██║██╔══██╗╚════██║",
  "╚█████╔╝██║  ██║╚██████╗╚██████╔╝██████╔╝███████║",
  " ╚════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝",
].join("\n");

/* ── scramble animation constants ───────────────────────── */

const SCRAMBLE_CHARS = "║═╔╗╚╝╬╣╠╦╩┼─│┌┐└┘├┤┬┴█▀▄░▒▓";
const FILL_CHAR = "█";

function randomScrambleChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ── helpers ────────────────────────────────────────────── */

/** Convert raw text + colour regions → MastheadLine[] */
function textToLines(text, colorRegions = []) {
  const rawLines = text.split("\n");
  return rawLines.map((line, i) => {
    const region = colorRegions.find(
      (r) => i >= r.startLine && i <= r.endLine
    );
    return {
      spans: [{ text: line, color: region ? region.color : null }],
    };
  });
}

/** Convert MastheadLine[] → raw text string */
function linesToText(lines) {
  return lines
    .map((line) => line.spans.map((s) => s.text).join(""))
    .join("\n");
}

/** Extract colour regions from MastheadLine[] */
function linesToRegions(lines) {
  const regions = [];
  let current = null;

  lines.forEach((line, i) => {
    const color = line.spans[0]?.color;
    if (color) {
      if (current && current.color === color && current.endLine === i - 1) {
        current.endLine = i;
      } else {
        current = { startLine: i, endLine: i, color };
        regions.push(current);
      }
    } else {
      current = null;
    }
  });

  return regions;
}

/* ── main component ─────────────────────────────────────── */

export default function MastheadEditor() {
  const navigate = useNavigate();

  // Data state
  const [mastheadData, setMastheadData] = useState(null);
  const [mode, setMode] = useState("default"); // 'default' | 'custom'
  const [artText, setArtText] = useState("");
  const [colorRegions, setColorRegions] = useState([]); // [{ startLine, endLine, color }]
  const [caption, setCaption] = useState("");
  const [captionLink, setCaptionLink] = useState("");
  const [activeUntil, setActiveUntil] = useState("");

  // Colour painter state
  const [paintStartLine, setPaintStartLine] = useState("");
  const [paintEndLine, setPaintEndLine] = useState("");
  const [paintColor, setPaintColor] = useState("#ffa133");

  // UI state
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animKey, setAnimKey] = useState(0);

  // Load data
  useEffect(() => {
    fetch("/api/masthead")
      .then((r) => r.json())
      .then((data) => {
        setMastheadData(data);

        if (data.active) {
          setMode("custom");
          setArtText(linesToText(data.active.lines));
          setColorRegions(linesToRegions(data.active.lines));
          setCaption(data.active.caption || "");
          setCaptionLink(data.active.captionLink || "");
          setActiveUntil(data.active.activeUntil || "");
        } else {
          setMode("default");
          setArtText(linesToText(data.defaults[0]?.lines || []));
          setColorRegions([]);
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Build JSON from current state
  const buildData = useCallback(() => {
    const lines = textToLines(artText, colorRegions);
    const base = mastheadData || { defaults: [], active: null };

    if (mode === "default") {
      return { ...base, active: null };
    }

    return {
      ...base,
      active: {
        id: "custom",
        lines,
        caption: caption || "",
        captionLink: captionLink || undefined,
        activeUntil: activeUntil || undefined,
      },
    };
  }, [mastheadData, mode, artText, colorRegions, caption, captionLink, activeUntil]);

  // Save (write to disk, no git)
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const data = buildData();
      await fetch("/api/masthead", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setMastheadData(data);
    } catch {
      // silent
    }
    setSaving(false);
  }, [buildData]);

  // Publish (write + git)
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setPublishResult(null);
    try {
      const data = buildData();
      const res = await fetch("/api/masthead/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setPublishResult(
        result.success ? "success" : { error: result.error || "Push failed" }
      );
      if (result.success) setMastheadData(data);
    } catch (err) {
      setPublishResult({ error: err.message || "Request failed" });
    }
    setPublishing(false);
    setTimeout(() => setPublishResult(null), 4000);
  }, [buildData]);

  // Generate base art
  const handleGenerateBase = useCallback(() => {
    setArtText(CANONICAL_ART);
    setColorRegions([]);
  }, []);

  // Paint colour to line range
  const handlePaintSelection = useCallback(() => {
    const start = parseInt(paintStartLine, 10) - 1; // 1-indexed for user
    const end = parseInt(paintEndLine, 10) - 1;
    if (isNaN(start) || isNaN(end) || start < 0 || end < start) return;

    setColorRegions((prev) => {
      // Remove any overlapping regions
      const filtered = prev.filter(
        (r) => r.endLine < start || r.startLine > end
      );
      return [...filtered, { startLine: start, endLine: end, color: paintColor }].sort(
        (a, b) => a.startLine - b.startLine
      );
    });
  }, [paintStartLine, paintEndLine, paintColor]);

  // Remove a colour region
  const handleRemoveRegion = useCallback((index) => {
    setColorRegions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Preview lines for the live preview
  const previewLines = textToLines(artText, colorRegions);

  if (loading) {
    return (
      <>
        <div className="topbar">
          <span className="topbar-title">MASTHEAD EDITOR</span>
        </div>
        <div style={styles.loading}>Loading…</div>
      </>
    );
  }

  return (
    <>
      {/* ── topbar ──────────────────────────────────────── */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={styles.backBtn}
            onClick={() => navigate("/")}
          >
            ← Posts
          </button>
          <span className="topbar-title">MASTHEAD EDITOR</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => setAnimKey((k) => k + 1)}
          >
            Preview Animation
          </button>
          <button
            className="btn-secondary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            className="btn-primary"
            onClick={handlePublish}
            disabled={publishing}
            style={{
              background:
                publishResult === "success"
                  ? "var(--green)"
                  : publishResult?.error
                  ? "var(--red)"
                  : undefined,
            }}
          >
            {publishing
              ? "Publishing…"
              : publishResult === "success"
              ? "✓ Published"
              : publishResult?.error
              ? "✗ Failed"
              : "Publish"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {publishResult?.error && (
        <div
          style={{
            background: "var(--red)",
            color: "#fff",
            padding: "4px 12px",
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {publishResult.error}
        </div>
      )}

      <div style={styles.body}>
        {/* ── live preview ───────────────────────────────── */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>LIVE PREVIEW</h2>
          <div style={styles.previewBox}>
            <ScramblePreview
              key={animKey}
              lines={previewLines}
              caption={mode === "custom" ? caption : ""}
              captionLink={mode === "custom" ? captionLink : ""}
            />
          </div>
        </section>

        {/* ── mode toggle ───────────────────────────────── */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>MODE</h2>
          <div style={styles.modeRow}>
            <button
              className={mode === "default" ? "btn-primary" : "btn-secondary"}
              onClick={() => setMode("default")}
            >
              Default
            </button>
            <button
              className={mode === "custom" ? "btn-primary" : "btn-secondary"}
              onClick={() => setMode("custom")}
            >
              Customise
            </button>
          </div>
          <p style={styles.modeHint}>
            {mode === "default"
              ? "The homepage shows the canonical LEON JACOBS art with no modifications. Switch to Customise to edit the art, add colours, or set a caption."
              : "You are editing a custom masthead. Changes here will appear on the homepage when you Save or Publish."}
          </p>
        </section>

        {/* ── default mode: read-only info ──────────────── */}
        {mode === "default" && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>CURRENT DEFAULT</h2>
            <p style={styles.hint}>
              This is the canonical art that shows on the homepage. To modify it, switch to Customise mode above.
            </p>
            <pre style={styles.readonlyPre}>{artText}</pre>
          </section>
        )}

        {/* ── custom mode: full editing tools ───────────── */}
        {mode === "custom" && (
          <>
            {/* ── art editor ────────────────────────────── */}
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>1 · EDIT ART</h2>
                <button
                  className="btn-secondary"
                  onClick={handleGenerateBase}
                  style={{ fontSize: "var(--text-xs)" }}
                >
                  Reset to Base
                </button>
              </div>
              <p style={styles.hint}>
                Edit the ASCII art directly. Each character will animate on the homepage with the scramble effect. The live preview above updates as you type.
              </p>
              <textarea
                value={artText}
                onChange={(e) => setArtText(e.target.value)}
                style={styles.textarea}
                rows={14}
                spellCheck={false}
              />
            </section>

            {/* ── colour regions ─────────────────────────── */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>2 · COLOUR REGIONS</h2>
              <p style={styles.hint}>
                Paint a colour onto a range of lines. Lines without a colour use the theme default (amber). Lines are numbered 1–{artText.split("\n").length}.
              </p>
              <div style={styles.paintRow}>
                <label style={styles.label}>
                  From line
                  <input
                    type="number"
                    min="1"
                    max={artText.split("\n").length}
                    value={paintStartLine}
                    onChange={(e) => setPaintStartLine(e.target.value)}
                    style={styles.numberInput}
                    placeholder="1"
                  />
                </label>
                <label style={styles.label}>
                  To line
                  <input
                    type="number"
                    min="1"
                    max={artText.split("\n").length}
                    value={paintEndLine}
                    onChange={(e) => setPaintEndLine(e.target.value)}
                    style={styles.numberInput}
                    placeholder={String(artText.split("\n").length)}
                  />
                </label>
                <label style={styles.label}>
                  Colour
                  <input
                    type="color"
                    value={paintColor}
                    onChange={(e) => setPaintColor(e.target.value)}
                    style={styles.colorInput}
                  />
                </label>
                <button className="btn-secondary" onClick={handlePaintSelection}>
                  Paint
                </button>
              </div>

              {colorRegions.length > 0 && (
                <div style={styles.regionList}>
                  {colorRegions.map((r, i) => (
                    <div key={i} style={styles.regionItem}>
                      <span
                        style={{
                          ...styles.regionSwatch,
                          background: r.color,
                        }}
                      />
                      <span style={styles.regionText}>
                        Lines {r.startLine + 1}–{r.endLine + 1}: {r.color}
                      </span>
                      <button
                        style={styles.regionRemove}
                        onClick={() => handleRemoveRegion(i)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn-secondary"
                    onClick={() => setColorRegions([])}
                    style={{ marginTop: 8, fontSize: "var(--text-xs)" }}
                  >
                    Clear All Colours
                  </button>
                </div>
              )}
            </section>

            {/* ── caption ────────────────────────────────── */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>3 · CAPTION</h2>
              <p style={styles.hint}>
                Optional text shown below the art. Appears after the scramble animation finishes.
              </p>
              <div style={styles.captionRow}>
                <label style={styles.label}>
                  Text
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    style={styles.textInput}
                    placeholder="happy belgian national day"
                  />
                </label>
                <label style={styles.label}>
                  Link (optional)
                  <input
                    type="url"
                    value={captionLink}
                    onChange={(e) => setCaptionLink(e.target.value)}
                    style={styles.textInput}
                    placeholder="https://..."
                  />
                </label>
              </div>
            </section>

            {/* ── scheduling ─────────────────────────────── */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>4 · SCHEDULING</h2>
              <p style={styles.hint}>
                Set an expiry date. After this date the homepage automatically reverts to the default art. Leave blank for no expiry.
              </p>
              <label style={styles.label}>
                Active until
                <input
                  type="date"
                  value={activeUntil}
                  onChange={(e) => setActiveUntil(e.target.value)}
                  style={styles.dateInput}
                />
              </label>
            </section>
          </>
        )}
      </div>

      <StatusBar />
    </>
  );
}

/* ── scramble preview sub-component ─────────────────────── */

function ScramblePreview({ lines, caption, captionLink }) {
  const [grid, setGrid] = useState([]);
  const [colors, setColors] = useState([]);
  const [captionVisible, setCaptionVisible] = useState(false);
  const frameRef = useRef(0);

  useEffect(() => {
    // Build target grid
    const targetGrid = lines.map((line) => {
      const chars = [];
      for (const span of line.spans) {
        for (const ch of span.text) {
          chars.push({
            ch,
            color: span.color || "var(--amber)",
            isSpace: /\s/.test(ch),
          });
        }
      }
      return chars;
    });

    const totalRows = targetGrid.length;

    // Initial fill state
    setGrid(
      targetGrid.map((row) =>
        row.map((c) => (c.isSpace ? c.ch : FILL_CHAR))
      )
    );
    setColors(
      targetGrid.map((row) =>
        row.map(() => "var(--carbon)")
      )
    );
    setCaptionVisible(false);

    let startTime = null;
    const duration = 1800;
    const bandHeight = 0.35;

    function tick(now) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const newGrid = [];
      const newColors = [];

      for (let row = 0; row < totalRows; row++) {
        const rowChars = [];
        const rowColors = [];
        const rowFrac = row / totalRows;
        const bandCenter = easeOutCubic(progress);
        const bandTop = bandCenter - bandHeight;
        const bandBottom = bandCenter;

        for (let col = 0; col < targetGrid[row].length; col++) {
          const cell = targetGrid[row][col];
          if (cell.isSpace) {
            rowChars.push(cell.ch);
            rowColors.push("transparent");
            continue;
          }
          if (rowFrac > bandBottom) {
            rowChars.push(FILL_CHAR);
            rowColors.push("var(--carbon)");
          } else if (rowFrac > bandTop) {
            const bp = 1 - (rowFrac - bandTop) / bandHeight;
            const jitter = ((col * 7 + row * 13) % 17) / 17;
            const threshold = 0.6 + jitter * 0.35;
            if (bp > threshold) {
              rowChars.push(cell.ch);
              rowColors.push(cell.color);
            } else {
              rowChars.push(randomScrambleChar());
              rowColors.push(bp / threshold > 0.5 ? cell.color : "var(--ash)");
            }
          } else {
            rowChars.push(cell.ch);
            rowColors.push(cell.color);
          }
        }
        newGrid.push(rowChars);
        newColors.push(rowColors);
      }

      setGrid(newGrid);
      setColors(newColors);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setGrid(targetGrid.map((r) => r.map((c) => c.ch)));
        setColors(
          targetGrid.map((r) =>
            r.map((c) => (c.isSpace ? "transparent" : c.color))
          )
        );
        if (caption) setTimeout(() => setCaptionVisible(true), 400);
      }
    }

    const timeout = setTimeout(() => {
      frameRef.current = requestAnimationFrame(tick);
    }, 150);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [lines, caption]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <pre
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(8px, 1.8vw, 14px)",
          lineHeight: 1.1,
          letterSpacing: 0,
          whiteSpace: "pre",
          margin: 0,
        }}
      >
        {grid.map((row, ri) => (
          <div key={ri}>
            {row.map((ch, ci) => (
              <span key={ci} style={{ color: colors[ri]?.[ci] || "var(--amber)" }}>
                {ch}
              </span>
            ))}
          </div>
        ))}
      </pre>
      {caption && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--ash)",
            opacity: captionVisible ? 0.5 : 0,
            marginTop: 11,
            letterSpacing: "0.05em",
            transition: "opacity 600ms ease",
          }}
        >
          {captionLink ? (
            <a
              href={captionLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {caption}
            </a>
          ) : (
            caption
          )}
        </p>
      )}
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────── */

const styles = {
  loading: {
    padding: "var(--sp-4)",
    color: "var(--ash)",
    fontSize: "var(--text-sm)",
    textAlign: "center",
  },
  body: {
    padding: "var(--sp-2)",
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "var(--sp-2)",
    flex: 1,
    overflowY: "auto",
    paddingBottom: "var(--sp-8)",
  },
  section: {
    background: "var(--soot)",
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    padding: "var(--sp-2)",
  },
  sectionTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: 11,
    fontWeight: "normal",
  },
  previewBox: {
    background: "var(--carbon)",
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    padding: "var(--sp-3)",
    display: "flex",
    justifyContent: "center",
    overflow: "auto",
  },
  modeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
  },
  modeHint: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    lineHeight: 1.5,
    margin: 0,
  },
  hint: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    lineHeight: 1.5,
    margin: "0 0 11px 0",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  readonlyPre: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    lineHeight: 1.2,
    background: "var(--carbon)",
    color: "var(--amber)",
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    padding: "var(--sp-1)",
    whiteSpace: "pre",
    overflowX: "auto",
    opacity: 0.6,
    margin: 0,
  },
  textarea: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    lineHeight: 1.2,
    background: "var(--carbon)",
    color: "var(--amber)",
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    padding: "var(--sp-1)",
    width: "100%",
    resize: "vertical",
    outline: "none",
    whiteSpace: "pre",
    overflowX: "auto",
  },
  paintRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
  label: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  numberInput: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    background: "var(--carbon)",
    color: "var(--enamel)",
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    padding: "6px 10px",
    width: 80,
    outline: "none",
  },
  colorInput: {
    width: 40,
    height: 32,
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    cursor: "pointer",
    background: "none",
    padding: 0,
  },
  regionList: {
    marginTop: 11,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  regionItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  regionSwatch: {
    width: 14,
    height: 14,
    borderRadius: 2,
    border: "1px solid var(--smoke)",
    flexShrink: 0,
  },
  regionText: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--cement)",
  },
  regionRemove: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    color: "var(--red)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 6px",
    lineHeight: 1,
  },
  captionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  textInput: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    background: "var(--carbon)",
    color: "var(--enamel)",
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    padding: "6px 10px",
    width: 320,
    outline: "none",
  },
  dateInput: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    background: "var(--carbon)",
    color: "var(--enamel)",
    border: "1px solid var(--smoke)",
    borderRadius: 4,
    padding: "6px 10px",
    width: 200,
    outline: "none",
  },
  backBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
};
