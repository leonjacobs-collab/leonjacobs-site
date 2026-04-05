"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mastheadData from "@/content/masthead.json";

/* ── types ──────────────────────────────────────────────── */

interface MastheadSpan {
  text: string;
  color: string | null;
}

interface MastheadLine {
  spans: MastheadSpan[];
}

interface MastheadEntry {
  id: string;
  lines: MastheadLine[];
}

interface MastheadActive extends MastheadEntry {
  caption: string;
  captionLink?: string;
  activeUntil?: string;
}

interface MastheadJSON {
  active: MastheadActive | null;
  defaults: MastheadEntry[];
}

/* ── constants ──────────────────────────────────────────── */

const SCRAMBLE_CHARS = "║═╔╗╚╝╬╣╠╦╩┼─│┌┐└┘├┤┬┴█▀▄░▒▓";
const FILL_CHAR = "█";
const ANIMATION_DURATION = 1800; // ms total
const BAND_HEIGHT = 0.35; // fraction of total height the reveal band covers
const CAPTION_FADE_DELAY = 400; // ms after art resolves before caption appears

function randomScrambleChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/* ── flatten art to a 2D character grid ─────────────────── */

interface CharCell {
  ch: string;
  color: string;
  isSpace: boolean;
}

function flattenLines(lines: MastheadLine[], defaultColor: string): CharCell[][] {
  return lines.map((line) => {
    const chars: CharCell[] = [];
    for (const span of line.spans) {
      const c = span.color || defaultColor;
      for (const ch of span.text) {
        chars.push({ ch, color: c, isSpace: /\s/.test(ch) });
      }
    }
    return chars;
  });
}

/* ── component ──────────────────────────────────────────── */

export default function Masthead() {
  const data = mastheadData as MastheadJSON;

  // Determine which art to use
  const [entry, setEntry] = useState<MastheadEntry | MastheadActive>(() => {
    // SSR: use first default (deterministic)
    return data.defaults[0];
  });

  const [caption, setCaption] = useState<string | null>(null);
  const [captionLink, setCaptionLink] = useState<string | undefined>(undefined);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Client-side: resolve active vs random default
  useEffect(() => {
    const active = data.active;
    if (active) {
      const expired =
        active.activeUntil && new Date(active.activeUntil).getTime() < Date.now();
      if (!expired) {
        setEntry(active);
        setCaption(active.caption || null);
        setCaptionLink(active.captionLink);
        setAnimKey((k) => k + 1);
        return;
      }
    }
    // Pick random default
    const idx = Math.floor(Math.random() * data.defaults.length);
    setEntry(data.defaults[idx]);
    setCaption(null);
    setCaptionLink(undefined);
    setAnimKey((k) => k + 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "44px 0",
      }}
    >
      <ScrambleArt
        key={animKey}
        lines={entry.lines}
        onComplete={() => {
          if (caption) {
            setTimeout(() => setCaptionVisible(true), CAPTION_FADE_DELAY);
          }
        }}
      />

      {/* Screen-reader text */}
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        Leon Jacobs
      </span>

      {caption && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--fg-muted)",
            opacity: captionVisible ? 0.5 : 0,
            marginTop: "11px",
            letterSpacing: "0.05em",
            textAlign: "center",
            transition: "opacity 600ms ease",
          }}
        >
          {captionLink ? (
            <a href={captionLink} style={{ color: "inherit", textDecoration: "none" }}>
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

/* ── scramble animation sub-component ───────────────────── */

interface ScrambleArtProps {
  lines: MastheadLine[];
  onComplete?: () => void;
}

function ScrambleArt({ lines, onComplete }: ScrambleArtProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const frameRef = useRef<number>(0);
  const [grid, setGrid] = useState<string[][]>(() => {
    // Initial state: all non-space chars are fill characters (invisible against bg)
    return lines.map((line) => {
      const chars: string[] = [];
      for (const span of line.spans) {
        for (const ch of span.text) {
          chars.push(/\s/.test(ch) ? ch : FILL_CHAR);
        }
      }
      return chars;
    });
  });
  const [colors, setColors] = useState<string[][]>(() => {
    // Initial colours: all bg colour (invisible)
    return lines.map((line) => {
      const c: string[] = [];
      for (const span of line.spans) {
        for (const _ch of span.text) {
          c.push("var(--bg)");
        }
      }
      return c;
    });
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Build target grid
    const defaultColor = "var(--accent)";
    const targetGrid = flattenLines(lines, defaultColor);
    const totalRows = targetGrid.length;
    let startTime: number | null = null;

    function tick(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      const newGrid: string[][] = [];
      const newColors: string[][] = [];

      for (let row = 0; row < totalRows; row++) {
        const rowChars: string[] = [];
        const rowColors: string[] = [];
        const rowFraction = row / totalRows;

        // The reveal band position (0→1 over duration)
        const bandCenter = easeOutCubic(progress);
        const bandTop = bandCenter - BAND_HEIGHT;
        const bandBottom = bandCenter;

        for (let col = 0; col < targetGrid[row].length; col++) {
          const cell = targetGrid[row][col];

          if (cell.isSpace) {
            rowChars.push(cell.ch);
            rowColors.push("transparent");
            continue;
          }

          if (rowFraction > bandBottom) {
            // Below band: still unrevealed (fill char, bg colour)
            rowChars.push(FILL_CHAR);
            rowColors.push("var(--bg)");
          } else if (rowFraction > bandTop) {
            // Inside band: scrambling
            const bandProgress = 1 - (rowFraction - bandTop) / BAND_HEIGHT;
            // Add per-character jitter to settle time
            const jitter = ((col * 7 + row * 13) % 17) / 17;
            const settleThreshold = 0.6 + jitter * 0.35;

            if (bandProgress > settleThreshold) {
              // Settled to final character
              rowChars.push(cell.ch);
              rowColors.push(cell.color);
            } else {
              // Still scrambling
              rowChars.push(randomScrambleChar());
              // Interpolate colour: start muted, approach target
              const colorProgress = bandProgress / settleThreshold;
              rowColors.push(
                colorProgress > 0.5 ? cell.color : "var(--fg-faint)"
              );
            }
          } else {
            // Above band: already settled
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
        // Guarantee final state
        setGrid(targetGrid.map((row) => row.map((c) => c.ch)));
        setColors(targetGrid.map((row) => row.map((c) => c.isSpace ? "transparent" : c.color)));
        onCompleteRef.current?.();
      }
    }

    // Small delay before animation starts so the fill state is visible briefly
    const timeout = setTimeout(() => {
      frameRef.current = requestAnimationFrame(tick);
    }, 150);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [lines]);

  return (
    <pre
      ref={preRef}
      aria-hidden="true"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "clamp(9px, 2.5vw, 16px)",
        lineHeight: 1.1,
        letterSpacing: 0,
        whiteSpace: "pre",
        margin: 0,
        padding: 0,
      }}
    >
      {grid.map((row, rowIdx) => (
        <div key={rowIdx}>
          {row.map((ch, colIdx) => (
            <span key={colIdx} style={{ color: colors[rowIdx]?.[colIdx] ?? "var(--accent)" }}>
              {ch}
            </span>
          ))}
        </div>
      ))}
    </pre>
  );
}
