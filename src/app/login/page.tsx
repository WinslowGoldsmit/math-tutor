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
    if (res.ok) {
      router.push('/student')
    } else {
      const data = await res.json()
      setError(data.message || 'Login failed')
    }
  }

  async function handleTeacherLogin() {
    setError('')
    const res = await fetch('/api/login/teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/teacher')
    } else {
      const data = await res.json()
      setError(data.message || 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: '360px', margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1>Triangles</h1>

      {!role && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setRole('student')}>I'm a student</button>
          <button onClick={() => setRole('teacher')}>I'm the teacher</button>
        </div>
      )}

      {role === 'student' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Your code" value={code} onChange={e => setCode(e.target.value)} />
          <button onClick={handleStudentLogin}>Log in</button>
        </div>
      )}

      {role === 'teacher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="password" placeholder="Teacher password" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={handleTeacherLogin}>Log in</button>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}