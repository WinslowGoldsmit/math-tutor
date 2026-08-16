'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DeleteButton from '@/app/DeleteButton'

type Mcq = { id: number; question: string; options: string[]; correct_index: number; explanation: string }

export default function McqItem({ mcq }: { mcq: Mcq }) {
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState(mcq.question)
  const [options, setOptions] = useState<string[]>(mcq.options)
  const [correctIndex, setCorrectIndex] = useState(mcq.correct_index)
  const [explanation, setExplanation] = useState(mcq.explanation ?? '')
  const router = useRouter()

  function updateOption(i: number, value: string) {
    const next = [...options]; next[i] = value; setOptions(next)
  }

  async function handleSave() {
    await fetch(`/api/mcqs/${mcq.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options, correct_index: correctIndex, explanation }),
    })
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: '12px' }}>
        <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question" />
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input type="radio" name={`correct-${mcq.id}`} checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
            <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} style={{ marginBottom: 0, flex: 1 }} />
          </div>
        ))}
        <input type="text" value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Explanation" />
        <div className="btn-row">
          <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn btn-primary btn-small" onClick={handleSave}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{mcq.question}</span>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} className="btn-ghost" style={{ fontSize: '12px' }}>Edit</button>
        <DeleteButton id={mcq.id} type="mcqs" />
      </div>
    </div>
  )
}
