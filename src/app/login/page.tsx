'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'teacher' | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStudentLogin() {
    if (!name.trim() || !code.trim()) { setError('Please enter your name and code.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/login/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      })
      if (res.ok) router.push('/student')
      else {
        const data = await res.json()
        setError(data.message || 'That didn\'t match — double-check your name and code.')
      }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleTeacherLogin() {
    if (!password) { setError('Please enter your password.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/login/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) router.push('/teacher')
      else {
        const data = await res.json()
        setError(data.message || 'Incorrect password.')
      }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const eyeIcon = (visible: boolean) => visible ? '🙈' : '👁'

  return (
    <div className="page" style={{ paddingTop: '10vh' }}>
      <div className="landing-hero">
        <div className="landing-logo">Zenko</div>
        <p className="landing-tag">Focused practice, real progress.</p>
      </div>

      {!role && (
        <div className="anim-fade-up">
          <button className="role-card" onClick={() => setRole('student')}>
            <div className="role-icon" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>Z</div>
            <div>
              <strong style={{ display: 'block', fontSize: '15px' }}>I&apos;m a student</strong>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px' }}>Practice flashcards &amp; solve problems</span>
            </div>
          </button>
          <button className="role-card" onClick={() => setRole('teacher')}>
            <div className="role-icon" style={{ background: 'var(--violet-tint)', color: 'var(--violet)' }}>T</div>
            <div>
              <strong style={{ display: 'block', fontSize: '15px' }}>I&apos;m the teacher</strong>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px' }}>Create content &amp; track progress</span>
            </div>
          </button>
        </div>
      )}

      {role === 'student' && (
        <div className="anim-fade-up">
          <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginBottom: '14px' }}>
            Use the name and code your teacher gave you.
          </p>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            inputMode="text"
            autoComplete="name"
          />
          {/* Code field with visibility toggle */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type={showCode ? 'text' : 'password'}
              placeholder="Your code"
              value={code}
              onChange={e => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              style={{ marginBottom: 0, paddingRight: '44px' }}
            />
            <button
              type="button"
              onClick={() => setShowCode(v => !v)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px',
                padding: '4px', lineHeight: 1
              }}
              aria-label={showCode ? 'Hide code' : 'Show code'}
            >
              {eyeIcon(showCode)}
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleStudentLogin} disabled={loading}>
            {loading ? 'Logging in…' : "Let's go →"}
          </button>
          <button className="btn-ghost" onClick={() => { setRole(null); setError('') }} style={{ marginTop: '10px', display: 'block' }}>
            ← Back
          </button>
        </div>
      )}

      {role === 'teacher' && (
        <div className="anim-fade-up">
          {/* Password field with visibility toggle */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Teacher password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ marginBottom: 0, paddingRight: '44px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px',
                padding: '4px', lineHeight: 1
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {eyeIcon(showPassword)}
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleTeacherLogin} disabled={loading}>
            {loading ? 'Logging in…' : 'Enter dashboard →'}
          </button>
          <button className="btn-ghost" onClick={() => { setRole(null); setError('') }} style={{ marginTop: '10px', display: 'block' }}>
            ← Back
          </button>
        </div>
      )}

      {error && (
        <p className="error-text" style={{ textAlign: 'center', marginTop: '12px' }}>{error}</p>
      )}
    </div>
  )
}
