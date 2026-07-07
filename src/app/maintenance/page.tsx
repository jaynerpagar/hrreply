import type { Metadata } from 'next'
import styles from './maintenance.module.css'

export const metadata: Metadata = {
  title: 'HRReply — Under Maintenance',
}

export default function MaintenancePage() {
  return (
    <div className={styles.body}>
      <div className={styles.card}>
        <div className={styles.logo}>⚡</div>
        <div className={styles.badge}>
          <span className={styles.dot} />
          Upgrading systems
        </div>
        <h1 className={styles.h1}>We&apos;re making HRReply better</h1>
        <p className={styles.p}>
          Our team is deploying major improvements including new AI features,
          a communication health dashboard, and smarter message tools.
          We&apos;ll be back shortly.
        </p>
        <div className={styles.divider} />
        <ul className={styles.checklist}>
          <li><span className={styles.check}>✓</span>AI-powered thread analysis</li>
          <li><span className={styles.check}>✓</span>Scenario-based message builder</li>
          <li><span className={styles.check}>✓</span>A/B message testing</li>
          <li><span className={styles.check}>✓</span>Communication health dashboard</li>
          <li><span className={styles.check}>✓</span>Candidate FAQ auto-reply</li>
        </ul>
        <p className={styles.footer}>
          Questions? Email us at{' '}
          <a href="mailto:support@hrreply.in">support@hrreply.in</a>
        </p>
      </div>
    </div>
  )
}
