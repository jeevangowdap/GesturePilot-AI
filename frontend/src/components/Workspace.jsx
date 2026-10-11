import { useState, useCallback, useRef } from 'react'
import SlideViewer from './SlideViewer'
import PdfDocument from './PdfDocument'
import WebcamPanel from './WebcamPanel'
import GestureStatus from './GestureStatus'
import GestureRef from './GestureRef'
import Toast from './Toast'

export default function Workspace({ session }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [blackScreen, setBlackScreen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [gestureState, setGestureState] = useState({ name: '', confidence: 0, holdProgress: 0 })
  const [locked, setLocked] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const addToast = useCallback((msg, type = 'info') => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200)
  }, [])

  const goNext = useCallback(() => {
    setCurrentPage(p => {
      if (p < totalPages) { addToast('▶ Next slide', 'next'); return p + 1 }
      return p
    })
  }, [totalPages, addToast])

  const goPrev = useCallback(() => {
    setCurrentPage(p => {
      if (p > 1) { addToast('◀ Previous slide', 'prev'); return p - 1 }
      return p
    })
  }, [addToast])

  const togglePresentation = useCallback(() => {
    setPresenting(p => {
      const next = !p
      addToast(next ? '▶ Presentation mode active' : '⏹ Stopped presentation mode', next ? 'next' : 'info')
      return next
    })
  }, [addToast])

  const toggleBlackScreen = useCallback(() => {
    setBlackScreen(b => {
      const next = !b
      addToast(next ? '⬛ Black screen enabled' : '💡 Screen restored', 'info')
      return next
    })
  }, [addToast])

  const handleGestureAction = useCallback((action) => {
    if (locked) return
    switch (action) {
      case 'NEXT':
        goNext()
        break
      case 'PREV':
        goPrev()
        break
      case 'TOGGLE_PRESENT':
        togglePresentation()
        break
      case 'TOGGLE_BLACK':
        toggleBlackScreen()
        break
      case 'LOCK':
        setLocked(true)
        addToast('🔒 Gestures locked', 'locked')
        break
      case 'UNLOCK':
        setLocked(false)
        addToast('🔓 Gestures unlocked', 'unlocked')
        break
      default:
        break
    }
  }, [locked, goNext, goPrev, togglePresentation, toggleBlackScreen, addToast])

  const handleLockToggleGesture = useCallback((action) => {
    // Lock/unlock bypass locked state
    if (action === 'LOCK') {
      setLocked(true)
      addToast('🔒 Gestures locked', 'locked')
    } else if (action === 'UNLOCK') {
      setLocked(false)
      addToast('🔓 Gestures unlocked', 'unlocked')
    }
  }, [addToast])

  return (
    <>
      <div className="workspace">
        <SlideViewer
          pdfUrl={session.pdfUrl}
          filename={session.filename}
          currentPage={currentPage}
          onTotalPages={setTotalPages}
          blackScreen={blackScreen}
          onToggleBlack={toggleBlackScreen}
          onNext={goNext}
          onPrev={goPrev}
        />

        <div className="right-panel">
          <WebcamPanel
            onGestureState={setGestureState}
            onGestureAction={handleGestureAction}
            onLockToggle={handleLockToggleGesture}
            locked={locked}
          />
          <GestureStatus gestureState={gestureState} locked={locked} />
          <GestureRef currentGesture={gestureState.name} />
        </div>

        <div className="action-bar">
          <button
            className="btn btn-secondary btn-sm"
            onClick={goPrev}
            disabled={currentPage <= 1}
            title="Go to previous slide"
          >
            ◀ Prev
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={goNext}
            disabled={totalPages > 0 && currentPage >= totalPages}
            title="Go to next slide"
          >
            Next ▶
          </button>

          <button
            className={`btn btn-sm ${presenting ? 'btn-danger' : 'btn-primary'}`}
            onClick={togglePresentation}
            title="Toggle presentation mode"
          >
            {presenting ? '⏹ Stop Presenting' : '▶ Start Presentation'}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={toggleBlackScreen}
            title="Toggle black screen blanking"
          >
            {blackScreen ? '💡 Restore Screen' : '⬛ Black Screen'}
          </button>

          <div className="action-bar-divider" />

          {presenting && (
            <div className="presentation-mode-indicator">
              🎤 Presenting · <span className="kbd">←</span> <span className="kbd">→</span> arrows & gestures active
            </div>
          )}

          <span
            style={{
              fontSize: '.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'rgba(255,255,255,0.06)',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
            }}
          >
            Slide {currentPage} / {totalPages || '?'}
          </span>
        </div>
      </div>

      <Toast toasts={toasts} />
    </>
  )
}
