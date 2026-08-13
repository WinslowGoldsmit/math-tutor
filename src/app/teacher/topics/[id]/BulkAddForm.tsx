'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BulkAddForm({ topicId, type }: { topicId: string; type: 'flashcards' | 'mcqs' }) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lastUploadedUrl, setLastUploadedUrl] = useState('')
  const router = useRouter()

  async function handleAdd() {
    setMessage('')
    const res = await fetch(`/api/${type}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, text }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(`${data.added} added${data.skipped ? `, ${data.skipped} skipped` : ''}.`)
      setText('')
      router.refresh()
    } else {
      setMessage(data.message || 'Something went wrong.')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fileName = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('images').upload(fileName, file)
    if (error) {
      setMessage('Image upload failed: ' + error.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    setLastUploadedUrl(data.publicUrl)
    setUploading(false)
  }

  function copyUrl() {
    navigator.clipboard.writeText(lastUploadedUrl)
    setMessage('Link copied — paste it after IMAGE: in your text.')
  }

  const placeholder =
    type === 'flashcards'
      ? 'Q: State the Basic Proportionality Theorem.\nA: A line parallel to one side divides the other two sides in the same ratio.\nIMAGE: (optional)\n---'
      : 'Q: In triangle ABC, DE parallel to BC. Which is correct?\nA) AD/DB = AE/EC\nB) AD/AE = DB/EC\nC) AB/AC = DE/BC only\nD) AD/DB = EC/AE\nCORRECT: A\nEXPLAIN: BPT divides the two sides in the same ratio.\nIMAGE: (optional)\n---'

  return (
    <div style={{ marginTop: '10px' }}>
      <div className="card" style={{ padding: '12px', marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', color: 'var(--ink-soft)', display: 'block', marginBottom: '8px' }}>
          Upload an image (optional)
        </label>
        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ marginBottom: uploading || lastUploadedUrl ? '10px' : 0 }} />
        {uploading && <p className="msg-text">Uploading…</p>}
        {lastUploadedUrl && !uploading && (
          <div>
            <img src={lastUploadedUrl} alt="" style={{ maxWidth: '100px', borderRadius: '8px', display: 'block', marginBottom: '8px' }} />
            <button className="btn btn-small" onClick={copyUrl}>Copy link</button>
          </div>
        )}
      </div>

      <textarea
        className="mono"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        rows={6}
      />
      <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={handleAdd}>
        Add from text
      </button>
      {message && <p className="msg-text">{message}</p>}
    </div>
  )
}