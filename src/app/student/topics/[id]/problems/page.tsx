'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Celebration from '@/app/Celebration'

type Mcq = { id: number; question: string; options: string[]; correct_index: number; explanation?: string; image_url: string | null }

export default function ProblemPractice() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id

  const [questions, setQuestions] = useState<Mcq[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [answeredIds] = useState<Set<number>>(new Set()) // prevent duplicates this session

  useEffect(() => {
    fetch(`/api/mcqs?topic_id=${topicId}`)
      .then(res => res.json())
      .then(data => {
        // Filter out already answered in this session
        const fresh = (data.mcqs ?? []).filter((q: Mcq) => !answeredIds.has(q.id))
        setQuestions(fresh)
        setLoading(false)
      })
  }, [topicId])

  async function submitAnswer(skip: boolean) {
    const q = questions[index]
    answeredIds.add(q.id) // mark as answered this session

    await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcq_id: q.id, selected_index: skip ? null : selected }),
    })
    await fetch('/api/streak', { method: 'POST' })

    if (skip) {
      setSkipped(s => s + 1)
      setSelected(null)
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
    if (index + 1 >= questions.length) setDone(true)
    else setIndex(i => i + 1)
  }

  if (loading) return <div className="loading">Loading problems…</div>

  if (questions.length === 0) return <div className="page"><div className="empty" style={{ marginTop: '40px' }}>No problems in this topic yet.</div></div>

  if (done) {
    const attempted = questions.length - skipped
    const pct = attempted ? Math.round((score / attempted) * 100) : 0
    return (
      <div className="page completion">
        <Celebration />
        <span className="completion-icon">◆</span>
        <p className="completion-title">{questions.length} problems done</p>
        <p>{score}/{attempted} correct · {pct}% accuracy{skipped > 0 ? ` · ${skipped} skipped` : ''}</p>
        <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginTop: '8px' }}>
          {pct >= 80 ? 'Strong work — you clearly understand this topic.' : pct >= 50 ? 'Good effort. Review the ones you found tricky.' : 'Keep practicing — each attempt builds understanding.'}
        </p>
        <button className="btn" style={{ marginTop: '24px', width: 'auto' }} onClick={() => router.back()}>Back to topic</button>
      </div>
    )
  }

  const q = questions[index]

  return (
    <div className="page">
      <p className="progress-label">
        Question {index + 1} of {questions.length}
        {score > 0 && <span style={{ color: 'var(--sage-dark)' }}> · {score} correct</span>}
      </p>

      <div className="card anim-fade-up" key={index} style={{ padding: '20px', marginBottom: '16px' }}>
        {q.image_url && <img src={q.image_url} alt="Question diagram" style={{ maxWidth: '100%', borderRadius: 'var(--r-md)', marginBottom: '14px' }} />}
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

        {submitted && q.explanation && (
          <div className={`explanation-box ${isCorrect === true ? 'correct' : 'incorrect'}`}>
            <span className="explanation-label">{isCorrect === true ? '✓ Correct' : '✗ Not quite'}</span>
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
