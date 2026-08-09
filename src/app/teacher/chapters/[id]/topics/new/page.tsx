'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function NewTopic() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const chapterId = params.id

  async function handleSave() {
    setError('')
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, chapter_id: chapterId }),
    })
    if (res.ok) {
      router.push(`/teacher/chapters/${chapterId}`)
    } else {
      setError('Something went wrong. Try again.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>New topic</h1>
      <input
        placeholder="e.g. Basic Proportionality Theorem"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box' }}
      />
      <button onClick={handleSave} style={{ width: '100%', padding: '10px' }}>Save topic</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}