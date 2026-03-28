"use client";

import { useEffect, useState, useCallback } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "leonmay-theme";
const CYCLE: Theme[] = ["system", "light", "dark"];
const LABELS: Record<Theme, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

function getResolved(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Read persisted preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && CYCLE.includes(stored)) {
      setTheme(stored);
    }
    setMounted(true);
  }, []);

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    if (!mounted) return;
    const resolved = getResolved(theme);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      if (theme === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          mq.matches ? "dark" : "light"
        );
      }
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mounted]);

  const cycle = useCallback(() => {
    setTheme((prev) => {
      const idx = CYCLE.indexOf(prev);
      return CYCLE[(idx + 1) % CYCLE.length];
    });
  }, []);

  // Render nothing until mounted to avoid hydration mismatch
  if (!mounted) {
    return <button className="theme-toggle" aria-label="Toggle theme">&nbsp;</button>;
  }

  return (
    <button
      className="theme-toggle"
      onClick={cycle}
      aria-label={`Theme: ${theme}`}
      title={`Theme: ${theme}`}
    >
      <span className="theme-toggle-icon">{LABELS[theme]}</span>
      <span className="theme-toggle-label">{theme}</span>
    </button>
  );
}
