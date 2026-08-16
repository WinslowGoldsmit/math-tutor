'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Escape hatch for the focused practice screens.
 * Without this a student inside flashcards or problems had no way back
 * except the browser button.
 */
export default function PracticeNav({
  topicId,
  topicName,
  progress,
}: {
  topicId: string | number
  topicName?: string
  progress?: string
}) {
  const router = useRouter()

  function leave() {
    const ok = window.confirm('Leave this session? Everything you have answered so far is already saved.')
    if (ok) router.push('/student')
  }

  return (
    <div className="practice-nav">
      <Link href={`/student/topics/${topicId}`} className="practice-nav-back" aria-label="Back to topic">
        ← <span>{topicName ?? 'Topic'}</span>
      </Link>
      {progress && <span className="practice-nav-progress">{progress}</span>}
      <button onClick={leave} className="practice-nav-home" aria-label="Back to dashboard">
        Dashboard
      </button>
    </div>
  )
}
