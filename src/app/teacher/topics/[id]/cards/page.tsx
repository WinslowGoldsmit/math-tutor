import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'

export default async function TeacherCardBrowser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  if (!cookieStore.get('is_teacher')?.value) redirect('/login')

  const [
    { data: topic },
    { data: flashcards },
    { data: students },
    { data: schedules },
    { data: accessRows },
  ] = await Promise.all([
    supabaseAdmin.from('topics').select('id, name, chapter_id').eq('id', id).single(),
    supabaseAdmin.from('flashcards').select('id, front').eq('topic_id', id),
    supabaseAdmin.from('students').select('id, name'),
    supabaseAdmin
      .from('flashcard_schedule')
      .select('student_id, flashcard_id, due_date, interval_days, review_count, card_state, ease_factor')
      .in('flashcard_id', []),  // will be replaced below
    supabaseAdmin.from('access').select('student_id, topic_id'),
  ])

  const cardIds = (flashcards ?? []).map(f => f.id)
  const { data: schedulesReal } = cardIds.length
    ? await supabaseAdmin
        .from('flashcard_schedule')
        .select('student_id, flashcard_id, due_date, interval_days, review_count, card_state, ease_factor')
        .in('flashcard_id', cardIds)
    : { data: [] }

  const today = new Date().toISOString().slice(0, 10)

  // Which students have access to this topic
  const accessSet = new Set(
    (accessRows ?? []).filter(a => a.topic_id === parseInt(id)).map(a => a.student_id)
  )
  const hasAccess = (accessRows?.length ?? 0) === 0
    ? (students ?? [])  // no restrictions — all students
    : (students ?? []).filter(s => accessSet.has(s.id))

  // Build per-card, per-student matrix
  type SchRow = { student_id: number; flashcard_id: number; due_date: string; interval_days: number; review_count: number; card_state: string; ease_factor: number }
  const scheduleMap = new Map<string, SchRow>()
  ;((schedulesReal ?? []) as SchRow[]).forEach(s => {
    scheduleMap.set(`${s.student_id}-${s.flashcard_id}`, s)
  })

  const STATE_COLOR: Record<string, string> = {
    new: '#3D7BF5',
    learning: '#9A6700',
    relearning: '#A32A1F',
    review: '#1B7A32',
  }

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href={`/teacher/topics/${id}`} className="back-link">← {topic?.name}</Link>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>Card browser</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginBottom: '20px' }}>
          {flashcards?.length ?? 0} cards · {hasAccess.length} students
        </p>

        {(flashcards ?? []).map(card => {
          const studentStats = hasAccess.map(student => {
            const sch = scheduleMap.get(`${student.id}-${card.id}`)
            return { student, sch }
          })
          const studied = studentStats.filter(s => s.sch).length
          const due = studentStats.filter(s => s.sch && s.sch.due_date <= today).length
          const notStarted = studentStats.filter(s => !s.sch).length

          return (
            <div key={card.id} className="card" style={{ padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>{card.front}</div>

              {/* Summary bar */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--coral-dark)', fontWeight: 600 }}>⚡ {due} due</span>
                <span style={{ color: 'var(--sage-dark)', fontWeight: 600 }}>✓ {studied} studied</span>
                <span style={{ color: 'var(--ink-3)' }}>○ {notStarted} not started</span>
              </div>

              {/* Per-student row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {studentStats.map(({ student, sch }) => {
                  const state = sch?.card_state ?? 'new'
                  const isDue = sch && sch.due_date <= today
                  const color = isDue ? STATE_COLOR['relearning'] : STATE_COLOR[state]
                  const label = !sch ? '○' : isDue ? '!' : state === 'review' ? '✓' : '~'
                  const daysUntil = sch ? Math.round((new Date(sch.due_date).getTime() - new Date(today).getTime()) / 86400000) : null

                  return (
                    <div
                      key={student.id}
                      title={`${student.name} — ${!sch ? 'Not started' : isDue ? 'Due now' : `Due in ${daysUntil}d · ${sch.review_count} reviews`}`}
                      style={{
                        padding: '4px 8px', borderRadius: 'var(--r-full)',
                        fontSize: '11px', fontWeight: 600,
                        background: `${color}18`, color,
                        border: `1px solid ${color}40`,
                        cursor: 'default',
                      }}
                    >
                      {label} {student.name}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {(!flashcards || flashcards.length === 0) && (
          <div className="empty">No flashcards in this topic yet.</div>
        )}
      </div>
    </>
  )
}
