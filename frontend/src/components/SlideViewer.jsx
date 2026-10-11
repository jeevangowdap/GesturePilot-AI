import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Point PDF.js to its worker bundled with pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function SlideViewer({
  pdfUrl,
  filename,
  currentPage,
  onTotalPages,
  blackScreen,
  onToggleBlack,
  onNext,
  onPrev,
}) {
  const canvasRef = useRef(null)
  const pdfRef = useRef(null)
  const renderTaskRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [totalPagesCount, setTotalPagesCount] = useState(0)
  const [error, setError] = useState('')

  // Load PDF document once
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const loadPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
          cMapPacked: true,
        }).promise
        if (cancelled) return
        pdfRef.current = pdf
        setTotalPagesCount(pdf.numPages)
        onTotalPages(pdf.numPages)
        setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setError(`Failed to load PDF: ${e.message}`)
          setLoading(false)
        }
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [pdfUrl, onTotalPages])

  // Render page whenever currentPage changes
  const renderPage = useCallback(async (pageNum) => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return

    // Cancel any in-flight render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch (_) {}
    }

    setPageLoading(true)
    try {
      const page = await pdf.getPage(pageNum)
      const container = canvas.parentElement
      if (!container) return

      const maxW = container.clientWidth  || 800
      const maxH = container.clientHeight || 600
      const viewport = page.getViewport({ scale: 1 })
      const scale = Math.min(maxW / viewport.width, maxH / viewport.height)
      const scaled = page.getViewport({ scale })

      const dpr = window.devicePixelRatio || 1
      canvas.width  = scaled.width  * dpr
      canvas.height = scaled.height * dpr
      canvas.style.width  = `${scaled.width}px`
      canvas.style.height = `${scaled.height}px`

      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)

      const task = page.render({ canvasContext: ctx, viewport: scaled })
      renderTaskRef.current = task
      await task.promise
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') {
        console.warn('Page render error:', e)
      }
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && pdfRef.current) {
      renderPage(currentPage)
    }
  }, [currentPage, loading, renderPage])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); onNext() }
      if (e.key === 'ArrowLeft')                    { e.preventDefault(); onPrev() }
      if (e.key === 'b' || e.key === 'B')           { e.preventDefault(); if (onToggleBlack) onToggleBlack() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNext, onPrev, onToggleBlack])

  if (error) {
    return (
      <div className="viewer-panel" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="alert alert-error" style={{ maxWidth: 450, flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <strong>{error}</strong>
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>
            Make sure the file was converted properly or try uploading again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="viewer-panel">
      <div className="viewer-toolbar">
        <span className="viewer-title" title={filename}>📑 {filename}</span>
        <div className="controls">
          <button className="btn btn-secondary btn-sm" onClick={onPrev} disabled={currentPage <= 1} title="Previous slide (✌️ V-Sign)">
            ◀ Prev
          </button>
          <span className="slide-counter">
            {currentPage} / {totalPagesCount || '…'}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onNext}
            disabled={!totalPagesCount || currentPage >= totalPagesCount}
            title="Next slide (🖐️ Open Palm)"
          >
            Next ▶
          </button>
        </div>
      </div>

      <div className="viewer-content">
        {loading ? (
          <div className="slide-loading">
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <div>Loading presentation slides…</div>
            </div>
          </div>
        ) : (
          <div className="pdf-canvas-wrapper">
            <canvas ref={canvasRef} className="pdf-canvas" />
            {pageLoading && (
              <div className="slide-loading">
                <div className="spinner" />
              </div>
            )}
            {blackScreen && (
              <div
                className="black-screen-overlay"
                onClick={onToggleBlack}
                style={{ cursor: 'pointer' }}
                title="Click or press B or point index finger to restore screen"
              >
                <span>⬛ Screen blanked — click, press B, or gesture ☝️ to restore</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
