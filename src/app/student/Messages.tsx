'use client'

import { useEffect, useState } from 'react'

type Message = { id: number; message: string; is_read: boolean; created_at: string }

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/messages')
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        // Previously any failure here rendered nothing at all, so a teacher's
        // note could silently never appear. Now the student sees something.
        if (!r.ok) { setError(d.message || 'Notes could not be loaded right now.'); return }
        setMessages(d.messages ?? [])
      })
      .catch(() => setError('Notes could not be loaded right now.'))
      .finally(() => setLoaded(true))
  }, [])

  async function markRead(id: number) {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, is_read: true } : m)))
    try {
      await fetch(`/api/messages/${id}`, { method: 'PATCH' })
    } catch {
      // Non-critical — the note is still visible
    }
  }

  if (!loaded) return null

  if (error) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <div className="section-label" style={{ marginTop: 0 }}>From your teacher</div>
        <p className="error-text">{error}</p>
      </div>
    )
  }

  if (!messages.length) return null

  const unread = messages.filter(m => !m.is_read).length

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="section-label" style={{ marginTop: 0 }}>
        From your teacher{unread > 0 ? ` (${unread} new)` : ''}
      </div>
      {messages.map(m => (
        <div
          key={m.id}
          className={`message-card ${!m.is_read ? 'unread' : ''}`}
          onClick={() => !m.is_read && markRead(m.id)}
          style={{ cursor: !m.is_read ? 'pointer' : 'default' }}
        >
          <div className="msg-from">Teacher</div>
          <div className="msg-text">{m.message}</div>
          <div className="msg-time">
            {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {!m.is_read && <span style={{ marginLeft: '8px', color: 'var(--amber-dark)', fontWeight: 600 }}>New — tap to mark read</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
