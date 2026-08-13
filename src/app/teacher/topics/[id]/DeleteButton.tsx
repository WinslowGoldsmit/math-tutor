'use client'

import { useRouter } from 'next/navigation'

export default function DeleteButton({ id, type }: { id: number; type: 'flashcards' | 'mcqs' }) {
  const router = useRouter()

  async function handleDelete() {
    const confirmed = window.confirm('Delete this item? This cannot be undone.')
    if (!confirmed) return
    await fetch(`/api/${type}/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--coral-dark)',
        fontSize: '12px',
        cursor: 'pointer',
        padding: '4px 8px',
      }}
    >
      Delete
    </button>
  )
}