"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  CHAR_RAMPS,
  SCRAMBLE_CHARS,
  FILL_CHAR,
  DEFAULTS,
  imageToAscii,
  easeOutCubic,
  type AsciiArtProps,
  type AnimationMode,
} from "@/lib/ascii/core";

/* ── Theme helpers ─────────────────────────────────────────
   Reads the resolved data-theme attribute and maps to
   CSS variables the site already defines.                   */

interface ThemeColors {
  bg: string;
  fg: string;
  bgRgb: { r: number; g: number; b: number };
  fgRgb: { r: number; g: number; b: number };
}

function parseRgb(css: string): { r: number; g: number; b: number } {
  // Handles both "rgb(r, g, b)" and hex "#rrggbb"
  const rgbMatch = css.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
  }
  const hexMatch = css.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function getThemeColors(): ThemeColors {
  if (typeof window === "undefined") {
    // SSR fallback — dark theme
    return {
      bg: "#1a1612",
      fg: "#d4cfc8",
      bgRgb: { r: 26, g: 22, b: 18 },
      fgRgb: { r: 212, g: 207, b: 200 },
    };
  }
  const style = getComputedStyle(document.documentElement);
  const bg = style.getPropertyValue("--bg").trim() || "#1a1612";
  const fg = style.getPropertyValue("--fg").trim() || "#d4cfc8";
  return { bg, fg, bgRgb: parseRgb(bg), fgRgb: parseRgb(fg) };
}

/* ── ScrambleDisplay ───────────────────────────────────────
   Animated ASCII renderer. Supports multiple reveal modes.  */

function ScrambleDisplay({
  lines,
  mode,
  speed,
  theme,
  fontSize,
}: {
  lines: string[];
  mode: AnimationMode;
  speed: number;
  theme: ThemeColors;
  fontSize: number;
}) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [charColors, setCharColors] = useState<string[][]>([]);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cols = lines.length > 0 ? lines[0].length : 0;
  const rows = lines.length;
  const isScrollMode = mode === "scroll";

  const { bgRgb, fgRgb, bg: bgColor } = theme;

  // ─── Scroll-linked reveal ───
  useEffect(() => {
    if (!isScrollMode || lines.length === 0) return;

    setDisplayed(lines.map((l) => FILL_CHAR.repeat(l.length)));
    setCharColors(lines.map((l) => Array(l.length).fill(bgColor)));

    let loopId: number;

    const render = () => {
      const el = containerRef.current;
      if (!el) {
        loopId = requestAnimationFrame(render);
        return;
      }

      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const enterPoint = viewH * 0.85;
      const exitPoint = viewH * 0.15;
      let progress = 0;
      if (rect.top <= enterPoint) {
        progress = Math.min(1, Math.max(0, (enterPoint - rect.top) / (enterPoint - exitPoint)));
      }

      const bandHeight = 0.25;
      const revealFront = progress * (1 + bandHeight);
      const newLines: string[] = [];
      const newColors: string[][] = [];

      for (let row = 0; row < rows; row++) {
        const rowNorm = row / rows;
        const rowProgress = Math.min(1, Math.max(0, (revealFront - rowNorm) / bandHeight));
        const ep = easeOutCubic(rowProgress);
        let lineStr = "";
        const lineColors: string[] = [];

        for (let col = 0; col < lines[row].length; col++) {
          const r = Math.round(bgRgb.r + (fgRgb.r - bgRgb.r) * ep);
          const g = Math.round(bgRgb.g + (fgRgb.g - bgRgb.g) * ep);
          const b = Math.round(bgRgb.b + (fgRgb.b - bgRgb.b) * ep);
          lineColors.push(`rgb(${r},${g},${b})`);

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
        newColors.push(lineColors);
      }

      setDisplayed(newLines);
      setCharColors(newColors);
      loopId = requestAnimationFrame(render);
    };

    loopId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(loopId);
  }, [isScrollMode, lines, rows, bgColor, bgRgb, fgRgb]);

  // ─── Time-based modes (cascade, center, row, random) ───
  useEffect(() => {
    if (isScrollMode || lines.length === 0) return;

    startTimeRef.current = performance.now();
    const settled = new Set<string>();
    const baseDuration = 2000 / speed;
    const settleDuration = baseDuration * 1.5;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current!;
      const progress = Math.min(elapsed / settleDuration, 1);

      const newLines = lines.map((line, row) => {
        let result = "";
        for (let col = 0; col < line.length; col++) {
          const key = `${row}-${col}`;
          if (settled.has(key)) {
            result += line[col];
            continue;
          }

          let charDelay: number;
          if (mode === "cascade") {
            charDelay = ((row + col) / (rows + cols)) * 0.7;
          } else if (mode === "random") {
            charDelay = (((row * 137 + col * 251) % 100) / 100) * 0.7;
          } else if (mode === "row") {
            charDelay = (row / rows) * 0.7;
          } else {
            // center
            const cx = cols / 2;
            const cy = rows / 2;
            const maxR = Math.sqrt(cx * cx + cy * cy);
            const r = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
            charDelay = (r / maxR) * 0.7;
          }

          const cp = Math.max(0, (progress - charDelay) / (1 - charDelay));

          if (cp >= 1) {
            settled.add(key);
            result += line[col];
          } else if (cp > 0) {
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
    return () => cancelAnimationFrame(frameRef.current);
  }, [lines, speed, mode, isScrollMode, rows, cols]);

  if (lines.length === 0) return null;

  const hasPerCharColor = charColors.length > 0;

  return (
    <div ref={containerRef}>
      <pre
        style={{
          fontFamily: "var(--font-mono, 'Departure Mono', 'Courier New', monospace)",
          fontSize: `${fontSize}px`,
          lineHeight: 1.15,
          letterSpacing: "0.05em",
          color: hasPerCharColor ? undefined : "var(--fg)",
          margin: 0,
          padding: "16px",
          overflow: "auto",
          whiteSpace: "pre",
          userSelect: "text",
        }}
      >
        {(displayed.length > 0
          ? displayed
          : lines.map((l) => FILL_CHAR.repeat(l.length))
        ).map((line, rowIdx) => (
          <div key={rowIdx} style={{ height: `${Math.ceil(fontSize * 1.15)}px` }}>
            {hasPerCharColor && charColors[rowIdx]
              ? line.split("").map((ch, colIdx) => (
                  <span key={colIdx} style={{ color: charColors[rowIdx]?.[colIdx] || bgColor }}>
                    {ch}
                  </span>
                ))
              : line || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

/* ── AsciiArt — MDX component ──────────────────────────────
   <AsciiArt src="/images/..." cols={100} ramp="departure"
             mode="cascade" speed={1} invert />              */

export default function AsciiArt({
  src,
  alt,
  cols = DEFAULTS.cols,
  ramp = DEFAULTS.ramp,
  mode = DEFAULTS.mode,
  speed = DEFAULTS.speed,
  invert = DEFAULTS.invert,
  fontSize = DEFAULTS.fontSize,
}: AsciiArtProps) {
  const [asciiLines, setAsciiLines] = useState<string[]>([]);
  const [triggered, setTriggered] = useState(false);
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Watch for theme changes via data-theme attribute
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getThemeColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Load image and convert to ASCII
  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const lines = imageToAscii(imageData.data, img.width, img.height, cols, ramp, invert);
      setAsciiLines(lines);
    };
    img.src = src;
  }, [src, cols, ramp, invert]);

  // IntersectionObserver — trigger animation when scrolled into view
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || asciiLines.length === 0) return;

    // For scroll mode we don't gate on intersection — ScrambleDisplay handles it
    if (mode === "scroll") {
      setTriggered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [asciiLines, mode]);

  return (
    <div
      ref={wrapperRef}
      role="img"
      aria-label={alt || "ASCII art"}
      style={{
        background: "var(--bg-sunken)",
        border: "1px solid var(--border, rgba(128,128,128,0.15))",
        borderRadius: "2px",
        overflow: "hidden",
        margin: "var(--sp-4, 24px) 0",
      }}
    >
      {triggered && asciiLines.length > 0 ? (
        <ScrambleDisplay
          lines={asciiLines}
          mode={mode}
          speed={speed}
          theme={theme}
          fontSize={fontSize}
        />
      ) : asciiLines.length > 0 ? (
        // Pre-trigger: show filled block characters (hidden, same color as bg)
        <pre
          style={{
            fontFamily: "var(--font-mono, 'Departure Mono', monospace)",
            fontSize: `${fontSize}px`,
            lineHeight: 1.15,
            color: "var(--bg-sunken)",
            margin: 0,
            padding: "16px",
            whiteSpace: "pre",
          }}
        >
          {asciiLines.map((l, i) => (
            <div key={i} style={{ height: `${Math.ceil(fontSize * 1.15)}px` }}>
              {FILL_CHAR.repeat(l.length)}
            </div>
          ))}
        </pre>
      ) : (
        // Loading placeholder
        <div
          style={{
            padding: "48px 16px",
            textAlign: "center",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            color: "var(--fg-faint)",
            letterSpacing: "0.1em",
          }}
        >
          LOADING...
        </div>
      )}
    </div>
  );
}
