'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const LABELS: Record<string, string> = {
  flashcards: 'flashcard',
  mcqs: 'problem',
  topics: 'topic',
  chapters: 'chapter',
  students: 'student',
}

/**
 * Two-step delete.
 * Step 1 asks plainly. If the server replies 409 the item still has content,
 * so step 2 shows exactly what will be lost before forcing the delete.
 */
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
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const noun = LABELS[type] ?? 'item'

  async function handleDelete() {
    if (busy) return
    if (!window.confirm(`Delete this ${noun}?`)) return

    setBusy(true)
    try {
      let res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' })

      if (res.status === 409) {
        const info = await res.json()
        const proceed = window.confirm(
          `${info.message}\n\nDeleting the ${noun} will permanently remove all of that too. This cannot be undone.\n\nDelete everything?`
        )
        if (!proceed) { setBusy(false); return }
        res = await fetch(`/api/${type}/${id}?force=true`, { method: 'DELETE' })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.message || `Could not delete this ${noun}.`)
        setBusy(false)
        return
      }

      if (redirectTo) router.push(redirectTo)
      else router.refresh()
    } catch {
      alert('Network problem — please try again.')
    }
    setBusy(false)
  }

  return (
    <button onClick={handleDelete} className="btn-danger btn-small" disabled={busy}>
      {busy ? 'Deleting…' : (label ?? 'Delete')}
    </button>
  )
}
