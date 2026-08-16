'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * One image slot. Accepts:
 *   - Ctrl/Cmd+V paste straight from a screenshot or textbook scan
 *   - drag and drop
 *   - normal file picker
 *   - a pasted URL
 *
 * Uploads to the Supabase 'images' bucket from the browser (this is the one
 * place the public client is used, by design).
 */
export default function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('That file is not an image.'); return }
    setError('')
    setUploading(true)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'pasted.png'
    const fileName = `${Date.now()}-${safeName}`
    const { error: upErr } = await supabase.storage.from('images').upload(fileName, file)
    if (upErr) {
      setError('Upload failed: ' + upErr.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    onChange(data.publicUrl)
    setUploading(false)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (!item) return // let plain text paste through (e.g. a URL)
    e.preventDefault()
    const file = item.getAsFile()
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="image-field">
      <div className="picker-label">{label}</div>

      <div
        className={`image-drop ${dragging ? 'is-dragging' : ''}`}
        onPaste={handlePaste}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label={`${label} — click, paste or drop an image`}
      >
        {uploading ? (
          <span>Uploading…</span>
        ) : value ? (
          <img src={value} alt="" className="image-drop-preview" />
        ) : (
          <span>Click, paste (Ctrl+V) or drop an image</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
      />

      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        style={{ marginTop: '6px', fontSize: '12px' }}
      />

      {value && (
        <button type="button" className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => onChange('')}>
          Remove image
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
