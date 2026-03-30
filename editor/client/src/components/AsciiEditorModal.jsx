import { useState, useRef, useCallback, useEffect } from "react";
import {
  CHAR_RAMPS,
  RAMP_LABELS,
  SCRAMBLE_CHARS,
  FILL_CHAR,
  DEFAULTS,
  SIZE_STEPS,
  DEFAULT_SIZE_INDEX,
  imageToAscii,
  easeOutCubic,
} from "../lib/ascii.js";

/* ── ScrambleDisplay (editor version) ──────────────────────
   Always uses editor dark theme colors.                     */

const THEME = {
  bg: "#1a1a1a",
  fg: "#eeeeee",
  bgRgb: { r: 26, g: 26, b: 26 },
  fgRgb: { r: 238, g: 238, b: 238 },
};

function ScrambleDisplay({ lines, mode, speed, fontSize = 11 }) {
  const [displayed, setDisplayed] = useState([]);
  const [charColors, setCharColors] = useState([]);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);
  const containerRef = useRef(null);

  const cols = lines.length > 0 ? lines[0].length : 0;
  const rows = lines.length;
  const isScrollMode = mode === "scroll";

  // Scroll-linked reveal
  useEffect(() => {
    if (!isScrollMode || lines.length === 0) return;

    setDisplayed(lines.map((l) => FILL_CHAR.repeat(l.length)));
    setCharColors(lines.map((l) => Array(l.length).fill(THEME.bg)));

    let loopId;
    const render = () => {
      const el = containerRef.current;
      if (!el) { loopId = requestAnimationFrame(render); return; }

      const rect = el.getBoundingClientRect();
      const parent = el.closest("[data-ascii-scroll]");
      if (!parent) { loopId = requestAnimationFrame(render); return; }

      const parentRect = parent.getBoundingClientRect();
      const scrollTop = parent.scrollTop;
      const viewH = parentRect.height;
      const relTop = rect.top - parentRect.top;

      const enterPoint = viewH * 0.85;
      const exitPoint = viewH * 0.15;
      let progress = 0;
      if (relTop <= enterPoint) {
        progress = Math.min(1, Math.max(0, (enterPoint - relTop) / (enterPoint - exitPoint)));
      }

      const bandHeight = 0.25;
      const revealFront = progress * (1 + bandHeight);
      const newLines = [];
      const newColors = [];

      for (let row = 0; row < rows; row++) {
        const rowNorm = row / rows;
        const rowProgress = Math.min(1, Math.max(0, (revealFront - rowNorm) / bandHeight));
        const ep = easeOutCubic(rowProgress);
        let lineStr = "";
        const lineC = [];

        for (let col = 0; col < lines[row].length; col++) {
          const r = Math.round(THEME.bgRgb.r + (THEME.fgRgb.r - THEME.bgRgb.r) * ep);
          const g = Math.round(THEME.bgRgb.g + (THEME.fgRgb.g - THEME.bgRgb.g) * ep);
          const b = Math.round(THEME.bgRgb.b + (THEME.fgRgb.b - THEME.bgRgb.b) * ep);
          lineC.push(`rgb(${r},${g},${b})`);

          if (ep >= 0.98) {
            lineStr += lines[row][col];
          } else if (ep > 0.05) {
            const scrambleIntensity = 1 - ep;
            const flipEvery = Math.max(1, Math.floor(scrambleIntensity * 6));
            const tick = Math.floor(performance.now() / (40 * flipEvery));
            const idx = (tick + row * 17 + col * 31) % SCRAMBLE_CHARS.length;
            if (ep > 0.7 && (row * 137 + col * 251 + tick) % 3 === 0) {
              lineStr += lines[row][col];
            } else {
              lineStr += SCRAMBLE_CHARS[idx];
            }
          } else {
            lineStr += FILL_CHAR;
          }
        }
        newLines.push(lineStr);
        newColors.push(lineC);
      }

      setDisplayed(newLines);
      setCharColors(newColors);
      loopId = requestAnimationFrame(render);
    };

    loopId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(loopId);
  }, [isScrollMode, lines, rows]);

  // Time-based modes
  useEffect(() => {
    if (isScrollMode || lines.length === 0) return;

    startTimeRef.current = performance.now();
    const settled = new Set();
    const baseDuration = 2000 / speed;
    const settleDuration = baseDuration * 1.5;

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / settleDuration, 1);

      const newLines = lines.map((line, row) => {
        let result = "";
        for (let col = 0; col < line.length; col++) {
          const key = `${row}-${col}`;
          if (settled.has(key)) { result += line[col]; continue; }

          let charDelay;
          if (mode === "cascade") {
            charDelay = ((row + col) / (rows + cols)) * 0.7;
          } else if (mode === "random") {
            charDelay = (((row * 137 + col * 251) % 100) / 100) * 0.7;
          } else if (mode === "row") {
            charDelay = (row / rows) * 0.7;
          } else {
            const cx = cols / 2, cy = rows / 2;
            const maxR = Math.sqrt(cx * cx + cy * cy);
            const r = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
            charDelay = (r / maxR) * 0.7;
          }

          const cp = Math.max(0, (progress - charDelay) / (1 - charDelay));
          if (cp >= 1) { settled.add(key); result += line[col]; }
          else if (cp > 0) {
            const flipRate = Math.max(1, Math.floor((1 - cp) * 8));
            const tick = Math.floor(now / (30 * flipRate));
            const idx = (tick + row * 17 + col * 31) % SCRAMBLE_CHARS.length;
            result += SCRAMBLE_CHARS[idx];
          } else {
            result += " ";
          }
        }
        return result;
      });

      setDisplayed(newLines);
      setCharColors([]);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [lines, speed, mode, isScrollMode, rows, cols]);

  if (lines.length === 0) return null;

  const hasPerCharColor = charColors.length > 0;

  return (
    <div ref={containerRef}>
      <pre style={{
        fontFamily: "'Departure Mono', 'Courier New', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: 1.15,
        letterSpacing: "0.05em",
        color: hasPerCharColor ? undefined : THEME.fg,
        margin: 0,
        padding: "12px",
        overflow: "auto",
        whiteSpace: "pre",
      }}>
        {(displayed.length > 0 ? displayed : lines.map((l) => FILL_CHAR.repeat(l.length))).map(
          (line, rowIdx) => (
            <div key={rowIdx} style={{ height: `${Math.ceil(fontSize * 1.15)}px` }}>
              {hasPerCharColor && charColors[rowIdx]
                ? line.split("").map((ch, colIdx) => (
                    <span key={colIdx} style={{ color: charColors[rowIdx]?.[colIdx] || THEME.bg }}>
                      {ch}
                    </span>
                  ))
                : line || " "}
            </div>
          )
        )}
      </pre>
    </div>
  );
}

/* ── AsciiEditorModal ──────────────────────────────────────
   Full ASCII converter UI for the post editor.              */

export default function AsciiEditorModal({ imagePath, onInsert, onClose }) {
  const [cols, setCols] = useState(DEFAULTS.cols);
  const [ramp, setRamp] = useState(DEFAULTS.ramp);
  const [mode, setMode] = useState(DEFAULTS.mode);
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [invert, setInvert] = useState(DEFAULTS.invert);
  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX);
  const [asciiLines, setAsciiLines] = useState([]);
  const [triggerCount, setTriggerCount] = useState(0);
  const canvasRef = useRef(null);

  const fontSize = SIZE_STEPS[sizeIndex].px;

  // Load and convert image whenever params change
  useEffect(() => {
    if (!imagePath) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const lines = imageToAscii(imageData.data, img.width, img.height, cols, ramp, invert);
      setAsciiLines(lines);
      setTriggerCount((c) => c + 1);
    };
    img.src = imagePath;
  }, [imagePath, cols, ramp, invert]);

  const handleInsert = useCallback(() => {
    // Build MDX tag, omitting props that match defaults
    const parts = [`<AsciiArt src="${imagePath}"`];
    if (cols !== DEFAULTS.cols) parts.push(`cols={${cols}}`);
    if (ramp !== DEFAULTS.ramp) parts.push(`ramp="${ramp}"`);
    if (mode !== DEFAULTS.mode) parts.push(`mode="${mode}"`);
    if (speed !== DEFAULTS.speed) parts.push(`speed={${speed}}`);
    if (invert !== DEFAULTS.invert) parts.push(invert ? "invert" : "invert={false}");
    if (fontSize !== DEFAULTS.fontSize) parts.push(`fontSize={${fontSize}}`);
    parts.push("/>");
    onInsert("\n" + parts.join(" ") + "\n");
  }, [imagePath, cols, ramp, mode, speed, invert, fontSize, onInsert]);

  const isScrollMode = mode === "scroll";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>IMAGE → ASCII</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={handleInsert}>
              INSERT
            </button>
            <button className="btn-secondary" onClick={onClose}>
              CANCEL
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>Resolution</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="range"
                min={40}
                max={200}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                style={{ accentColor: "var(--amber)", width: 120 }}
              />
              <span style={styles.valueLabel}>{cols} cols</span>
            </div>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.label}>Type Size</label>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button
                onClick={() => setSizeIndex(Math.max(0, sizeIndex - 1))}
                disabled={sizeIndex === 0}
                style={{
                  ...styles.select,
                  borderRight: "none",
                  borderRadius: "2px 0 0 2px",
                  padding: "4px 8px",
                  color: sizeIndex === 0 ? "var(--smoke)" : "var(--enamel)",
                }}
              >
                −
              </button>
              <div style={{
                ...styles.select,
                minWidth: 80,
                textAlign: "center",
                cursor: "default",
                borderRadius: 0,
              }}>
                {SIZE_STEPS[sizeIndex].label}{" "}
                <span style={{ color: "var(--ash)", fontSize: "9px" }}>
                  {SIZE_STEPS[sizeIndex].note}
                </span>
              </div>
              <button
                onClick={() => setSizeIndex(Math.min(SIZE_STEPS.length - 1, sizeIndex + 1))}
                disabled={sizeIndex === SIZE_STEPS.length - 1}
                style={{
                  ...styles.select,
                  borderLeft: "none",
                  borderRadius: "0 2px 2px 0",
                  padding: "4px 8px",
                  color: sizeIndex === SIZE_STEPS.length - 1 ? "var(--smoke)" : "var(--enamel)",
                }}
              >
                +
              </button>
            </div>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.label}>Char Ramp</label>
            <select value={ramp} onChange={(e) => setRamp(e.target.value)} style={styles.select}>
              {Object.entries(RAMP_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.label}>Animation</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={styles.select}>
              <option value="scroll">Scroll reveal ↓</option>
              <option value="cascade">Cascade ↘</option>
              <option value="center">Center out ◎</option>
              <option value="row">Row sweep →</option>
              <option value="random">Random scatter</option>
            </select>
          </div>

          {!isScrollMode && (
            <div style={styles.controlGroup}>
              <label style={styles.label}>Speed</label>
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={styles.select}>
                <option value={0.5}>Slow</option>
                <option value={1}>Normal</option>
                <option value={2}>Fast</option>
                <option value={4}>Instant</option>
              </select>
            </div>
          )}

          <label style={{ ...styles.label, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => setInvert(e.target.checked)}
              style={{ accentColor: "var(--amber)" }}
            />
            Invert
          </label>

          {!isScrollMode && (
            <button
              className="btn-secondary"
              style={{ padding: "4px 12px", fontSize: "var(--text-xs)" }}
              onClick={() => setTriggerCount((c) => c + 1)}
            >
              ▶ REPLAY
            </button>
          )}
        </div>

        {/* Preview area */}
        <div style={styles.previewArea} data-ascii-scroll>
          {/* Scroll runway for scroll mode */}
          {isScrollMode && asciiLines.length > 0 && <div style={{ height: 200 }} />}

          <div style={styles.previewFrame}>
            {asciiLines.length > 0 ? (
              <ScrambleDisplay
                key={triggerCount}
                lines={asciiLines}
                mode={mode}
                speed={speed}
                fontSize={fontSize}
              />
            ) : (
              <div style={styles.placeholder}>CONVERTING...</div>
            )}
          </div>

          {/* Bottom scroll runway */}
          {isScrollMode && asciiLines.length > 0 && <div style={{ height: 200 }} />}
        </div>

        {/* Info bar */}
        <div style={styles.infoBar}>
          <img
            src={imagePath}
            alt="source"
            style={{ height: 24, width: 24, objectFit: "cover", opacity: 0.5, borderRadius: 2 }}
          />
          <span style={styles.infoText}>
            {asciiLines.length > 0
              ? `${asciiLines[0]?.length}×${asciiLines.length} CHARS`
              : ""}
          </span>
          <span style={styles.infoText}>{imagePath}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  box: {
    background: "var(--soot)",
    border: "1px solid var(--smoke)",
    width: "95vw",
    maxWidth: 1100,
    height: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 var(--sp-2)",
    height: 44,
    borderBottom: "1px solid var(--smoke)",
    background: "var(--carbon)",
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    color: "var(--amber)",
    letterSpacing: "0.15em",
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "end",
    padding: "var(--sp-1) var(--sp-2)",
    background: "var(--carbon)",
    borderBottom: "1px solid var(--smoke)",
    flexShrink: 0,
  },
  controlGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--ash)",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
  },
  valueLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--ash)",
  },
  select: {
    background: "var(--soot)",
    border: "1px solid var(--smoke)",
    color: "var(--enamel)",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "4px 8px",
    outline: "none",
    cursor: "pointer",
  },
  previewArea: {
    flex: 1,
    overflow: "auto",
    background: "#1a1a1a",
  },
  previewFrame: {
    border: "1px solid var(--smoke)",
    margin: "var(--sp-1)",
    background: "#1a1a1a",
    overflow: "auto",
  },
  placeholder: {
    padding: "48px 16px",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--ash)",
    letterSpacing: "0.15em",
  },
  infoBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 var(--sp-2)",
    height: 32,
    borderTop: "1px solid var(--smoke)",
    background: "var(--carbon)",
    flexShrink: 0,
  },
  infoText: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--ash)",
    letterSpacing: "0.1em",
  },
};
