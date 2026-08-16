import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'

export default async function TopicHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value

  // Parallel queries
  const [
    { data: topic },
    { data: allFlashcards },
    { data: allMcqs },
  ] = await Promise.all([
    supabaseAdmin.from('topics').select('id, name').eq('id', id).single(),
    supabaseAdmin.from('flashcards').select('id').eq('topic_id', id),
    supabaseAdmin.from('mcqs').select('id').eq('topic_id', id),
  ])

  const fcCount = allFlashcards?.length ?? 0
  const mcqCount = allMcqs?.length ?? 0
  let fcReviewed = 0, mcqAnswered = 0, dueCount = 0

  if (studentId && (fcCount > 0 || mcqCount > 0)) {
    const fcIds = (allFlashcards ?? []).map(f => f.id)
    const mcqIds = (allMcqs ?? []).map(m => m.id)

    const [reviewsRes, attemptsRes, schedulesRes] = await Promise.all([
      fcIds.length
        ? supabaseAdmin.from('reviews').select('flashcard_id').eq('student_id', studentId).in('flashcard_id', fcIds)
        : Promise.resolve({ data: [] }),
      mcqIds.length
        ? supabaseAdmin.from('attempts').select('mcq_id').eq('student_id', studentId).in('mcq_id', mcqIds)
        : Promise.resolve({ data: [] }),
      fcIds.length
        ? supabaseAdmin.from('flashcard_schedule').select('flashcard_id, due_date').eq('student_id', studentId).in('flashcard_id', fcIds)
        : Promise.resolve({ data: [] }),
    ])

    fcReviewed = new Set((reviewsRes.data ?? []).map((r: any) => r.flashcard_id)).size
    mcqAnswered = new Set((attemptsRes.data ?? []).map((a: any) => a.mcq_id)).size

    const today = new Date().toISOString().slice(0, 10)
    const schedules = schedulesRes.data ?? []
    const scheduledIds = new Set(schedules.map((s: any) => s.flashcard_id))
    const newCards = fcIds.filter(id => !scheduledIds.has(id)).length
    const overdue = schedules.filter((s: any) => s.due_date <= today).length
    dueCount = overdue + Math.min(newCards, 10)
  }

  const fcPct = fcCount ? Math.min(100, Math.round((fcReviewed / fcCount) * 100)) : 0
  const mcqPct = mcqCount ? Math.min(100, Math.round((mcqAnswered / mcqCount) * 100)) : 0

  return (
    <div className="page">
      <Link href="/student" className="back-link">← Topics</Link>
      <h1 className="page-title" style={{ marginBottom: '28px' }}>{topic?.name}</h1>

      <div className="mode-grid">
        <Link href={`/student/topics/${id}/flashcards`} className="mode-card">
          <div className="n" style={{ color: dueCount > 0 ? 'var(--accent)' : 'var(--ink-2)' }}>
            {dueCount > 0 ? dueCount : fcCount}
          </div>
          <div className="l">{dueCount > 0 ? 'Due today' : 'Flashcards'}</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${fcPct}%` }} />
          </div>
          <div className="progress-meta">
            <span>{fcReviewed} reviewed</span><span>{fcPct}%</span>
          </div>
        </Link>
        <Link href={`/student/topics/${id}/problems`} className="mode-card">
          <div className="n" style={{ color: 'var(--ink-2)' }}>{mcqCount}</div>
          <div className="l">Problems</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${mcqPct}%` }} />
          </div>
          <div className="progress-meta">
            <span>{mcqAnswered} answered</span><span>{mcqPct}%</span>
          </div>
        </Link>
      </div>

      {fcCount > 0 && (
        <Link
          href={`/student/topics/${id}/cards`}
          className="text-link"
          style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px' }}
        >
          Browse all {fcCount} cards →
        </Link>
      )}
    </div>
  )
}
