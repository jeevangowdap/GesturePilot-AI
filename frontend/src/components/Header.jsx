export default function Header({
  hasSession,
  onClose,
  currentView,
  onOpenAuth,
  onBackToLanding,
  session,
}) {
  return (
    <header className="header">
      <div
        className="header-brand"
        onClick={() => {
          if (!hasSession && onBackToLanding) onBackToLanding()
        }}
        style={{ cursor: !hasSession ? 'pointer' : 'default' }}
        title="GesturePilot AI"
      >
        <span className="header-logo">🖐️</span>
        <span className="header-title">GesturePilot AI</span>
        <span className="header-badge">MVP</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {hasSession ? (
          <>
            {session?.email && (
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '99px',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>👤</span>
                <span>{session.email}</span>
                {session.demo && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: 'rgba(108, 99, 255, 0.25)',
                      color: 'var(--brand-secondary)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    DEMO
                  </span>
                )}
              </span>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              title="Upload another presentation"
            >
              ← New Presentation
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ color: 'var(--text-secondary)' }}
              title="Sign out of current presentation"
            >
              Log Out
            </button>
          </>
        ) : currentView === 'auth' ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onBackToLanding}
          >
            ← Back to Upload
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenAuth}
            style={{ fontWeight: 600 }}
          >
            Sign In / Demo
          </button>
        )}

        <div className="header-status">
          <span className="status-dot online" />
          <span>Hand-Gesture Mode</span>
        </div>
      </div>
    </header>
  )
}
