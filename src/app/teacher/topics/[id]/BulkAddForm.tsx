'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageField from '@/app/teacher/ImageField'

export default function BulkAddForm({ topicId, type }: { topicId: string; type: 'flashcards' | 'mcqs' }) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)
  const [helperUrl, setHelperUrl] = useState('')
  const router = useRouter()

  async function handleAdd() {
    setMessage('')
    setAdding(true)
    try {
      const res = await fetch(`/api/${type}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, text }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage(`${data.added} added${data.skipped ? `, ${data.skipped} skipped` : ''}.`)
        setText('')
        router.refresh()
      } else {
        setMessage(data.message || 'Something went wrong.')
      }
    } catch {
      setMessage('Network problem — please try again.')
    }
    setAdding(false)
  }

  function insertTag(tag: string) {
    if (!helperUrl) return
    setText(t => `${t}${t.endsWith('\n') || t === '' ? '' : '\n'}${tag}: ${helperUrl}\n`)
    setMessage(`${tag} line added to the text below.`)
  }

  const placeholder = type === 'flashcards'
    ? 'Q: State the Basic Proportionality Theorem.\nA: A line parallel to one side divides the other two sides in the same ratio.\nIMAGE: (optional — question image)\nAIMAGE: (optional — answer image)\n---'
    : 'Q: Which proportion is correct for BPT?\nA) AD/DB = AE/EC\nB) AD/AE = DB/EC\nC) AB/AC = DE/BC\nD) AD/DB = EC/AE\nCORRECT: A\nHINT: (optional)\nEXPLAIN: BPT divides proportionally.\nIMAGE: (optional — question image)\nEIMAGE: (optional — explanation image)\n---'

  return (
    <div style={{ marginTop: '12px' }}>
      <div className="card" style={{ padding: '14px', marginBottom: '10px' }}>
        <ImageField label="Upload an image to use below" value={helperUrl} onChange={setHelperUrl} />
        {helperUrl && (
          <div className="btn-row" style={{ marginTop: '8px' }}>
            <button className="btn btn-small" onClick={() => insertTag('IMAGE')}>Use as question image</button>
            <button className="btn btn-small" onClick={() => insertTag(type === 'flashcards' ? 'AIMAGE' : 'EIMAGE')}>
              {type === 'flashcards' ? 'Use as answer image' : 'Use as explanation image'}
            </button>
          </div>
        )}
      </div>

      <textarea className="mono" value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} rows={7} />
      <button className="btn btn-primary btn-small" style={{ marginTop: '4px' }} onClick={handleAdd} disabled={adding || !text.trim()}>
        {adding ? 'Adding…' : 'Add from text'}
      </button>
      {message && <p className="msg-text">{message}</p>}
    </div>
  )
}
