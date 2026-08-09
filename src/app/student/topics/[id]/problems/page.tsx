'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Mcq = {
  id: number
  question: string
  options: string[]
  image_url: string | null
}

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
    body: JSON.stringify({
      mcq_id: q.id,
      selected_index: skip ? null : selected,
    }),
  })
  await fetch('/api/streak', { method: 'POST' })
  setSelected(null)
  setIndex(i => i + 1)
}
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  if (index >= questions.length) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>That&apos;s the set — {questions.length} problems done.</p>
        <button onClick={() => router.back()} style={{ marginTop: '16px', padding: '10px 20px' }}>Back to topic</button>
      </div>
    )
  }

  const q = questions[index]

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '14px' }}>
        Question {index + 1} of {questions.length}
      </p>

      <div style={{ border: '1px solid #ddd', borderRadius: '16px', padding: '20px', marginBottom: '18px' }}>
        {q.image_url && (
          <img src={q.image_url} alt="" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '14px' }} />
        )}
        <p style={{ fontSize: '16px', marginBottom: '16px', lineHeight: 1.5 }}>{q.question}</p>

        {q.options.map((opt, i) => (
          <div
            key={i}
            onClick={() => setSelected(i)}
            style={{
              padding: '12px 14px',
              border: selected === i ? '1px solid #33636A' : '1px solid #ddd',
              background: selected === i ? '#E2EDEC' : '#fff',
              borderRadius: '10px',
              marginBottom: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => submitAndNext(true)} style={{ flex: 1, padding: '12px' }}>Skip</button>
        <button
          onClick={() => submitAndNext(false)}
          disabled={selected === null}
          style={{ flex: 1, padding: '12px' }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
