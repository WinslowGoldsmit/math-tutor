'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'teacher' | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleStudentLogin() {
    setError('')
    const res = await fetch('/api/login/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code }),
    })
    if (res.ok) router.push('/student')
    else { const data = await res.json(); setError(data.message || 'Login failed') }
  }

  async function handleTeacherLogin() {
    setError('')
    const res = await fetch('/api/login/teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) router.push('/teacher')
    else { const data = await res.json(); setError(data.message || 'Login failed') }
  }

  return (
    <div className="page" style={{ paddingTop: '14vh', textAlign: 'center' }}>
      <svg width="52" height="52" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 20px' }}>
        <path d="M20 6 L34 32 L6 32 Z" stroke="#1F4247" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 19 L26 19" stroke="#D08A3E" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h1 className="display" style={{ fontSize: '26px', margin: '0 0 6px' }}>Triangles</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginBottom: '32px' }}>
        Practice for Class 10 Mathematics.
      </p>

      {!role && (
        <div style={{ textAlign: 'left' }}>
          <button className="role-card" onClick={() => setRole('student')}>
            <div>
              <strong style={{ display: 'block', fontSize: '15px' }}>I&apos;m a student</strong>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-soft)' }}>Practice flashcards and problems</span>
            </div>
          </button>
          <button className="role-card" onClick={() => setRole('teacher')}>
            <div>
              <strong style={{ display: 'block', fontSize: '15px' }}>I&apos;m the teacher</strong>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-soft)' }}>Add content, review responses</span>
            </div>
          </button>
        </div>
      )}

      {role === 'student' && (
        <div style={{ textAlign: 'left' }}>
          <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <input type="text" placeholder="Your code" value={code} onChange={e => setCode(e.target.value)} />
          <button className="btn btn-primary" onClick={handleStudentLogin}>Log in</button>
        </div>
      )}

      {role === 'teacher' && (
        <div style={{ textAlign: 'left' }}>
          <input type="password" placeholder="Teacher password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn btn-primary" onClick={handleTeacherLogin}>Log in</button>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  )
}