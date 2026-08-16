'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORS = [
  { label: 'Blue', value: '#EBF1FE', border: '#3D7BF5' },
  { label: 'Green', value: '#E8F5E9', border: '#34A853' },
  { label: 'Amber', value: '#FFF3E0', border: '#F5A623' },
  { label: 'Violet', value: '#F0EBFF', border: '#7C4DFF' },
  { label: 'Coral', value: '#FDE8E6', border: '#EA4335' },
  { label: 'Teal', value: '#E2EDEC', border: '#33636A' },
]

const EMOJIS = ['📐', '📏', '🔢', '📊', '🔵', '🟢', '🟡', '🔴', '⭐', '🎯', '🧩', '💡']

export default function NewChapter() {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📐')
  const [color, setColor] = useState(COLORS[0].value)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('Please enter a chapter name.'); return }
    const res = await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji, color }),
    })
    if (res.ok) router.push('/teacher')
    else setError('Something went wrong. Try again.')
  }

  return (
    <div className="page" style={{ maxWidth: '400px' }}>
      <Link href="/teacher" className="back-link">← Back</Link>
      <h1 className="page-title" style={{ marginBottom: '20px' }}>New chapter</h1>

      <div className="section-label" style={{ marginTop: 0 }}>Name</div>
      <input type="text" placeholder="e.g. Triangles" value={name} onChange={e => setName(e.target.value)} />

      <div className="section-label">Emoji</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)}
            style={{ fontSize: '20px', padding: '8px', border: `2px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', background: emoji === e ? 'var(--accent-tint)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s ease' }}>
            {e}
          </button>
        ))}
      </div>

      <div className="section-label">Color</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <button key={c.value} onClick={() => setColor(c.value)}
            style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', background: c.value, border: `2px solid ${color === c.value ? c.border : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s ease' }}
            title={c.label} />
        ))}
      </div>

      <div style={{ padding: '14px 16px', borderRadius: 'var(--r-lg)', background: color, border: `1px solid`, marginBottom: '16px' }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>{emoji}</span>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>{name || 'Chapter name'}</strong>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>Save chapter</button>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
