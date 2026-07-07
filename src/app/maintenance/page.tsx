import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HRReply — Under Maintenance',
}

export default function MaintenancePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
        .maint-body {
          font-family: 'Manrope', system-ui, sans-serif;
          background: #0f0f1a;
          color: #e8e8e8;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          margin: 0;
        }
        .maint-card {
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        .maint-logo {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: #c8f135;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 28px;
        }
        .maint-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(200,241,53,0.12);
          border: 1px solid rgba(200,241,53,0.25);
          color: #c8f135;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 20px;
        }
        .maint-dot {
          width: 6px;
          height: 6px;
          background: #c8f135;
          border-radius: 50%;
          animation: maint-pulse 2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes maint-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .maint-h1 {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 12px;
        }
        .maint-p {
          font-size: 15px;
          color: rgba(232,232,232,0.6);
          line-height: 1.65;
          margin: 0 0 32px;
        }
        .maint-divider {
          width: 40px;
          height: 3px;
          background: #c8f135;
          border-radius: 2px;
          margin: 0 auto 32px;
        }
        .maint-checklist {
          list-style: none;
          text-align: left;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
          margin: 0 0 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .maint-checklist li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(232,232,232,0.75);
        }
        .maint-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(200,241,53,0.15);
          border: 1px solid rgba(200,241,53,0.3);
          color: #c8f135;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-weight: 700;
        }
        .maint-footer {
          font-size: 12px;
          color: rgba(232,232,232,0.3);
        }
        .maint-footer a {
          color: rgba(200,241,53,0.7);
          text-decoration: none;
        }
        .maint-footer a:hover { color: #c8f135; }
      `}</style>
      <div className="maint-body">
        <div className="maint-card">
          <div className="maint-logo">⚡</div>
          <div className="maint-badge">
            <span className="maint-dot" />
            Upgrading systems
          </div>
          <h1 className="maint-h1">We&apos;re making HRReply better</h1>
          <p className="maint-p">
            Our team is deploying major improvements including new AI features,
            a communication health dashboard, and smarter message tools.
            We&apos;ll be back shortly.
          </p>
          <div className="maint-divider" />
          <ul className="maint-checklist">
            <li><span className="maint-check">✓</span>AI-powered thread analysis</li>
            <li><span className="maint-check">✓</span>Scenario-based message builder</li>
            <li><span className="maint-check">✓</span>A/B message testing</li>
            <li><span className="maint-check">✓</span>Communication health dashboard</li>
            <li><span className="maint-check">✓</span>Candidate FAQ auto-reply</li>
          </ul>
          <p className="maint-footer">
            Questions? Email us at{' '}
            <a href="mailto:support@hrreply.in">support@hrreply.in</a>
          </p>
        </div>
      </div>
    </>
  )
}
