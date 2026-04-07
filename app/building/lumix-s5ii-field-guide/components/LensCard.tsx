"use client";

import type { Lens } from "@/lib/field-guide/schemas";
import styles from "./LensCard.module.css";

interface LensCardProps {
  lens: Lens;
  owned: boolean;
  onToggleOwned: (id: string) => void;
}

function formatFocal(lens: Lens): string {
  const [min, max] = lens.focal_length;
  return min === max ? `${min}mm` : `${min}–${max}mm`;
}

function formatAperture(lens: Lens): string {
  const [wide, narrow] = lens.aperture;
  return wide === narrow ? `f/${wide}` : `f/${wide}–${narrow}`;
}

export function LensCard({ lens, owned, onToggleOwned }: LensCardProps) {
  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.header}>
        <span className={styles.code}>LNS</span>
        <h3 className={styles.title}>{lens.name}</h3>
      </header>

      <p className={styles.brand}>{lens.brand}</p>

      <dl className={styles.specs}>
        <div className={styles.spec}>
          <dt>FOCAL</dt>
          <dd>{formatFocal(lens)}</dd>
        </div>
        <div className={styles.spec}>
          <dt>APERTURE</dt>
          <dd>{formatAperture(lens)}</dd>
        </div>
        <div className={styles.spec}>
          <dt>TYPE</dt>
          <dd>{lens.type.toUpperCase()}</dd>
        </div>
        <div className={styles.spec}>
          <dt>CLASS</dt>
          <dd>{lens.category.toUpperCase()}</dd>
        </div>
        {lens.weight_g != null && (
          <div className={styles.spec}>
            <dt>WEIGHT</dt>
            <dd>{lens.weight_g}g</dd>
          </div>
        )}
      </dl>

      {lens.notes && <p className={styles.notes}>{lens.notes}</p>}

      <button
        type="button"
        className={`${styles.ownedToggle} ${owned ? styles.owned : ""}`}
        onClick={() => onToggleOwned(lens.id)}
      >
        {owned ? "✓ I OWN THIS" : "+ ADD TO MY KIT"}
      </button>
    </article>
  );
}
