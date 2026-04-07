"use client";

import { useState } from "react";
import type { Conflict, Source } from "@/lib/field-guide/schemas";
import { resolveConflict, isResolved } from "@/lib/field-guide/conflict";
import styles from "./ConflictBadge.module.css";

interface ConflictBadgeProps {
  conflicts: Conflict[];
  sources: Source[];
}

/**
 * The signature UI element of the field guide.
 *
 * When the manual and a creator (or two creators) disagree about
 * something, this badge appears alongside the content. It expands
 * to show the disagreement and any editorial resolution.
 *
 * If a conflict is unresolved (resolution === null), the badge
 * uses neutral language and surfaces both views without picking
 * a side.
 */
export function ConflictBadge({ conflicts, sources }: ConflictBadgeProps) {
  const [open, setOpen] = useState(false);
  if (conflicts.length === 0) return null;

  const resolved = conflicts.map((c) => resolveConflict(c, sources));
  const allResolved = resolved.every((c) => isResolved(c));

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.badge}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.icon}>{allResolved ? "⚠" : "?"}</span>
        <span className={styles.label}>
          SOURCES DISAGREE {conflicts.length > 1 ? `(${conflicts.length})` : ""}
        </span>
        <span className={styles.caret}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className={styles.body}>
          {resolved.map((conflict, i) => (
            <div key={i} className={styles.conflict}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>CLAIM</span>
                <p className={styles.rowText}>{conflict.claim}</p>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>COUNTER</span>
                <p className={styles.rowText}>{conflict.counter}</p>
              </div>
              {conflict.resolution ? (
                <div className={`${styles.row} ${styles.resolution}`}>
                  <span className={styles.rowLabel}>EDITORIAL</span>
                  <p className={styles.rowText}>{conflict.resolution}</p>
                </div>
              ) : (
                <div className={`${styles.row} ${styles.unresolved}`}>
                  <span className={styles.rowLabel}>STATUS</span>
                  <p className={styles.rowText}>
                    Unresolved — both views presented neutrally.
                  </p>
                </div>
              )}
              {conflict.resolved_sources.length > 0 && (
                <div className={styles.sources}>
                  {conflict.resolved_sources.map((s) => (
                    <span key={s.key} className={styles.sourceTag}>
                      {s.name} ({s.type})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
