import type { Lut } from "@/lib/field-guide/schemas";
import styles from "./LutCard.module.css";

interface LutCardProps {
  lut: Lut;
}

export function LutCard({ lut }: LutCardProps) {
  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.header}>
        <span className={styles.code}>LUT</span>
        <h3 className={styles.title}>{lut.title}</h3>
      </header>

      <p className={styles.creator}>
        by{" "}
        {lut.creator_url ? (
          <a
            href={lut.creator_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.creatorLink}
          >
            {lut.creator}
          </a>
        ) : (
          lut.creator
        )}
      </p>

      {lut.description && <p className={styles.description}>{lut.description}</p>}

      <dl className={styles.specs}>
        <div className={styles.spec}>
          <dt>LICENSE</dt>
          <dd>{lut.license.toUpperCase()}</dd>
        </div>
      </dl>

      {lut.built_for.length > 0 && (
        <div className={styles.builtFor}>
          {lut.built_for.map((profile) => (
            <span key={profile} className="tag">{profile}</span>
          ))}
        </div>
      )}

      {lut.look.length > 0 && (
        <div className={styles.look}>
          {lut.look.map((l) => (
            <span key={l} className="tag">{l}</span>
          ))}
        </div>
      )}

      <a
        href={lut.download_url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.download}
      >
        DOWNLOAD &rarr;
      </a>

      {lut.tags.length > 0 && (
        <div className={styles.tags}>
          {lut.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}
