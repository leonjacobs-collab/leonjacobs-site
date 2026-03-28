"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]~^";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

interface ScrambleTextProps {
  /** The final text to reveal */
  text: string;
  /** Duration of the full scramble cycle in ms */
  duration?: number;
  /** Delay before the scramble begins in ms */
  delay?: number;
  /** HTML tag to render */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a single text string with a scramble-dissolve reveal.
 * Characters start as random glyphs and settle left-to-right
 * with a randomised wavefront so it feels organic.
 */
export function ScrambleText({
  text,
  duration = 1200,
  delay = 0,
  as: Tag = "span",
  className,
  style,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(() =>
    text.replace(/[^\s]/g, () => randomChar())
  );
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const chars = text.split("");
    const len = chars.length;
    // Each character gets a random "settle time" — earlier chars settle sooner
    const settleAt = chars.map((_, i) => {
      const base = (i / len) * duration;
      const jitter = (Math.random() - 0.3) * duration * 0.35;
      return Math.max(0, base + jitter);
    });

    let startTime: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;

    function tick(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      const next = chars.map((ch, i) => {
        if (/\s/.test(ch)) return ch; // preserve whitespace
        return elapsed >= settleAt[i] ? ch : randomChar();
      });

      setDisplay(next.join(""));

      if (elapsed < duration * 1.1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text); // guarantee final state
      }
    }

    timeoutId = setTimeout(() => {
      frameRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(frameRef.current);
    };
  }, [text, duration, delay]);

  return (
    // @ts-expect-error dynamic tag
    <Tag className={className} style={style}>
      {display}
    </Tag>
  );
}

/**
 * Wraps arbitrary children and scrambles every text node in the subtree
 * on mount. Uses MutationObserver-free approach: walks the DOM once,
 * stores originals, runs the scramble, then restores.
 */
export function ScrambleReveal({
  children,
  duration = 1400,
  delay = 0,
}: {
  children: ReactNode;
  duration?: number;
  delay?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Collect all text nodes
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: { node: Text; original: string }[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (node.textContent && node.textContent.trim().length > 0) {
        nodes.push({ node, original: node.textContent });
      }
    }

    if (nodes.length === 0) return;

    // Scramble all text nodes initially
    for (const entry of nodes) {
      entry.node.textContent = entry.original.replace(/[^\s]/g, () =>
        randomChar()
      );
    }

    let startTime: number | null = null;
    let frame: number;

    function tick(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      for (const entry of nodes) {
        const chars = entry.original.split("");
        const result = chars.map((ch, i) => {
          if (/\s/.test(ch)) return ch;
          const charProgress = i / chars.length;
          // Character settles when the wavefront passes it
          const settleThreshold = charProgress * 0.7 + Math.random() * 0.15;
          return progress >= settleThreshold ? ch : randomChar();
        });
        entry.node.textContent = result.join("");
      }

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        // Guarantee originals are restored
        for (const entry of nodes) {
          entry.node.textContent = entry.original;
        }
      }
    }

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      // Restore on cleanup
      for (const entry of nodes) {
        entry.node.textContent = entry.original;
      }
    };
  }, [duration, delay]);

  return <div ref={containerRef}>{children}</div>;
}
