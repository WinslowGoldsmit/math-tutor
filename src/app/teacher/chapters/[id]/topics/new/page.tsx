'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { TOPIC_COLORS, TOPIC_EMOJIS } from '@/lib/topicStyle'

export default function NewTopic() {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(TOPIC_EMOJIS[0])
  const [color, setColor] = useState(TOPIC_COLORS[0].value)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const chapterId = params.id

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('Please enter a topic name.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, chapter_id: chapterId, emoji, color }),
      })
      if (res.ok) { router.push(`/teacher/chapters/${chapterId}`); return }
      const data = await res.json().catch(() => ({}))
      setError(data.message || 'Something went wrong. Try again.')
    } catch {
      setError('Network problem — please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="page" style={{ maxWidth: '440px' }}>
      <Link href={`/teacher/chapters/${chapterId}`} className="back-link">← Back</Link>
      <h1 className="page-title" style={{ marginBottom: '20px' }}>New topic</h1>

      <div className="section-label" style={{ marginTop: 0 }}>Name</div>
      <input type="text" placeholder="e.g. Basic Proportionality Theorem" value={name} onChange={e => setName(e.target.value)} />

      <div className="section-label">Emoji</div>
      <div className="picker-row">
        {TOPIC_EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => setEmoji(e)} className={`picker-emoji ${emoji === e ? 'is-active' : ''}`}>{e}</button>
        ))}
      </div>

      <div className="section-label">Colour</div>
      <div className="picker-row">
        {TOPIC_COLORS.map(c => (
          <button key={c.value} type="button" onClick={() => setColor(c.value)} title={c.label}
            className={`picker-swatch ${color === c.value ? 'is-active' : ''}`}
            style={{ background: c.value, borderColor: color === c.value ? c.border : 'transparent' }} />
        ))}
      </div>

      <div className="topic-box" style={{ background: color, marginTop: '16px' }}>
        <span className="topic-emoji">{emoji}</span>
        <span className="topic-box-title">{name || 'Topic name'}</span>
      </div>

      <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save topic'}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
