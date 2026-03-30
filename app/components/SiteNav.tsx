"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { SECTIONS } from "@/lib/sections";
import { ThemeToggle } from "./ThemeToggle";

const ABOUT_ITEM = { label: "this guy", href: "/thisguy" };
const NAV_ITEMS = SECTIONS.map((s) => ({ label: s, href: `/${s}` }));

export function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive current section from the URL
  const currentSection = (() => {
    const seg = pathname.split("/").filter(Boolean)[0];
    if (seg === "thisguy") return ABOUT_ITEM.label;
    if (seg && NAV_ITEMS.some((s) => s.label === seg)) return seg;
    return null;
  })();

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <nav className="site-nav">
      {/* Left: theme toggle */}
      <ThemeToggle />

      {/* Right: site name / section selector */}
      <div className="site-nav-inner" ref={dropdownRef}>
        <button
          className="site-nav-trigger"
          onClick={() => router.push("/")}
          aria-label="Go home"
        >
          leonmay.be
        </button>
        <span className="site-nav-slash">/</span>
        <button
          className="site-nav-select"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="site-nav-current">
            {currentSection ?? "…"}
          </span>
          <span className="site-nav-caret" aria-hidden="true">
            {open ? "▲" : "▼"}
          </span>
        </button>

        {open && (
          <ul className="site-nav-dropdown" role="listbox">
            <li key={ABOUT_ITEM.label} role="option" aria-selected={currentSection === ABOUT_ITEM.label}>
              <button
                className={`site-nav-option site-nav-option-about${currentSection === ABOUT_ITEM.label ? " active" : ""}`}
                onClick={() => handleSelect(ABOUT_ITEM.href)}
              >
                {ABOUT_ITEM.label}
              </button>
            </li>
            <li className="site-nav-divider" role="separator" aria-hidden="true" />
            {NAV_ITEMS.map((s) => (
              <li key={s.label} role="option" aria-selected={currentSection === s.label}>
                <button
                  className={`site-nav-option${currentSection === s.label ? " active" : ""}`}
                  onClick={() => handleSelect(s.href)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
