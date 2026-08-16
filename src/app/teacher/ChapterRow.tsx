'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChapterRow({ id, name }: { id: number; name: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const router = useRouter()

  async function handleSave() {
    await fetch(`/api/chapters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: value }),
    })
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="edit-row" style={{ marginBottom: '8px' }}>
        <input type="text" value={value} onChange={e => setValue(e.target.value)} />
        <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
        <button className="btn btn-primary btn-small" onClick={handleSave}>Save</button>
      </div>
    )
  }

  return (
    <div className="list-link" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href={`/teacher/chapters/${id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
        {name}
      </Link>
      <button
        onClick={() => setEditing(true)}
        style={{ background: 'none', border: 'none', color: 'var(--teal-dark)', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}
      >
        Edit
      </button>
    </div>
  )
}
