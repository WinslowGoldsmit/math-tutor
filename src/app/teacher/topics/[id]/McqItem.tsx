'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DeleteButton from '@/app/DeleteButton'
import ImageField from '@/app/teacher/ImageField'

type Mcq = {
  id: number
  question: string
  options: string[]
  correct_index: number
  explanation: string
  hint?: string | null
  image_url?: string | null
  explanation_image_url?: string | null
}

export default function McqItem({ mcq }: { mcq: Mcq }) {
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState(mcq.question)
  const [options, setOptions] = useState<string[]>(mcq.options ?? ['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(mcq.correct_index)
  const [explanation, setExplanation] = useState(mcq.explanation ?? '')
  const [hint, setHint] = useState(mcq.hint ?? '')
  const [imageUrl, setImageUrl] = useState(mcq.image_url ?? '')
  const [explanationImageUrl, setExplanationImageUrl] = useState(mcq.explanation_image_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function updateOption(i: number, value: string) {
    const next = [...options]; next[i] = value; setOptions(next)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/mcqs/${mcq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, options, correct_index: correctIndex, explanation, hint,
          image_url: imageUrl, explanation_image_url: explanationImageUrl,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Could not save this problem.')
        setSaving(false)
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError('Network problem — please try again.')
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: '14px' }}>
        <div className="picker-label">Question</div>
        <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} placeholder="Question" />
        <ImageField label="Question image" value={imageUrl} onChange={setImageUrl} />

        <div className="picker-label" style={{ marginTop: '14px' }}>Options (select the correct one)</div>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input type="radio" name={`correct-${mcq.id}`} checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
            <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} style={{ marginBottom: 0, flex: 1 }} />
          </div>
        ))}

        <div className="picker-label" style={{ marginTop: '14px' }}>Hint (optional — student can reveal before answering)</div>
        <input type="text" value={hint} onChange={e => setHint(e.target.value)} placeholder="e.g. Think about which sides are opposite the equal angles" />

        <div className="picker-label" style={{ marginTop: '14px' }}>Explanation (shown after answering)</div>
        <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2} placeholder="Explanation" />
        <ImageField label="Explanation image" value={explanationImageUrl} onChange={setExplanationImageUrl} />

        <div className="btn-row">
          <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn btn-primary btn-small" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
      <span style={{ flex: 1 }}>
        {(mcq.image_url || mcq.explanation_image_url) && <span title="Has image" style={{ marginRight: '6px' }}>🖼</span>}
        {mcq.hint && <span title="Has hint" style={{ marginRight: '6px' }}>💡</span>}
        {mcq.question}
      </span>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} className="btn-ghost" style={{ fontSize: '12px' }}>Edit</button>
        <DeleteButton id={mcq.id} type="mcqs" />
      </div>
    </div>
  )
}
