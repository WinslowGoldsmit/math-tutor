'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Celebration from '@/app/Celebration'
import PracticeNav from '@/app/student/PracticeNav'

type Flashcard = {
  id: number
  front: string
  back: string
  image_url: string | null
  answer_image_url: string | null
  card_state?: string  // 'new' | 'learning' | 'review' | 'relearning'
}

type RatedCard = {
  index: number
  flashcard_id: number
  rating: string
}

// What the student sees below each rating button
const NEXT_LABEL: Record<string, Record<string, string>> = {
  new:        { again: 'Again',    hard: '1 min',   good: '10 min',  easy: '4 days' },
  learning:   { again: 'Again',    hard: '1 min',   good: '10 min',  easy: 'Done ✓' },
  relearning: { again: 'Again',    hard: '1 min',   good: 'Done ✓',  easy: 'Done ✓' },
  review:     { again: 'Relearn',  hard: 'Hard',    good: 'Good',    easy: 'Easy'   },
}

const GROWTH_COPY: Record<string, string> = {
  'Not yet': "That's okay — seeing it again soon helps it stick.",
  'Hard':    'Hard ones are worth reviewing. Good effort.',
  'Good':    "Solid. You're building real memory here.",
  'Easy':    "Sharp. That one's going to last.",
}

export default function FlashcardPractice() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id as string

  const [cards, setCards] = useState<Flashcard[]>([])
  const [topicName, setTopicName] = useState('')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flipPhase, setFlipPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const [lastMsg, setLastMsg] = useState('')
  const [done, setDone] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Undo support — remember the last rated card
  const lastRated = useRef<RatedCard | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  useEffect(() => {
    fetch(`/api/flashcards?topic_id=${topicId}`)
      .then(res => res.json())
      .then(data => {
        setCards(data.flashcards ?? [])
        setTopicName(data.topic_name ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [topicId])

  function handleReveal() {
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
    setSaveError('')
    setLastMsg(GROWTH_COPY[label] ?? '')

    const card = cards[index]

    // Remember for undo
    lastRated.current = { index, flashcard_id: card.id, rating }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcard_id: card.id, rating }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.message || "That rating didn't save.")
      } else {
        setCanUndo(true)
        setTimeout(() => setCanUndo(false), 8000) // undo window = 8 seconds
      }
      await fetch('/api/streak', { method: 'POST' })
    } catch {
      setSaveError("Couldn't reach the server — that rating may not be saved.")
    }

    const next = index + 1
    if (next >= cards.length) {
      setDone(true)
    } else {
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

  async function handleUndo() {
    if (!lastRated.current || ratingLoading) return
    const prev = lastRated.current
    lastRated.current = null
    setCanUndo(false)

    // Delete the last review record
    try {
      await fetch(`/api/reviews/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcard_id: prev.flashcard_id }),
      })
    } catch {
      // Best effort — even if undo fails, we still go back visually
    }

    // Go back to that card
    setDone(false)
    setIndex(prev.index)
    setRevealed(false)
    setLastMsg('')
  }

  const card = cards[index]
  const cardState = card?.card_state ?? 'new'
  const nextLabels = NEXT_LABEL[cardState] ?? NEXT_LABEL['new']

  if (loading) return <div className="loading">Loading your cards…</div>

  if (cards.length === 0) {
    return (
      <div className="page">
        <PracticeNav topicId={topicId} topicName={topicName} />
        <div className="completion">
          <span className="completion-icon">✦</span>
          <p className="completion-title">All caught up</p>
          <p>No cards due right now. Come back tomorrow.</p>
          <div className="completion-actions">
            <Link href={`/student/topics/${topicId}`} className="btn">Back to topic</Link>
            <Link href="/student" className="btn btn-primary">Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="page">
        <div className="completion">
          <Celebration />
          <span className="completion-icon">✦</span>
          <p className="completion-title">Session complete</p>
          <p>{cards.length} cards reviewed</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginTop: '8px' }}>
            Zenko will show you each card again based on how you rated it.
          </p>
          {canUndo && (
            <button className="btn" style={{ marginTop: '12px', width: 'auto' }} onClick={handleUndo}>
              ↩ Undo last rating
            </button>
          )}
          {saveError && <p className="error-text" style={{ marginTop: '10px' }}>{saveError}</p>}
          <div className="completion-actions">
            <Link href={`/student/topics/${topicId}/problems`} className="btn">Try the problems</Link>
            <Link href="/student" className="btn btn-primary">Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const shownImage = revealed ? card.answer_image_url : card.image_url
  const cardClass = `fc-card ${revealed ? 'back' : 'front'} ${flipPhase === 'out' ? 'flipping-out' : flipPhase === 'in' ? 'flipping-in' : ''}`

  // State label shown at the top of the card
  const stateLabel: Record<string, string> = {
    new: 'New card',
    learning: 'Learning',
    relearning: 'Reviewing again',
    review: 'Review',
  }

  return (
    <div className="page">
      <PracticeNav
        topicId={topicId}
        topicName={topicName}
        progress={`Card ${index + 1} of ${cards.length}`}
      />

      {lastMsg && (
        <p style={{ fontSize: '12px', color: 'var(--ink-3)', textAlign: 'center', marginBottom: '8px', animation: 'fadeIn 0.2s ease both' }}>
          {lastMsg}
        </p>
      )}
      {saveError && <p className="error-text" style={{ textAlign: 'center', marginBottom: '8px' }}>{saveError}</p>}

      {/* Card state pill */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <span className={`state-pill state-${cardState}`}>
          {stateLabel[cardState] ?? 'Card'}
        </span>
        {canUndo && (
          <button className="undo-btn" onClick={handleUndo} title="Undo last rating">
            ↩ Undo
          </button>
        )}
      </div>

      <div className="fc-scene">
        <div className={cardClass}>
          <div className="fc-label">{revealed ? 'Answer' : 'Question'}</div>
          {shownImage && (
            <img src={shownImage} alt="" style={{ maxWidth: '100%', borderRadius: 'var(--r-md)', marginBottom: '14px' }} />
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
          <div className="rate-col">
            <button className="rate-btn rate-again" onClick={() => rate('Not yet', 'again')} disabled={ratingLoading}>Not yet</button>
            <span className="rate-next">{nextLabels.again}</span>
          </div>
          <div className="rate-col">
            <button className="rate-btn rate-hard" onClick={() => rate('Hard', 'hard')} disabled={ratingLoading}>Hard</button>
            <span className="rate-next">{nextLabels.hard}</span>
          </div>
          <div className="rate-col">
            <button className="rate-btn rate-good" onClick={() => rate('Good', 'good')} disabled={ratingLoading}>Good ✓</button>
            <span className="rate-next">{nextLabels.good}</span>
          </div>
          <div className="rate-col">
            <button className="rate-btn rate-easy" onClick={() => rate('Easy', 'easy')} disabled={ratingLoading}>Easy</button>
            <span className="rate-next">{nextLabels.easy}</span>
          </div>
        </div>
      )}
    </div>
  )
}
