'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SortableList from './SortableList'

type Chapter = { id: number; name: string; emoji: string | null; color: string | null }

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(chapter.name)
  const router = useRouter()

  async function handleSave() {
    await fetch(`/api/chapters/${chapter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: value }),
    })
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="edit-row">
        <input type="text" value={value} onChange={e => setValue(e.target.value)} />
        <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
        <button className="btn btn-primary btn-small" onClick={handleSave}>Save</button>
      </div>
    )
  }

  return (
    <div className="chapter-box" style={{ background: chapter.color || 'var(--bg-sunken)', marginBottom: 0 }}>
      <div className="chapter-box-header" style={{ marginBottom: 0 }}>
        {chapter.emoji && <span className="chapter-emoji">{chapter.emoji}</span>}
        <Link href={`/teacher/chapters/${chapter.id}`} className="chapter-title" style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
          {chapter.name}
        </Link>
        <button className="inline-edit" onClick={() => setEditing(true)}>Edit</button>
      </div>
    </div>
  )
}

export default function ChapterList({ chapters }: { chapters: Chapter[] }) {
  if (!chapters.length) return <div className="empty">No chapters yet. Add one below.</div>
  return (
    <>
      <p className="reorder-hint">Drag ⋮⋮ or use ▲▼ to reorder. Students see this order.</p>
      <SortableList
        items={chapters}
        endpoint="/api/chapters/reorder"
        renderItem={ch => <ChapterCard chapter={ch} />}
      />
    </>
  )
}
