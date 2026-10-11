const GESTURES = [
  { name: 'OPEN_PALM',  emoji: '🖐️', label: 'Open Palm',   action: 'Next slide' },
  { name: 'V_SIGN',     emoji: '✌️', label: 'V Sign',       action: 'Previous slide' },
  { name: 'THUMBS_UP',  emoji: '👍', label: 'Thumbs Up',    action: 'Start presentation' },
  { name: 'INDEX_ONLY', emoji: '☝️', label: 'Index Only',   action: 'Toggle black screen' },
  { name: 'FIST',       emoji: '✊', label: 'Fist',          action: 'Lock / Unlock' },
]

export default function GestureRef({ currentGesture }) {
  return (
    <div className="gesture-ref">
      <h3>Gesture Guide</h3>
      <div className="gesture-list">
        {GESTURES.map(g => (
          <div key={g.name} className={`gesture-item${currentGesture === g.name ? ' active' : ''}`}>
            <span className="emoji">{g.emoji}</span>
            <span className="gesture-label">{g.label}</span>
            <span className="gesture-action">{g.action}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', fontSize: '.73rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Safety system:</strong><br/>
        Hold gesture for ~600 ms to trigger.<br/>
        Drop hand to neutral to re-arm.<br/>
        Fist locks/unlocks gesture control.
      </div>
    </div>
  )
}
