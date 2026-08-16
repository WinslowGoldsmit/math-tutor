'use client'

import { useState } from 'react'

type Topic = { id: number; name: string }

export default function AccessToggles({ studentId, allTopics, initiallyAllowed }: { studentId: string; allTopics: Topic[]; initiallyAllowed: number[] }) {
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
    <div>
      {allTopics.map(t => {
        const on = allowed.includes(t.id)
        return (
          <div key={t.id} className="toggle-row" onClick={() => toggle(t.id)}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{t.name}</span>
            <span className={`toggle-status ${on ? 'toggle-on' : 'toggle-off'}`}>{on ? 'Allowed' : 'Locked'}</span>
          </div>
        )
      })}
    </div>
  )
}
