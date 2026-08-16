'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DeleteButton from '@/app/DeleteButton'
import ImageField from '@/app/teacher/ImageField'

type Flashcard = {
  id: number
  front: string
  back: string
  image_url?: string | null
  answer_image_url?: string | null
}

export default function FlashcardItem({ card }: { card: Flashcard }) {
  const [editing, setEditing] = useState(false)
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)
  const [imageUrl, setImageUrl] = useState(card.image_url ?? '')
  const [answerImageUrl, setAnswerImageUrl] = useState(card.answer_image_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/flashcards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front, back, image_url: imageUrl, answer_image_url: answerImageUrl }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Could not save this card.')
        setSaving(false)
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError('Network problem — please try again.')
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: '14px' }}>
        <div className="picker-label">Question (front)</div>
        <textarea value={front} onChange={e => setFront(e.target.value)} rows={2} placeholder="Question" />
        <ImageField label="Question image" value={imageUrl} onChange={setImageUrl} />

        <div className="picker-label" style={{ marginTop: '14px' }}>Answer (back)</div>
        <textarea value={back} onChange={e => setBack(e.target.value)} rows={2} placeholder="Answer" />
        <ImageField label="Answer image" value={answerImageUrl} onChange={setAnswerImageUrl} />

        <div className="btn-row">
          <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn btn-primary btn-small" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
      <span style={{ flex: 1 }}>
        {(card.image_url || card.answer_image_url) && <span title="Has image" style={{ marginRight: '6px' }}>🖼</span>}
        {card.front}
      </span>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} className="btn-ghost" style={{ fontSize: '12px' }}>Edit</button>
        <DeleteButton id={card.id} type="flashcards" />
      </div>
    </div>
  )
}
