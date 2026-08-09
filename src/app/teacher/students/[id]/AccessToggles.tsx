'use client'

import { useState } from 'react'

type Topic = { id: number; name: string }

export default function AccessToggles({
  studentId,
  allTopics,
  initiallyAllowed,
}: {
  studentId: string
  allTopics: Topic[]
  initiallyAllowed: number[]
}) {
  const [allowed, setAllowed] = useState<number[]>(initiallyAllowed)

  async function toggle(topicId: number) {
    const isOn = allowed.includes(topicId)
    const next = isOn ? allowed.filter(id => id !== topicId) : [...allowed, topicId]
    setAllowed(next)

    await fetch('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, topic_id: topicId, allow: !isOn }),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {allTopics.map(t => {
        const on = allowed.includes(t.id)
        return (
          <div
            key={t.id}
            onClick={() => toggle(t.id)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '13px' }}>{t.name}</span>
            <span style={{
              fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
              background: on ? '#E6F0E4' : '#eee', color: on ? '#365B3A' : '#888',
            }}>
              {on ? 'Allowed' : 'Locked'}
            </span>
          </div>
        )
      })}
    </div>
  )
}