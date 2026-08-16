'use client'

import { useEffect, useState } from 'react'
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
}

const GROWTH_COPY: Record<string, string> = {
  'Not yet': "That's okay — seeing it again soon helps it stick.",
  'Hard': 'Hard ones are worth reviewing. Good effort.',
  'Good': "Solid. You're building real memory here.",
  'Easy': "Sharp. That one's going to last.",
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
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcard_id: card.id, rating }),
      })
      // Surface save failures instead of silently losing progress
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.message || "That rating didn't save. Your progress may not be recorded.")
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
            Zenko will schedule your next review based on how you did.
          </p>
          {saveError && <p className="error-text" style={{ marginTop: '10px' }}>{saveError}</p>}
          <div className="completion-actions">
            <Link href={`/student/topics/${topicId}/problems`} className="btn">Try the problems</Link>
            <Link href="/student" className="btn btn-primary">Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const card = cards[index]
  const cardClass = `fc-card ${revealed ? 'back' : 'front'} ${flipPhase === 'out' ? 'flipping-out' : flipPhase === 'in' ? 'flipping-in' : ''}`
  const shownImage = revealed ? card.answer_image_url : card.image_url

  return (
    <div className="page">
      <PracticeNav topicId={topicId} topicName={topicName} progress={`Card ${index + 1} of ${cards.length}`} />

      {lastMsg && (
        <p style={{ fontSize: '12px', color: 'var(--ink-3)', textAlign: 'center', marginBottom: '10px', animation: 'fadeIn 0.2s ease both' }}>
          {lastMsg}
        </p>
      )}
      {saveError && <p className="error-text" style={{ textAlign: 'center', marginBottom: '8px' }}>{saveError}</p>}

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
          <button className="rate-btn rate-again" onClick={() => rate('Not yet', 'again')} disabled={ratingLoading} aria-label="I didn't remember">Not yet</button>
          <button className="rate-btn rate-hard" onClick={() => rate('Hard', 'hard')} disabled={ratingLoading} aria-label="Hard to remember">Hard</button>
          <button className="rate-btn rate-good" onClick={() => rate('Good', 'good')} disabled={ratingLoading} aria-label="Remembered correctly">Good ✓</button>
          <button className="rate-btn rate-easy" onClick={() => rate('Easy', 'easy')} disabled={ratingLoading} aria-label="Remembered easily">Easy</button>
        </div>
      )}
    </div>
  )
}
