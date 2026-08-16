'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Celebration from '@/app/Celebration'
import PracticeNav from '@/app/student/PracticeNav'

type Mcq = {
  id: number
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  hint?: string | null
  image_url: string | null
  explanation_image_url?: string | null
}

export default function ProblemPractice() {
  const params = useParams()
  const topicId = params.id as string

  const [questions, setQuestions] = useState<Mcq[]>([])
  const [topicName, setTopicName] = useState('')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [hintShown, setHintShown] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [answeredIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch(`/api/mcqs?topic_id=${topicId}`)
      .then(res => res.json())
      .then(data => {
        const fresh = (data.mcqs ?? []).filter((q: Mcq) => !answeredIds.has(q.id))
        setQuestions(fresh)
        setTopicName(data.topic_name ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [topicId])

  async function submitAnswer(skip: boolean) {
    const q = questions[index]
    answeredIds.add(q.id)
    setSaveError('')

    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcq_id: q.id, selected_index: skip ? null : selected }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.message || "That answer didn't save. Your progress may not be recorded.")
      }
      await fetch('/api/streak', { method: 'POST' })
    } catch {
      setSaveError("Couldn't reach the server — that answer may not be saved.")
    }

    if (skip) {
      setSkipped(s => s + 1)
      setSelected(null)
      setHintShown(false)
      if (index + 1 >= questions.length) setDone(true)
      else setIndex(i => i + 1)
    } else {
      const correct = selected === q.correct_index
      setIsCorrect(correct)
      if (correct) setScore(s => s + 1)
      setSubmitted(true)
    }
  }

  function nextQuestion() {
    setSelected(null)
    setSubmitted(false)
    setIsCorrect(null)
    setHintShown(false)
    if (index + 1 >= questions.length) setDone(true)
    else setIndex(i => i + 1)
  }

  if (loading) return <div className="loading">Loading problems…</div>

  if (questions.length === 0) {
    return (
      <div className="page">
        <PracticeNav topicId={topicId} topicName={topicName} />
        <div className="empty" style={{ marginTop: '20px' }}>No problems in this topic yet.</div>
        <div className="completion-actions">
          <Link href={`/student/topics/${topicId}/flashcards`} className="btn">Practise flashcards</Link>
          <Link href="/student" className="btn btn-primary">Dashboard</Link>
        </div>
      </div>
    )
  }

  if (done) {
    const attempted = questions.length - skipped
    const pct = attempted ? Math.round((score / attempted) * 100) : 0
    return (
      <div className="page">
        <div className="completion">
          <Celebration />
          <span className="completion-icon">◆</span>
          <p className="completion-title">{questions.length} problems done</p>
          <p>{score}/{attempted} correct · {pct}% accuracy{skipped > 0 ? ` · ${skipped} skipped` : ''}</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginTop: '8px' }}>
            {pct >= 80 ? 'Strong work — you clearly understand this topic.' : pct >= 50 ? 'Good effort. Review the ones you found tricky.' : 'Keep practicing — each attempt builds understanding.'}
          </p>
          {saveError && <p className="error-text" style={{ marginTop: '10px' }}>{saveError}</p>}
          <div className="completion-actions">
            <Link href={`/student/topics/${topicId}`} className="btn">Back to topic</Link>
            <Link href="/student" className="btn btn-primary">Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[index]

  return (
    <div className="page">
      <PracticeNav
        topicId={topicId}
        topicName={topicName}
        progress={`Question ${index + 1} of ${questions.length}${score > 0 ? ` · ${score} correct` : ''}`}
      />

      {saveError && <p className="error-text" style={{ textAlign: 'center', marginBottom: '8px' }}>{saveError}</p>}

      <div className="card anim-fade-up" key={index} style={{ padding: '20px', marginBottom: '16px' }}>
        {q.image_url && <img src={q.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 'var(--r-md)', marginBottom: '14px' }} />}
        <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px', lineHeight: 1.55 }}>{q.question}</p>

        {q.options.map((opt, i) => {
          let cls = 'opt'
          if (submitted && i === q.correct_index) cls += ' selected'
          else if (!submitted && selected === i) cls += ' selected'
          return (
            <div key={i} className={cls} onClick={() => { if (!submitted) setSelected(i) }}
              tabIndex={submitted ? -1 : 0} role="button"
              aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt}`}
              onKeyDown={e => { if (!submitted && (e.key === 'Enter' || e.key === ' ')) setSelected(i) }}>
              <div className="opt-key">{String.fromCharCode(65 + i)}</div>
              <span>{opt}</span>
            </div>
          )
        })}

        {/* Hint — the column already existed, it just was never surfaced */}
        {!submitted && q.hint && (
          hintShown ? (
            <div className="hint-box">
              <span className="hint-label">Hint</span>
              {q.hint}
            </div>
          ) : (
            <button className="btn-ghost" style={{ marginTop: '8px' }} onClick={() => setHintShown(true)}>
              Need a hint?
            </button>
          )
        )}

        {submitted && q.explanation && (
          <div className={`explanation-box ${isCorrect === true ? 'correct' : 'incorrect'}`}>
            <span className="explanation-label">{isCorrect === true ? '✓ Correct' : '✗ Not quite'}</span>
            {q.explanation_image_url && (
              <img src={q.explanation_image_url} alt="" style={{ maxWidth: '100%', borderRadius: 'var(--r-md)', margin: '10px 0' }} />
            )}
            {q.explanation}
          </div>
        )}
      </div>

      {!submitted && (
        <div className="btn-row">
          <button className="btn" onClick={() => submitAnswer(true)}>Skip</button>
          <button className="btn btn-primary" disabled={selected === null} onClick={() => submitAnswer(false)}>Check answer</button>
        </div>
      )}
      {submitted && (
        <button className="btn btn-primary" onClick={nextQuestion}>
          {index + 1 >= questions.length ? 'See results →' : 'Next question →'}
        </button>
      )}
    </div>
  )
}
