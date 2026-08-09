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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  if (index >= cards.length) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>You&apos;ve reviewed all {cards.length} cards. Nicely done.</p>
        <button onClick={() => router.back()} style={{ marginTop: '16px', padding: '10px 20px' }}>Back to topic</button>
      </div>
    )
  }

  const card = cards[index]

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '14px' }}>
        Card {index + 1} of {cards.length}
      </p>

      <div style={{
        border: '1px solid #ddd', borderRadius: '16px', minHeight: '200px',
        padding: '28px 20px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center', marginBottom: '20px'
      }}>
        {card.image_url && (
          <img src={card.image_url} alt="" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '14px' }} />
        )}
        <p style={{ fontSize: '17px', lineHeight: 1.5 }}>
          {revealed ? card.back : card.front}
        </p>
      </div>

      {!revealed && (
        <button onClick={() => setRevealed(true)} style={{ width: '100%', padding: '12px' }}>
          Show answer
        </button>
      )}

      {revealed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <button onClick={() => rate('again')} style={{ padding: '10px 4px', fontSize: '12px' }}>Again</button>
          <button onClick={() => rate('hard')} style={{ padding: '10px 4px', fontSize: '12px' }}>Hard</button>
          <button onClick={() => rate('good')} style={{ padding: '10px 4px', fontSize: '12px' }}>Good</button>
          <button onClick={() => rate('easy')} style={{ padding: '10px 4px', fontSize: '12px' }}>Easy</button>
        </div>
      )}
    </div>
  )
}
