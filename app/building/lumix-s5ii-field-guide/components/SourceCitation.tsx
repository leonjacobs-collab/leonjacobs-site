import type { Source } from "@/lib/field-guide/schemas";
import { formatSource } from "@/lib/field-guide/citation";
import styles from "./SourceCitation.module.css";

interface SourceCitationProps {
  sources: Source[];
  /** Optional heading override */
  heading?: string;
}

/**
 * Renders the full source list at the bottom of a content card
 * or detail view. Each source gets a small badge showing its type
 * (official / creator / community / firsthand) plus the formatted
 * name and reference.
 *
 * For inline citations within body markdown, use the footnote
 * syntax — that's handled by the markdown renderer, not this
 * component.
 */
export function SourceCitation({ sources, heading = "SOURCES" }: SourceCitationProps) {
  if (sources.length === 0) return null;
  return (
    <aside className={styles.wrapper}>
      <div className={styles.heading}>{heading}</div>
      <ul className={styles.list}>
        {sources.map((source) => (
          <li key={source.key} className={styles.item}>
            <span className={`${styles.typeBadge} ${styles[`type-${source.type}`]}`}>
              {source.type}
            </span>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {formatSource(source)}
              </a>
            ) : (
              <span>{formatSource(source)}</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
