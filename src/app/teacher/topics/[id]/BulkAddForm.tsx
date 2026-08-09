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
      ? 'Q: State the Basic Proportionality Theorem.\nA: A line parallel to one side divides the other two sides in the same ratio.\nIMAGE: (optional, paste uploaded link here)\n---'
      : 'Q: In triangle ABC, DE parallel to BC. Which is correct?\nA) AD/DB = AE/EC\nB) AD/AE = DB/EC\nC) AB/AC = DE/BC only\nD) AD/DB = EC/AE\nCORRECT: A\nEXPLAIN: BPT divides the two sides in the same ratio.\nIMAGE: (optional, paste uploaded link here)\n---'

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px dashed #ccc', borderRadius: '8px' }}>
        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
          Upload an image (optional)
        </label>
        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
        {uploading && <p style={{ fontSize: '12px', color: '#888' }}>Uploading…</p>}
        {lastUploadedUrl && !uploading && (
          <div style={{ marginTop: '6px' }}>
            <img src={lastUploadedUrl} alt="" style={{ maxWidth: '120px', borderRadius: '6px', display: 'block', marginBottom: '6px' }} />
            <button onClick={copyUrl} style={{ fontSize: '12px', padding: '4px 10px' }}>Copy link</button>
          </div>
        )}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        rows={6}
        style={{ width: '100%', padding: '10px', fontFamily: 'monospace', fontSize: '12px', boxSizing: 'border-box' }}
      />
      <button onClick={handleAdd} style={{ marginTop: '8px', padding: '8px 14px' }}>
        Add from text
      </button>
      {message && <p style={{ fontSize: '13px', color: '#666' }}>{message}</p>}
    </div>
  )
}