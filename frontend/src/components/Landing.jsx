import { useState, useRef, useCallback } from 'react'

const API = 'http://localhost:8000'

export default function Landing({ onUploadSuccess, onOpenAuth, onOpenDemo }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    setError('')
    if (!file) return

    // Client-side validation
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pptx', 'ppt'].includes(ext)) {
      setError('Please upload a .pptx or .ppt file.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50 MB.')
      return
    }
    if (file.size === 0) {
      setError('File is empty.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Upload failed.')
        return
      }
      onUploadSuccess({
        sessionId: data.session_id,
        pdfUrl: `${API}${data.pdf_url}`,
        filename: data.filename,
      })
    } catch (e) {
      if (e instanceof TypeError && e.message.includes('fetch')) {
        setError('Cannot reach the backend. Make sure the Python server is running on port 8000.')
      } else {
        setError(`Upload error: ${e.message}`)
      }
    } finally {
      setUploading(false)
    }
  }, [onUploadSuccess])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  return (
    <main className="landing">
      <div className="landing-hero">
        <h1>Present with Your Hands ✋</h1>
        <p>Upload a PowerPoint, then control your slides hands-free using real-time webcam gesture recognition.</p>
      </div>

      <div className="features-grid">
        {[
          { icon: '📂', title: 'Upload PPTX', desc: 'Drag & drop or browse' },
          { icon: '🖥️', title: 'View Slides', desc: 'Rendered in-browser' },
          { icon: '🤚', title: 'Hand Gestures', desc: 'MediaPipe tracking' },
          { icon: '🔒', title: 'Safe Controls', desc: 'Hold-to-confirm system' },
        ].map(f => (
          <div key={f.title} className="feature-card">
            <div className="icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <label
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="upload-icon">📎</div>
        <h2>Drop your presentation here</h2>
        <p>Supports .pptx and .ppt &nbsp;·&nbsp; Max 50 MB</p>
        <button
          className="btn btn-primary btn-lg"
          onClick={(e) => { e.preventDefault(); inputRef.current?.click() }}
          disabled={uploading}
        >
          {uploading ? '⏳ Converting…' : '📂 Browse File'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pptx,.ppt"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </label>

      {uploading && (
        <div className="progress-bar" style={{ maxWidth: 520 }}>
          <div className="progress-bar-fill" style={{ width: '100%' }} />
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ maxWidth: 520 }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div style={{ marginTop: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenDemo || onOpenAuth}
          style={{ borderColor: 'rgba(108, 99, 255, 0.4)', padding: '0.65rem 1.25rem' }}
        >
          🚀 No PPTX handy? Try the Demo Presentation & Gestures
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Instant access with preloaded slides & webcam hand tracking
        </span>
      </div>
    </main>
  )
}
