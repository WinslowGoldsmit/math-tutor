'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DeleteButton from '@/app/DeleteButton'

type Flashcard = { id: number; front: string; back: string }

export default function FlashcardItem({ card }: { card: Flashcard }) {
  const [editing, setEditing] = useState(false)
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)
  const router = useRouter()

  async function handleSave() {
    await fetch(`/api/flashcards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back }),
    })
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: '12px' }}>
        <input type="text" value={front} onChange={e => setFront(e.target.value)} placeholder="Front" />
        <input type="text" value={back} onChange={e => setBack(e.target.value)} placeholder="Back" />
        <div className="btn-row">
          <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn btn-primary btn-small" onClick={handleSave}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{card.front}</span>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} className="btn-ghost" style={{ fontSize: '12px' }}>Edit</button>
        <DeleteButton id={card.id} type="flashcards" />
      </div>
    </div>
  )
}
