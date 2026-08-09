'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewChapter() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setError('')
    const res = await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      router.push('/teacher')
    } else {
      setError('Something went wrong. Try again.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>New chapter</h1>
      <input
        placeholder="e.g. Triangles"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box' }}
      />
      <button onClick={handleSave} style={{ width: '100%', padding: '10px' }}>Save chapter</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}