'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Celebration from '@/app/Celebration'

type Flashcard = { id: number; front: string; back: string; image_url: string | null }

const GROWTH_COPY: Record<string, string> = {
  'Not yet': "That's okay — seeing it again soon helps it stick.",
  'Hard': 'Hard ones are worth reviewing. Good effort.',
  'Good': 'Solid. You\'re building real memory here.',
  'Easy': 'Sharp. That one\'s going to last.',
}

export default function FlashcardPractice() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id

  const [cards, setCards] = useState<Flashcard[]>([])
  const [dueCount, setDueCount] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flipping, setFlipping] = useState(false)
  const [flipPhase, setFlipPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const [lastMsg, setLastMsg] = useState('')
  const [done, setDone] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/flashcards?topic_id=${topicId}`)
      .then(res => res.json())
      .then(data => {
        setCards(data.flashcards ?? [])
        setDueCount(data.due_count ?? 0)
        setNewCount(data.new_count ?? 0)
        setLoading(false)
      })
  }, [topicId])

  function handleReveal() {
    // Flip animation: phase 1 out, swap content, phase 2 in
    setFlipPhase('out')
    setTimeout(() => {
      setRevealed(true)
      setFlipPhase('in')
      setTimeout(() => setFlipPhase('idle'), 150)
    }, 150)
  }

  async function rate(label: string, rating: string) {
    if (ratingLoading) return
    setRatingLoading(true)
    setLastMsg(GROWTH_COPY[label] ?? '')

    const card = cards[index]
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcard_id: card.id, rating }),
      })
      await fetch('/api/streak', { method: 'POST' })
    } catch (e) {
      console.error('Review save error:', e)
    }

    const next = index + 1
    if (next >= cards.length) {
      setDone(true)
    } else {
      // Flip to next card
      setFlipPhase('out')
      setTimeout(() => {
        setRevealed(false)
        setIndex(next)
        setFlipPhase('in')
        setTimeout(() => setFlipPhase('idle'), 150)
      }, 150)
    }
    setRatingLoading(false)
  }

  if (loading) return <div className="loading">Loading your cards…</div>

  if (cards.length === 0) {
    return (
      <div className="page completion">
        <span className="completion-icon">✦</span>
        <p className="completion-title">All caught up</p>
        <p>No cards due right now. Come back tomorrow.</p>
        <button className="btn" style={{ marginTop: '20px', width: 'auto' }} onClick={() => router.back()}>Back to topic</button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="page completion">
        <Celebration />
        <span className="completion-icon">✦</span>
        <p className="completion-title">Session complete</p>
        <p>{cards.length} cards reviewed</p>
        <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginTop: '8px' }}>
          Zenko will schedule your next review based on how you did.
        </p>
        <button className="btn" style={{ marginTop: '24px', width: 'auto' }} onClick={() => router.back()}>Back to topic</button>
      </div>
    )
  }

  const card = cards[index]
  const cardClass = `fc-card ${revealed ? 'back' : 'front'} ${flipPhase === 'out' ? 'flipping-out' : flipPhase === 'in' ? 'flipping-in' : ''}`

  return (
    <div className="page">
      {lastMsg && (
        <p style={{ fontSize: '12px', color: 'var(--ink-3)', textAlign: 'center', marginBottom: '10px', animation: 'fadeIn 0.2s ease both' }}>
          {lastMsg}
        </p>
      )}
      <p className="progress-label">Card {index + 1} of {cards.length}</p>

      <div className="fc-scene">
        <div className={cardClass}>
          <div className="fc-label">{revealed ? 'Answer' : 'Question'}</div>
          {card.image_url && (
            <img src={card.image_url} alt="Flashcard diagram" style={{ maxWidth: '100%', borderRadius: 'var(--r-md)', marginBottom: '14px' }} />
          )}
          <p className="fc-text">{revealed ? card.back : card.front}</p>
        </div>
      </div>

      {!revealed && (
        <button className="btn-reveal" onClick={handleReveal}>
          Flip card ↓
        </button>
      )}

      {revealed && (
        <div className="rate-row">
          <button className="rate-btn rate-again" onClick={() => rate('Not yet', 'again')} disabled={ratingLoading} aria-label="I didn't remember">Not yet</button>
          <button className="rate-btn rate-hard" onClick={() => rate('Hard', 'hard')} disabled={ratingLoading} aria-label="Hard to remember">Hard</button>
          <button className="rate-btn rate-good" onClick={() => rate('Good', 'good')} disabled={ratingLoading} aria-label="Remembered correctly">Good ✓</button>
          <button className="rate-btn rate-easy" onClick={() => rate('Easy', 'easy')} disabled={ratingLoading} aria-label="Remembered easily">Easy</button>
        </div>
      )}
    </div>
  )
}
