/**
 * Gesture recognition engine using MediaPipe Hands (Tasks Vision).
 * All processing is done in the browser — no video is uploaded.
 *
 * Recognized gestures:
 *   OPEN_PALM   → Next slide
 *   V_SIGN      → Previous slide
 *   THUMBS_UP   → Start / Toggle presentation mode
 *   INDEX_ONLY  → Toggle black screen
 *   FIST        → Lock / Unlock gesture controls
 */

// ─── Landmark indices ────────────────────────────────────────────────────────
const THUMB_TIP     = 4
const INDEX_TIP     = 8
const INDEX_PIP     = 6
const MIDDLE_TIP    = 12
const MIDDLE_PIP    = 10
const RING_TIP      = 16
const RING_PIP      = 14
const PINKY_TIP     = 20
const PINKY_PIP     = 18

/** Returns true if landmark tip is above (lower y value) its pip joint */
function fingerExtended(lm, tip, pip) {
  return lm[tip].y < lm[pip].y
}

/**
 * Classify a single hand's normalized landmarks into a gesture name.
 * Returns null if gesture is ambiguous / not recognized.
 */
export function classifyGesture(landmarks) {
  const lm = landmarks

  const indexUp  = fingerExtended(lm, INDEX_TIP,  INDEX_PIP)
  const middleUp = fingerExtended(lm, MIDDLE_TIP, MIDDLE_PIP)
  const ringUp   = fingerExtended(lm, RING_TIP,   RING_PIP)
  const pinkyUp  = fingerExtended(lm, PINKY_TIP,  PINKY_PIP)

  // Thumb: compare tip y to MCP knuckle y (landmark 2)
  const thumbUp = lm[THUMB_TIP].y < lm[2].y

  // FIST — all fingers and thumb curled
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) return 'FIST'

  // OPEN_PALM — all 4 fingers extended
  if (indexUp && middleUp && ringUp && pinkyUp) return 'OPEN_PALM'

  // V_SIGN — index + middle up, rest curled
  if (indexUp && middleUp && !ringUp && !pinkyUp) return 'V_SIGN'

  // THUMBS_UP — only thumb up, four fingers curled
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp) return 'THUMBS_UP'

  // INDEX_ONLY — only index finger up, middle/ring/pinky curled
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return 'INDEX_ONLY'

  return null
}

// ─── Gesture-to-action mapping ───────────────────────────────────────────────
export const GESTURE_ACTIONS = {
  OPEN_PALM:  { action: 'NEXT',           label: 'Open Palm',    emoji: '🖐️' },
  V_SIGN:     { action: 'PREV',           label: 'V Sign',       emoji: '✌️' },
  THUMBS_UP:  { action: 'TOGGLE_PRESENT', label: 'Thumbs Up',    emoji: '👍' },
  INDEX_ONLY: { action: 'TOGGLE_BLACK',   label: 'Index Only',   emoji: '☝️' },
  FIST:       { action: 'LOCK',           label: 'Fist',         emoji: '✊' },
}

// When locked, FIST should UNLOCK
export const LOCKED_FIST_ACTION = 'UNLOCK'
