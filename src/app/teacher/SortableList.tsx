'use client'

import { useState, useRef } from 'react'

/**
 * Teacher-only drag-to-reorder. Uses native HTML5 drag events so no extra
 * npm package is needed. Students never render this component.
 *
 * Optimistic: the list reorders instantly, then the new order is saved.
 * If the save fails we roll back and tell the teacher.
 */
export default function SortableList<T extends { id: number }>({
  items,
  endpoint,
  renderItem,
  onOrderChange,
}: {
  items: T[]
  endpoint: string
  renderItem: (item: T, index: number) => React.ReactNode
  onOrderChange?: (ids: number[]) => void
}) {
  const [order, setOrder] = useState<T[]>(items)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const previous = useRef<T[]>(items)

  async function persist(next: T[]) {
    setStatus('Saving order…')
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map(i => i.id) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setOrder(previous.current)
        setStatus(data.message || 'Could not save the new order.')
        return
      }
      previous.current = next
      onOrderChange?.(next.map(i => i.id))
      setStatus('Order saved ✓')
      setTimeout(() => setStatus(''), 1600)
    } catch {
      setOrder(previous.current)
      setStatus('Network problem — order not saved.')
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= order.length) return
    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrder(next)
    persist(next)
  }

  function handleDrop(index: number) {
    if (dragIndex === null) return
    move(dragIndex, index)
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div>
      {order.map((item, i) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={e => { e.preventDefault(); setOverIndex(i) }}
          onDragLeave={() => setOverIndex(null)}
          onDrop={e => { e.preventDefault(); handleDrop(i) }}
          onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
          className={`sortable-row ${dragIndex === i ? 'is-dragging' : ''} ${overIndex === i && dragIndex !== i ? 'is-over' : ''}`}
        >
          <div className="sortable-handle" aria-hidden="true" title="Drag to reorder">⋮⋮</div>
          <span className="sortable-number">{i + 1}</span>
          <div className="sortable-body">{renderItem(item, i)}</div>
          {/* Keyboard / touch fallback — drag alone is not accessible */}
          <div className="sortable-arrows">
            <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">▲</button>
            <button onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label="Move down">▼</button>
          </div>
        </div>
      ))}
      {status && <p className="msg-text" style={{ marginTop: '6px' }}>{status}</p>}
    </div>
  )
}
