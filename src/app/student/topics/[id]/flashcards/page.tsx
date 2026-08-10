'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Flashcard = { id: number; front: string; back: string; image_url: string | null }

export default function FlashcardPractice() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id

  const [cards, setCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/flashcards?topic_id=${topicId}`)
      .then(res => res.json())
      .then(data => {
        setCards(data.flashcards ?? [])
        setLoading(false)
      })
  }, [topicId])

  async function rate(rating: string) {
    const card = cards[index]
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcard_id: card.id, rating }),
    })
    await fetch('/api/streak', { method: 'POST' })
    setRevealed(false)
    setIndex(i => i + 1)
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--ink-soft)' }}>Loading…</div>

  if (index >= cards.length) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p style={{ color: 'var(--ink-soft)' }}>You&apos;ve reviewed all {cards.length} cards. Nicely done.</p>
        <button className="btn" style={{ marginTop: '16px', width: 'auto', padding: '10px 20px' }} onClick={() => router.back()}>
          Back to topic
        </button>
      </div>
    )
  }

  const card = cards[index]

  return (
    <div className="page">
      <p className="progress-label">Card {index + 1} of {cards.length}</p>

      <div className="fc-card">
        {card.image_url && (
          <img src={card.image_url} alt="" style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '14px' }} />
        )}
        <p className="fc-text">{revealed ? card.back : card.front}</p>
      </div>

      {!revealed && (
        <button className="btn btn-primary" onClick={() => setRevealed(true)}>Show answer</button>
      )}

      {revealed && (
        <div className="rate-row">
          <button className="rate-btn rate-again" onClick={() => rate('again')}>Again</button>
          <button className="rate-btn rate-hard" onClick={() => rate('hard')}>Hard</button>
          <button className="rate-btn rate-good" onClick={() => rate('good')}>Good</button>
          <button className="rate-btn rate-easy" onClick={() => rate('easy')}>Easy</button>
        </div>
      )}
    </div>
  )
}