"use client";

import styles from "./FilterBar.module.css";

export interface FilterGroup {
  /** Unique key for this filter group */
  key: string;
  /** Display label, e.g. "USE CASE" */
  label: string;
  /** Available options */
  options: { value: string; label: string }[];
  /** Currently-selected value, or null for "all" */
  selected: string | null;
}

interface FilterBarProps {
  groups: FilterGroup[];
  onChange: (groupKey: string, value: string | null) => void;
  /** Optional result count to display */
  resultCount?: number;
}

/**
 * Shared filter UI for content browsers (Hidden Gems, Scenes, LUTs, etc).
 *
 * Renders one row per filter group, each as a horizontal strip of
 * tag-style chips. Tapping a chip selects it; tapping the active
 * chip clears the filter.
 */
export function FilterBar({ groups, onChange, resultCount }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      {groups.map((group) => (
        <div key={group.key} className={styles.group}>
          <span className={styles.groupLabel}>{group.label}</span>
          <div className={styles.chips}>
            <button
              type="button"
              className={`tag tag-clickable ${styles.chip} ${group.selected === null ? styles.active : ""}`}
              onClick={() => onChange(group.key, null)}
            >
              All
            </button>
            {group.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`tag tag-clickable ${styles.chip} ${group.selected === opt.value ? styles.active : ""}`}
                onClick={() =>
                  onChange(group.key, group.selected === opt.value ? null : opt.value)
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {typeof resultCount === "number" && (
        <div className={styles.count}>
          <span className={styles.countLabel}>RESULTS</span>
          <span className={styles.countValue}>{resultCount}</span>
        </div>
      )}
    </div>
  );
}
