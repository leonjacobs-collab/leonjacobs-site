import type { ReactNode } from "react";
import styles from "./InstrumentPanel.module.css";

interface InstrumentPanelProps {
  /** Three-letter ALL CAPS section code, e.g. "GEM", "SCN", "TRB" */
  code: string;
  /** Long title displayed next to the code */
  title: string;
  /** Optional one-line subtitle / mission description */
  subtitle?: string;
  /** Optional metadata pairs displayed in the header (e.g. count, last updated) */
  meta?: { label: string; value: string }[];
  children: ReactNode;
}

/**
 * Shared wrapper for every field guide page.
 *
 * Renders the instrument-panel header (code + title + meta) and a
 * `.container`-wrapped body using the existing site design tokens.
 *
 * Tonal reference: leonmay.be/experimenting/artemis-dashboard.
 * A camera is an instrument; treat the UI like an instrument panel.
 */
export function InstrumentPanel({
  code,
  title,
  subtitle,
  meta,
  children,
}: InstrumentPanelProps) {
  return (
    <main className={`container ${styles.panel}`}>
      <header className={styles.header}>
        <div className={styles.codeBlock}>
          <span className={styles.code}>{code}</span>
          <span className={styles.title}>{title}</span>
        </div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {meta && meta.length > 0 && (
          <dl className={styles.meta}>
            {meta.map((m) => (
              <div key={m.label} className={styles.metaItem}>
                <dt className={styles.metaLabel}>{m.label}</dt>
                <dd className={styles.metaValue}>{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>
      <hr className="divider" />
      <div className={styles.body}>{children}</div>
    </main>
  );
}
