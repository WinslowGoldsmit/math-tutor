'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SendMessage({ studentId }: { studentId: string }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, message: message.trim() }),
    })
    setMessage('')
    setSent(true)
    setSending(false)
    setTimeout(() => setSent(false), 2000)
    router.refresh()
  }

  return (
    <div>
      <textarea
        placeholder="Write a note for this student — they'll see it on their home page…"
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
        style={{ marginBottom: '8px' }}
      />
      <button
        className="btn btn-primary btn-small"
        onClick={handleSend}
        disabled={sending || !message.trim()}
      >
        {sent ? 'Sent ✓' : sending ? 'Sending…' : 'Send note'}
      </button>
    </div>
  )
}
