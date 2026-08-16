'use client'

import { useRouter } from 'next/navigation'

export default function DeleteButton({
  id,
  type,
  redirectTo,
  label,
}: {
  id: number
  type: 'flashcards' | 'mcqs' | 'topics' | 'chapters' | 'students'
  redirectTo?: string
  label?: string
}) {
  const router = useRouter()

  async function handleDelete() {
    const confirmed = window.confirm(`Delete this ${type === 'students' ? 'student' : 'item'}? This can't be undone.`)
    if (!confirmed) return
    const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.message || 'Couldn\'t delete — it may still have items inside it.')
      return
    }
    if (redirectTo) router.push(redirectTo)
    else router.refresh()
  }

  return (
    <button onClick={handleDelete} className="btn-danger btn-small">
      {label ?? 'Delete'}
    </button>
  )
}
