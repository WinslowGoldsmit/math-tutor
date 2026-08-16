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
        if (!r.ok) { setError(d.message || 'Notes could not be loaded right now.'); return }
        // Only show UNREAD messages on home screen
        setMessages((d.messages ?? []).filter((m: Message) => !m.is_read))
      })
      .catch(() => setError('Notes could not be loaded right now.'))
      .finally(() => setLoaded(true))
  }, [])

  async function markRead(id: number) {
    try {
      await fetch(`/api/messages/${id}`, { method: 'PATCH' })
      // Remove from home screen immediately after reading
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch {
      // Non-critical
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

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="section-label" style={{ marginTop: 0 }}>
        From your teacher ({messages.length} new)
      </div>
      {messages.map(m => (
        <div
          key={m.id}
          className="message-card unread"
          onClick={() => markRead(m.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="msg-from">Teacher</div>
          <div className="msg-text">{m.message}</div>
          <div className="msg-time">
            {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            <span style={{ marginLeft: '8px', color: 'var(--amber-dark)', fontWeight: 600 }}>
              Tap to dismiss
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
