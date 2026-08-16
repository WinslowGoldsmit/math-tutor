'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

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
    if (res.ok) router.push(`/teacher/chapters/${chapterId}`)
    else setError('Something went wrong. Try again.')
  }

  return (
    <div className="page" style={{ maxWidth: '400px' }}>
      <Link href={`/teacher/chapters/${chapterId}`} className="back-link">← Back</Link>
      <h1 className="page-title" style={{ marginBottom: '20px' }}>New topic</h1>
      <input type="text" placeholder="e.g. Basic Proportionality Theorem" value={name} onChange={e => setName(e.target.value)} />
      <button className="btn btn-primary" onClick={handleSave}>Save topic</button>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
