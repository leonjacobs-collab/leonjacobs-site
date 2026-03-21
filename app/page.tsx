import styles from './about.module.css';
import AsciiAvatar from './components/AsciiAvatar';

export default function Home() {
  return (
    <main className={styles.page}>

      <h1 className={styles.heading}>
        Just Who Is This{' '}
        Leon Jacobs Guy?
      </h1>

      <div className={styles.card}>

        {/* Avatar */}
        <div className={styles.avatar}>
          <AsciiAvatar />
        </div>

        {/* Bio */}
        <div className={styles.bio}>
          <p className={styles.bioName}>Leon Jacobs</p>

          <p className={styles.bioTitles}>
            Professional Overthinker, Vice-President of the Dumb Question Asker
            Club, First of His Name in the Kingdom of Tangents, Skeptical
            Believer in the Algorithm, Robot Wrangler of Wayward Intelligence,
            Arranger of Letters in a Satisfying Order, Patron Saint of Shifting
            Deadlines, and Defender of the Idea.
          </p>

          <p className={styles.bioRole}>
            <span className={styles.bioRoleAmpersand}>&amp;</span>{' '}
            Creative &amp; Experience Director at Empathy Lab
          </p>
        </div>
      </div>

      {/* Footer: socials + CTA */}
      <div className={styles.footer}>
        <div className={styles.socials}>
          <a className={styles.socialIcon} href="#" aria-label="LinkedIn" title="LinkedIn">in</a>
          <a className={styles.socialIcon} href="#" aria-label="Medium" title="Medium">M</a>
          <a className={styles.socialIcon} href="#" aria-label="Links" title="Links">&lt;/&gt;</a>
          <a className={styles.socialIcon} href="#" aria-label="Instagram" title="Instagram">@</a>
        </div>

        <a href="/scramble" className={styles.cta}>Learn more</a>
      </div>

      <hr className={styles.divider} />
    </main>
  );
}
