import type { Scene } from "@/lib/field-guide/schemas";
import { ConflictBadge } from "./ConflictBadge";
import styles from "./SceneCard.module.css";

interface SceneCardProps {
  scene: Scene;
}

export function SceneCard({ scene }: SceneCardProps) {
  const { exposure, autofocus } = scene;

  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.header}>
        <span className={styles.code}>SCN</span>
        <h3 className={styles.title}>{scene.title}</h3>
      </header>

      <p className={styles.summary}>{scene.summary}</p>

      <dl className={styles.specs}>
        <div className={styles.spec}>
          <dt>FOR</dt>
          <dd>{scene.applies_to.toUpperCase()}</dd>
        </div>
        <div className={styles.spec}>
          <dt>LEVEL</dt>
          <dd>{scene.difficulty.toUpperCase()}</dd>
        </div>
        <div className={styles.spec}>
          <dt>TYPE</dt>
          <dd>{scene.scene_category.toUpperCase()}</dd>
        </div>
      </dl>

      <div className={styles.exposure}>
        <span className={styles.exposureLabel}>EXPOSURE</span>
        <div className={styles.exposureRow}>
          {exposure.iso_min != null && (
            <div className={styles.exposureItem}>
              <span className={styles.exposureKey}>ISO</span>
              <span className={styles.exposureVal}>
                {exposure.iso_min}{exposure.iso_max ? `–${exposure.iso_max}` : ""}
              </span>
            </div>
          )}
          {exposure.shutter_min && (
            <div className={styles.exposureItem}>
              <span className={styles.exposureKey}>SHUTTER</span>
              <span className={styles.exposureVal}>
                {exposure.shutter_min}{exposure.shutter_max ? `–${exposure.shutter_max}` : ""}
              </span>
            </div>
          )}
          {exposure.aperture_pref && (
            <div className={styles.exposureItem}>
              <span className={styles.exposureKey}>APERTURE</span>
              <span className={styles.exposureVal}>{exposure.aperture_pref.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.af}>
        <span className={styles.afLabel}>AUTOFOCUS</span>
        <div className={styles.afRow}>
          <div className={styles.afItem}>
            <span className={styles.afKey}>MODE</span>
            <span className={styles.afVal}>{autofocus.focus_mode}</span>
          </div>
          <div className={styles.afItem}>
            <span className={styles.afKey}>AREA</span>
            <span className={styles.afVal}>{autofocus.af_area}</span>
          </div>
          {autofocus.detection && (
            <div className={styles.afItem}>
              <span className={styles.afKey}>DETECT</span>
              <span className={styles.afVal}>{autofocus.detection.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      {scene.warnings.length > 0 && (
        <div className={styles.warnings}>
          <span className={styles.warningLabel}>WATCH OUT</span>
          {scene.warnings.map((w, i) => (
            <p key={i} className={styles.warningItem}>{w}</p>
          ))}
        </div>
      )}

      {scene.recommended_lens_categories.length > 0 && (
        <div className={styles.lensCategories}>
          {scene.recommended_lens_categories.map((cat) => (
            <span key={cat} className="tag">{cat}</span>
          ))}
        </div>
      )}

      {scene.conflicts.length > 0 && (
        <ConflictBadge conflicts={scene.conflicts} sources={scene.sources} />
      )}

      {scene.tags.length > 0 && (
        <div className={styles.tags}>
          {scene.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}
