import type { Gem, Source, Conflict } from "@/lib/field-guide/schemas";
import { ConflictBadge } from "./ConflictBadge";
import styles from "./GemCard.module.css";

interface GemCardProps {
  gem: Gem;
  /** Body markdown — currently rendered as plain text in the summary view */
  body?: string;
}

/**
 * Card representation of a hidden gem in the browser grid.
 *
 * Shows: instrument-style code/title, the menu path, the
 * "why it matters" summary, the difficulty + applies-to badges,
 * tags, and the conflict badge if any sources disagree.
 *
 * Click handling and routing to a detail view is handled by the
 * parent page — this component is purely presentational.
 */
export function GemCard({ gem }: GemCardProps) {
  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.header}>
        <span className={styles.code}>GEM</span>
        <h3 className={styles.title}>{gem.title}</h3>
      </header>

      <div className={styles.menuPath}>
        <span className={styles.menuLabel}>PATH</span>
        <code className={styles.menuValue}>{gem.menu_path}</code>
      </div>

      <p className={styles.summary}>{gem.why_it_matters}</p>

      <dl className={styles.specs}>
        <div className={styles.spec}>
          <dt>FOR</dt>
          <dd>{gem.applies_to.toUpperCase()}</dd>
        </div>
        <div className={styles.spec}>
          <dt>LEVEL</dt>
          <dd>{gem.difficulty.toUpperCase()}</dd>
        </div>
        <div className={styles.spec}>
          <dt>DEPTH</dt>
          <dd>{"█".repeat(gem.menu_depth)}{"░".repeat(5 - gem.menu_depth)}</dd>
        </div>
      </dl>

      {gem.conflicts.length > 0 && (
        <ConflictBadge conflicts={gem.conflicts} sources={gem.sources} />
      )}

      {gem.tags.length > 0 && (
        <div className={styles.tags}>
          {gem.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
