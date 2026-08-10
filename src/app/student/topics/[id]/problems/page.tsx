'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Mcq = { id: number; question: string; options: string[]; image_url: string | null }

export default function ProblemPractice() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id

  const [questions, setQuestions] = useState<Mcq[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/mcqs?topic_id=${topicId}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.mcqs ?? [])
        setLoading(false)
      })
  }, [topicId])

  async function submitAndNext(skip: boolean) {
    const q = questions[index]
    await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcq_id: q.id, selected_index: skip ? null : selected }),
    })
    await fetch('/api/streak', { method: 'POST' })
    setSelected(null)
    setIndex(i => i + 1)
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--ink-soft)' }}>Loading…</div>

  if (index >= questions.length) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p style={{ color: 'var(--ink-soft)' }}>That&apos;s the set — {questions.length} problems done.</p>
        <button className="btn" style={{ marginTop: '16px', width: 'auto', padding: '10px 20px' }} onClick={() => router.back()}>
          Back to topic
        </button>
      </div>
    )
  }

  const q = questions[index]

  return (
    <div className="page">
      <p className="progress-label">Question {index + 1} of {questions.length}</p>

      <div className="card" style={{ padding: '20px', marginBottom: '18px' }}>
        {q.image_url && (
          <img src={q.image_url} alt="" style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '14px' }} />
        )}
        <p style={{ fontSize: '16px', marginBottom: '16px', lineHeight: 1.5 }}>{q.question}</p>

        {q.options.map((opt, i) => (
          <div
            key={i}
            className={`opt ${selected === i ? 'selected' : ''}`}
            onClick={() => setSelected(i)}
          >
            <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
          </div>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={() => submitAndNext(true)}>Skip</button>
        <button className="btn btn-primary" disabled={selected === null} onClick={() => submitAndNext(false)}>
          Next
        </button>
      </div>
    </div>
  )
}