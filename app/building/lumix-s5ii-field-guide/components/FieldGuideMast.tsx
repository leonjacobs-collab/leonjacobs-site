import styles from "./FieldGuideMast.module.css";

export function FieldGuideMast() {
  return (
    <header className={styles.mast}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <span className={styles.modelCode}>LUMIX S5II</span>
          <span className={styles.subtitle}>FIELD GUIDE</span>
        </div>
        <div className={styles.specs}>
          <div className={styles.spec}>
            <span className={styles.specLabel}>MODEL</span>
            <span className={styles.specValue}>DC-S5M2</span>
          </div>
          <div className={styles.spec}>
            <span className={styles.specLabel}>MOUNT</span>
            <span className={styles.specValue}>L-MOUNT</span>
          </div>
          <div className={styles.spec}>
            <span className={styles.specLabel}>SENSOR</span>
            <span className={styles.specValue}>24.2MP CMOS</span>
          </div>
          <div className={styles.spec}>
            <span className={styles.specLabel}>BUILD</span>
            <span className={styles.specValue}>0.1.0</span>
          </div>
        </div>
        <hr className={styles.rule} />
      </div>
    </header>
  );
}
