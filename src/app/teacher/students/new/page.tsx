'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewStudent() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setError('')
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code }),
    })
    if (res.ok) {
      router.push('/teacher')
    } else {
      const data = await res.json()
      setError(data.message || 'Something went wrong.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>Add a student</h1>
      <input
        placeholder="Student name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box' }}
      />
      <input
        placeholder="Login code (e.g. roll number)"
        value={code}
        onChange={e => setCode(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box' }}
      />
      <button onClick={handleSave} style={{ width: '100%', padding: '10px' }}>Add student</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
