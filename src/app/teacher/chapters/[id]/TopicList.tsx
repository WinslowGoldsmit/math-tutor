'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SortableList from '@/app/teacher/SortableList'
import DeleteButton from '@/app/DeleteButton'
import { TOPIC_COLORS, TOPIC_EMOJIS } from '@/lib/topicStyle'

type Topic = { id: number; name: string; emoji: string | null; color: string | null }

function TopicCard({ topic }: { topic: Topic }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(topic.name)
  const [emoji, setEmoji] = useState(topic.emoji || TOPIC_EMOJIS[0])
  const [color, setColor] = useState(topic.color || TOPIC_COLORS[0].value)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/topics/${topic.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji, color }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: '12px' }}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Topic name" />

        <div className="picker-label">Emoji</div>
        <div className="picker-row">
          {TOPIC_EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setEmoji(e)} className={`picker-emoji ${emoji === e ? 'is-active' : ''}`}>{e}</button>
          ))}
        </div>

        <div className="picker-label">Colour</div>
        <div className="picker-row">
          {TOPIC_COLORS.map(c => (
            <button key={c.value} type="button" onClick={() => setColor(c.value)} title={c.label}
              className={`picker-swatch ${color === c.value ? 'is-active' : ''}`}
              style={{ background: c.value, borderColor: color === c.value ? c.border : 'transparent' }} />
          ))}
        </div>

        <div className="btn-row">
          <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn btn-primary btn-small" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="topic-box" style={{ background: topic.color || 'var(--bg-sunken)' }}>
      <span className="topic-emoji">{topic.emoji || '📄'}</span>
      <Link href={`/teacher/topics/${topic.id}`} className="topic-box-title">{topic.name}</Link>
      <button className="inline-edit" onClick={() => setEditing(true)}>Edit</button>
      <DeleteButton id={topic.id} type="topics" />
    </div>
  )
}

export default function TopicList({ topics }: { topics: Topic[] }) {
  if (!topics.length) {
    return <div className="empty">No topics yet. Add one below to start building content.</div>
  }
  return (
    <>
      <p className="reorder-hint">Drag ⋮⋮ or use ▲▼ to reorder. Students see this order.</p>
      <SortableList
        items={topics}
        endpoint="/api/topics/reorder"
        renderItem={t => <TopicCard topic={t} />}
      />
    </>
  )
}
