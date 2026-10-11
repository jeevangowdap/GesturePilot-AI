import { GESTURE_ACTIONS } from '../gestures/gestureEngine'

export default function GestureStatus({ gestureState, locked }) {
  const { name, confidence, holdProgress } = gestureState
  const info = GESTURE_ACTIONS[name]

  return (
    <div className="gesture-status">
      <div className="gesture-name">
        {info ? `${info.emoji} ${info.label}` : (name ? name : '—')}
      </div>

      <div className="gesture-confidence-bar">
        <div className="gesture-confidence-fill" style={{ width: `${confidence * 100}%` }} />
      </div>

      <div className="gesture-hold-bar">
        <div className="gesture-hold-fill" style={{ width: `${holdProgress * 100}%` }} />
      </div>

      <div className="gesture-labels">
        <span>Confidence</span>
        <span>Hold progress</span>
      </div>

      <div className={`lock-badge${locked ? ' locked' : ''}`}>
        {locked ? '🔒 Gestures LOCKED (show fist to unlock)' : '🔓 Gestures ACTIVE'}
      </div>
    </div>
  )
}
