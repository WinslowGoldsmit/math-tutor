'use client'

import { useRouter } from 'next/navigation'

export default function DeleteButton({
  id,
  type,
  redirectTo,
}: {
  id: number
  type: 'flashcards' | 'mcqs' | 'topics' | 'chapters'
  redirectTo?: string
}) {
  const router = useRouter()

  async function handleDelete() {
    const confirmed = window.confirm('Delete this item? This cannot be undone.')
    if (!confirmed) return
    const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.message || 'Could not delete — it may still contain other items.')
      return
    }
    if (redirectTo) router.push(redirectTo)
    else router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      style={{ background: 'none', border: 'none', color: 'var(--coral-dark)', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}
    >
      Delete
    </button>
  )
}