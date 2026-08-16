'use client'

import { useEffect, useState } from 'react'

type Message = { id: number; message: string; is_read: boolean; created_at: string }

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
  }, [])

  async function markRead(id: number) {
    await fetch(`/api/messages/${id}`, { method: 'PATCH' })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
  }

  if (!messages.length) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="section-label" style={{ marginTop: 0 }}>From your teacher</div>
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
            {!m.is_read && <span style={{ marginLeft: '8px', color: 'var(--amber-dark)', fontWeight: 600 }}>New</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
