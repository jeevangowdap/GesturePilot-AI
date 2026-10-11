import { useEffect, useRef, useState, useCallback } from 'react'
import { classifyGesture, GESTURE_ACTIONS, LOCKED_FIST_ACTION } from '../gestures/gestureEngine'

// Safety constants
const HOLD_MS      = 600   // ms gesture must be held before triggering
const COOLDOWN_MS  = 900   // ms before same gesture can fire again
const NEUTRAL_WAIT = 300   // ms of NEUTRAL needed to re-arm

// Connection colors for landmark drawing
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],         // thumb
  [0,5],[5,6],[6,7],[7,8],         // index
  [0,9],[9,10],[10,11],[11,12],    // middle
  [0,13],[13,14],[14,15],[15,16],  // ring
  [0,17],[17,18],[18,19],[19,20],  // pinky
  [5,9],[9,13],[13,17],            // palm
]

export default function WebcamPanel({ onGestureState, onGestureAction, onLockToggle, locked }) {
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const rafRef       = useRef(null)
  const handsRef     = useRef(null)
  const streamRef    = useRef(null)

  // Gesture state machine refs
  const holdTimerRef    = useRef(null)
  const holdStartRef    = useRef(null)
  const lastGestureRef  = useRef(null)
  const cooldownRef     = useRef({})      // { [gesture]: timestamp }
  const neutralTimerRef = useRef(null)
  const armedRef        = useRef(true)    // whether we can trigger
  const processFrameRef = useRef(null)

  const [camStatus, setCamStatus]   = useState('idle') // idle|requesting|active|denied|error
  const [mpError, setMpError]       = useState('')
  const [loadingMP, setLoadingMP]   = useState(false)

  // ── Draw landmarks ────────────────────────────────────────────────────────
  const drawLandmarks = useCallback((results) => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!results?.landmarks?.length) return

    for (const hand of results.landmarks) {
      // Draw connections
      ctx.strokeStyle = 'rgba(108,99,255,0.8)'
      ctx.lineWidth = 2
      for (const [a, b] of HAND_CONNECTIONS) {
        const pa = hand[a], pb = hand[b]
        ctx.beginPath()
        ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height)
        ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height)
        ctx.stroke()
      }

      // Draw keypoints
      for (const pt of hand) {
        const x = pt.x * canvas.width
        const y = pt.y * canvas.height
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(34,211,238,0.9)'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }, [])

  // ── Process a frame ──────────────────────────────────────────────────────
  const processFrame = useCallback(() => {
    const hands = handsRef.current
    const video = videoRef.current
    if (!hands || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => processFrameRef.current?.())
      return
    }

    let results
    try {
      results = hands.detectForVideo(video, performance.now())
    } catch {
      rafRef.current = requestAnimationFrame(() => processFrameRef.current?.())
      return
    }

    drawLandmarks(results)

    // Classify first visible hand
    let gestureName = null
    let confidence = 0

    if (results?.landmarks?.length) {
      gestureName = classifyGesture(results.landmarks[0])
      confidence = gestureName ? 0.85 : 0
    }

    // ── State machine ────────────────────────────────────────────────────
    const now = Date.now()

    if (!gestureName) {
      // Neutral pose
      if (lastGestureRef.current !== null) {
        lastGestureRef.current = null
        clearTimeout(holdTimerRef.current)
        holdStartRef.current = null
        // Start neutral timer for re-arming
        clearTimeout(neutralTimerRef.current)
        neutralTimerRef.current = setTimeout(() => { armedRef.current = true }, NEUTRAL_WAIT)
      }
      onGestureState({ name: '', confidence: 0, holdProgress: 0 })
      rafRef.current = requestAnimationFrame(() => processFrameRef.current?.())
      return
    }

    // Gesture detected
    const holdStart = holdStartRef.current

    if (lastGestureRef.current !== gestureName) {
      // New gesture started
      lastGestureRef.current = gestureName
      holdStartRef.current = now
      clearTimeout(holdTimerRef.current)
    }

    const elapsed  = holdStart ? now - holdStart : 0
    const progress = Math.min(elapsed / HOLD_MS, 1)

    onGestureState({ name: gestureName, confidence, holdProgress: progress })

    // Check if held long enough and armed
    if (progress >= 1 && armedRef.current) {
      const cooldownUntil = cooldownRef.current[gestureName] || 0
      if (now >= cooldownUntil) {
        // Fire action!
        const info = GESTURE_ACTIONS[gestureName]
        if (info) {
          armedRef.current = false
          cooldownRef.current[gestureName] = now + COOLDOWN_MS

          // Handle lock/unlock separately
          if (gestureName === 'FIST') {
            onLockToggle(locked ? LOCKED_FIST_ACTION : 'LOCK')
          } else if (info.action && !locked) {
            onGestureAction(info.action)
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(() => processFrameRef.current?.())
  }, [drawLandmarks, onGestureState, onGestureAction, onLockToggle, locked])

  // Keep ref up to date
  useEffect(() => {
    processFrameRef.current = processFrame
  }, [processFrame])

  // ── Load MediaPipe + start camera ────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamStatus('requesting')
    setMpError('')
    setLoadingMP(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamStatus('error')
      setMpError('Camera access requires HTTPS or localhost.')
      setLoadingMP(false)
      return
    }

    // Get webcam stream
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await new Promise((res) => { video.onloadedmetadata = res })
        video.play()
      }
      setCamStatus('active')
    } catch (e) {
      setCamStatus(e.name === 'NotAllowedError' ? 'denied' : 'error')
      setLoadingMP(false)
      return
    }

    // Dynamically load MediaPipe Tasks Vision
    try {
      const { HandLandmarker, FilesetResolver } = await import(
        /* webpackIgnore: true */
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs'
      )

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      )

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode:        'VIDEO',
        numHands:           1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence:  0.6,
        minTrackingConfidence:      0.5,
      })

      handsRef.current = handLandmarker
      setLoadingMP(false)
      rafRef.current = requestAnimationFrame(() => processFrameRef.current?.())
    } catch (e) {
      setMpError(`MediaPipe load error: ${e.message}. Check your network connection.`)
      setLoadingMP(false)
    }
  }, [])

  // Restart processFrame loop when locked changes (so closure updates)
  useEffect(() => {
    if (camStatus === 'active' && handsRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => processFrameRef.current?.())
    }
  }, [locked, camStatus, processFrame])

  // Cleanup on unmount
  useEffect(() => {
    const holdTimer = holdTimerRef.current
    const neutralTimer = neutralTimerRef.current
    const stream = streamRef.current
    const hands = handsRef.current
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(holdTimer)
      clearTimeout(neutralTimer)
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
      if (hands) {
        try { hands.close() } catch { /* ignore */ }
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    handsRef.current = null
    setCamStatus('idle')
    setLoadingMP(false)
    onGestureState({ name: '', confidence: 0, holdProgress: 0 })
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }, [onGestureState])

  return (
    <div className="webcam-panel">
      <div className="panel-header">
        <span className="panel-title">📷 Webcam</span>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {camStatus === 'active'
            ? <button className="btn btn-danger btn-sm" onClick={stopCamera}>Stop</button>
            : <button className="btn btn-primary btn-sm" onClick={startCamera} disabled={loadingMP}>
                {loadingMP ? '⏳ Loading…' : '▶ Start'}
              </button>
          }
        </div>
      </div>

      <div className="webcam-container">
        <video
          ref={videoRef}
          className="webcam-video"
          playsInline
          muted
          style={{ display: camStatus === 'active' ? 'block' : 'none' }}
        />
        <canvas ref={canvasRef} className="landmark-canvas" />

        {camStatus === 'idle' && (
          <div className="webcam-placeholder">
            <span className="icon">📷</span>
            <p>Click Start to enable webcam and gesture control</p>
          </div>
        )}
        {camStatus === 'requesting' && (
          <div className="webcam-placeholder">
            <div className="spinner" />
            <p>Requesting camera permission…</p>
          </div>
        )}
        {loadingMP && camStatus === 'active' && (
          <div className="webcam-placeholder" style={{ background: 'rgba(0,0,0,.6)', position: 'absolute', inset: 0 }}>
            <div className="spinner" />
            <p>Loading MediaPipe model…</p>
          </div>
        )}
        {camStatus === 'denied' && (
          <div className="webcam-placeholder">
            <span className="icon">🚫</span>
            <p>Camera permission denied. Please allow access in browser settings and try again.</p>
            <button className="btn btn-secondary btn-sm" onClick={startCamera}>Retry</button>
          </div>
        )}
        {camStatus === 'error' && (
          <div className="webcam-placeholder">
            <span className="icon">⚠️</span>
            <p>Could not access camera. Check that no other app is using it.</p>
            <button className="btn btn-secondary btn-sm" onClick={startCamera}>Retry</button>
          </div>
        )}
        {mpError && (
          <div className="webcam-placeholder" style={{ background: 'rgba(0,0,0,.7)', position: 'absolute', inset: 0, padding: '1rem' }}>
            <span className="icon">⚠️</span>
            <p style={{ fontSize: '.75rem', color: '#fca5a5' }}>{mpError}</p>
            <button className="btn btn-secondary btn-sm" onClick={() => { setMpError(''); startCamera() }}>Retry</button>
          </div>
        )}
      </div>
    </div>
  )
}
