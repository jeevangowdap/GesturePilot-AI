import { useState, useEffect } from 'react'

export default function AuthPage({ onLoginSuccess, onBackToLanding }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('gesturepilot_remember_email') || ''
    } catch {
      return ''
    }
  })
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return !!localStorage.getItem('gesturepilot_remember_email')
    } catch {
      return false
    }
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState({})
  const [authNotice, setAuthNotice] = useState('')

  // Interactive visual state
  const [visualSlide, setVisualSlide] = useState(2)
  const [visualGesture, setVisualGesture] = useState('OPEN_PALM') // 'OPEN_PALM' | 'V_SIGN' | 'FIST'
  const [visualLocked, setVisualLocked] = useState(false)

  // Interactive visual gesture click handler
  const handleSelectVisualGesture = (g) => {
    setVisualGesture(g)
    if (g === 'OPEN_PALM') {
      setVisualLocked(false)
      setVisualSlide(prev => (prev < 4 ? prev + 1 : 1))
    } else if (g === 'V_SIGN') {
      setVisualLocked(false)
      setVisualSlide(prev => (prev > 1 ? prev - 1 : 4))
    } else if (g === 'FIST') {
      setVisualLocked(prev => !prev)
    }
  }

  // Auto-cycle visual demo every 4 seconds if idle
  useEffect(() => {
    const timer = setInterval(() => {
      setVisualSlide(prev => (prev < 4 ? prev + 1 : 1))
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const validate = () => {
    const errs = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim()) {
      errs.email = 'Email address is required.'
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.'
    }

    if (mode !== 'forgot') {
      if (!password) {
        errs.password = 'Password is required.'
      } else if (password.length < 6) {
        errs.password = 'Password must be at least 6 characters.'
      }
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        errs.name = 'Full name is required.'
      }
      if (password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.'
      }
      if (!agreeTerms) {
        errs.agreeTerms = 'Please agree to the Terms of Service to continue.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setAuthNotice('')

    if (!validate()) return

    if (rememberMe) {
      localStorage.setItem('gesturepilot_remember_email', email.trim())
    } else {
      localStorage.removeItem('gesturepilot_remember_email')
    }

    if (mode === 'forgot') {
      setAuthNotice(
        'Backend authentication is not connected. Password recovery emails are not active in this environment. Please use Demo Login below for full access.'
      )
      return
    }

    // Honest handling: Backend auth is not connected.
    // Do not pretend account was created or validated on server.
    setAuthNotice(
      `Notice: Real account ${mode === 'login' ? 'login' : 'registration'} requires a connected authentication backend, which is not configured in this build. To test the real presentation workspace and gesture engine, please use the Demo Login option.`
    )
  }

  const handleLaunchDemo = (customEmail) => {
    const selectedEmail = (customEmail && typeof customEmail === 'string' ? customEmail : email.trim()) || 'pilot.demo@gesturepilot.ai'
    if (rememberMe) {
      localStorage.setItem('gesturepilot_remember_email', selectedEmail)
    }
    onLoginSuccess({
      email: selectedEmail,
      name: name.trim() || 'Demo Presenter',
      demo: true,
      pdfUrl: '/demo-presentation.pdf',
      filename: 'GesturePilot_Demo_Deck.pptx',
    })
  }

  return (
    <div className="auth-container">
      {/* Background ambient lighting */}
      <div className="auth-bg-glow glow-top-left" />
      <div className="auth-bg-glow glow-bottom-right" />

      <div className="auth-card-wrapper">
        {/* Left Column: Visual Hand Gesture & Slide Controller Mockup */}
        <div className="auth-hero-panel">
          <div className="auth-brand-badge">
            <span className="brand-dot" />
            <span>AI Gesture Tracking • Powered by MediaPipe</span>
          </div>

          <div className="auth-hero-content">
            <h1 className="auth-hero-title">
              GesturePilot <span className="text-gradient">AI</span>
            </h1>
            <p className="auth-hero-tagline">Present smarter. Control with gestures.</p>
          </div>

          {/* Interactive Presentation Gesture Visual */}
          <div className="gesture-visual-card">
            <div className="visual-card-header">
              <div className="window-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="visual-slide-pill">
                Slide {visualSlide} / 4 • {visualLocked ? 'Gestures Locked 🔒' : 'Live Tracking 🟢'}
              </span>
            </div>

            {/* Slide Presentation Screen Mockup */}
            <div className="visual-slide-stage">
              <div className="mock-slide">
                <div className="mock-slide-top">
                  <span className="mock-badge">KEYNOTE DECK</span>
                  <span className="mock-timer">14:20</span>
                </div>
                <h4 className="mock-slide-title">
                  {visualSlide === 1 && '1. The Future of Interactive Presentations'}
                  {visualSlide === 2 && '2. Real-Time Hand Landmark Tracking'}
                  {visualSlide === 3 && '3. Hold-to-Confirm Safety System'}
                  {visualSlide === 4 && '4. Ready to Launch: Hands-Free Control'}
                </h4>
                <div className="mock-slide-bars">
                  <div className="mock-bar bar-long" />
                  <div className="mock-bar bar-medium" />
                  <div className="mock-bar bar-short" />
                </div>
                <div className="mock-slide-dots">
                  {[1, 2, 3, 4].map(s => (
                    <span key={s} className={`slide-indicator ${visualSlide === s ? 'active' : ''}`} />
                  ))}
                </div>
              </div>

              {/* Floating Hand Gesture Overlay */}
              <div className={`gesture-tracking-overlay ${visualLocked ? 'is-locked' : ''}`}>
                <div className="gesture-sensor-ring">
                  <div className="pulse-wave wave-1" />
                  <div className="pulse-wave wave-2" />
                  <div className="gesture-hand-avatar">
                    {visualLocked ? '✊' : visualGesture === 'OPEN_PALM' ? '🖐️' : visualGesture === 'V_SIGN' ? '✌️' : '🖐️'}
                  </div>
                </div>

                <div className="gesture-detection-box">
                  <div className="detection-header">
                    <span className="confidence-tag">98.4% Confidence</span>
                  </div>
                  <div className="detection-action">
                    {visualLocked ? (
                      <span className="action-text lock-text">🔒 Locked (Fist)</span>
                    ) : visualGesture === 'OPEN_PALM' ? (
                      <span className="action-text next-text">🖐️ Open Palm → Next Slide</span>
                    ) : (
                      <span className="action-text prev-text">✌️ V-Sign → Prev Slide</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Gesture Switcher */}
            <div className="visual-controls-bar">
              <span className="visual-controls-hint">Click gesture to preview action:</span>
              <div className="gesture-pill-buttons">
                <button
                  type="button"
                  className={`gesture-pill-btn ${visualGesture === 'OPEN_PALM' && !visualLocked ? 'active' : ''}`}
                  onClick={() => handleSelectVisualGesture('OPEN_PALM')}
                  title="Test Next Slide gesture"
                >
                  <span>🖐️</span> Open Palm (Next)
                </button>
                <button
                  type="button"
                  className={`gesture-pill-btn ${visualGesture === 'V_SIGN' && !visualLocked ? 'active' : ''}`}
                  onClick={() => handleSelectVisualGesture('V_SIGN')}
                  title="Test Previous Slide gesture"
                >
                  <span>✌️</span> V-Sign (Prev)
                </button>
                <button
                  type="button"
                  className={`gesture-pill-btn ${visualLocked ? 'active' : ''}`}
                  onClick={() => handleSelectVisualGesture('FIST')}
                  title="Test Lock toggle gesture"
                >
                  <span>✊</span> Fist (Lock)
                </button>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <div className="hero-feature">
              <span className="feature-icon">⚡</span>
              <span>In-browser local inference</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon">🛡️</span>
              <span>Zero webcam frames recorded</span>
            </div>
          </div>
        </div>

        {/* Right Column: Modern Authentication & Demo Login Form */}
        <div className="auth-form-panel">
          {/* Top navigation back link */}
          <div className="auth-top-nav">
            <button
              type="button"
              className="back-link-btn"
              onClick={onBackToLanding}
            >
              ← Back to Presentation Upload
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setErrors({}); setAuthNotice('') }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setErrors({}); setAuthNotice('') }}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div className="form-header">
            <h2>
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
            </h2>
            <p className="form-subtext">
              {mode === 'login' && 'Sign in to access your gesture workspace'}
              {mode === 'signup' && 'Get started with hands-free AI presentations'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
            </p>
          </div>

          {/* Honest Backend Alert Banner */}
          {authNotice && (
            <div className="auth-alert-box alert-notice" role="alert">
              <div className="alert-icon">ℹ️</div>
              <div className="alert-text">
                <p>{authNotice}</p>
                <button
                  type="button"
                  className="alert-action-btn"
                  onClick={() => handleLaunchDemo(email)}
                >
                  Launch Demo Workspace as {email || 'Demo User'} →
                </button>
              </div>
            </div>
          )}

          {/* Standard Authentication Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name for Sign Up */}
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="auth-name">Full Name</label>
                <div className={`input-wrapper ${errors.name ? 'has-error' : ''}`}>
                  <span className="input-icon">👤</span>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Alex Mercer"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                    }}
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
                <span className="input-icon">✉️</span>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                  }}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            {/* Password Field (Login & Sign Up) */}
            {mode !== 'forgot' && (
              <div className="form-group">
                <div className="label-with-link">
                  <label htmlFor="auth-password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="link-btn text-muted"
                      onClick={() => { setMode('forgot'); setErrors({}); setAuthNotice('') }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
                  <span className="input-icon">🔒</span>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                    }}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
            )}

            {/* Confirm Password (Sign Up) */}
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <div className={`input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <span className="input-icon">🔒</span>
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                    }}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>
            )}

            {/* Remember Me Checkbox (Login) */}
            {mode === 'login' && (
              <div className="form-row-checkbox">
                <label className="custom-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">Remember me on this browser</span>
                </label>
              </div>
            )}

            {/* Agree Terms Checkbox (Sign Up) */}
            {mode === 'signup' && (
              <div className="form-row-checkbox">
                <label className="custom-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked)
                      if (errors.agreeTerms) setErrors(prev => ({ ...prev, agreeTerms: '' }))
                    }}
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">
                    I agree to the <span className="terms-highlight">Terms of Service</span> and{' '}
                    <span className="terms-highlight">Privacy Policy</span>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <span className="field-error block-error">{errors.agreeTerms}</span>
                )}
              </div>
            )}

            {/* Form Submit Button */}
            <button type="submit" className="btn btn-primary btn-submit">
              {mode === 'login' && 'Sign In with Email'}
              {mode === 'signup' && 'Create Free Account'}
              {mode === 'forgot' && 'Send Reset Link'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                className="btn btn-secondary btn-block mt-2"
                onClick={() => { setMode('login'); setErrors({}); setAuthNotice('') }}
              >
                ← Back to Sign In
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR INSTANT DEMO</span>
          </div>

          {/* Highlighted Demo Login Section */}
          <div className="demo-login-card">
            <div className="demo-login-header">
              <div className="demo-badge">RECOMMENDED</div>
              <h4>Try GesturePilot Demo Workspace</h4>
            </div>
            <p className="demo-login-desc">
              Explore the full presentation workspace immediately. Includes sample presentation slides, real-time webcam hand tracking, and interactive gesture controls.
            </p>
            <button
              type="button"
              className="btn btn-accent btn-demo-action"
              onClick={() => handleLaunchDemo(email)}
            >
              <span>🚀</span>
              <strong>Demo Login (Instant Access)</strong>
            </button>
            <span className="demo-subnote">
              No registration or password required • 100% in-browser
            </span>
          </div>

          {/* Toggle between Login and Signup */}
          <div className="auth-toggle-footer">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="link-btn highlight"
                  onClick={() => { setMode('signup'); setErrors({}); setAuthNotice('') }}
                >
                  Create one now
                </button>
              </p>
            ) : mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="link-btn highlight"
                  onClick={() => { setMode('login'); setErrors({}); setAuthNotice('') }}
                >
                  Sign in here
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
