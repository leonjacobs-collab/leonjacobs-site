"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./FieldGuideNav.module.css";

const BASE = "/building/lumix-s5ii-field-guide";

const TABS = [
  { code: "FG", label: "Overview", href: BASE },
  { code: "GEM", label: "Gems", href: `${BASE}/gems` },
  { code: "SCN", label: "Scenes", href: `${BASE}/scenes` },
  { code: "LNS", label: "Lenses", href: `${BASE}/lenses` },
  { code: "TRB", label: "Troubleshoot", href: `${BASE}/troubleshoot` },
  { code: "LUT", label: "LUTs", href: `${BASE}/luts` },
] as const;

export function FieldGuideNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Field guide sections">
      <div className={styles.inner}>
        {TABS.map((tab) => {
          const isActive =
            tab.href === BASE
              ? pathname === BASE
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.code}
              href={tab.href}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.tabCode}>{tab.code}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
