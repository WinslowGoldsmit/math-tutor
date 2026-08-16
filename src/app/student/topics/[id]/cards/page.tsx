import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'

type CardRow = {
  id: number
  front: string
  back: string
  schedule: {
    due_date: string
    interval_days: number
    review_count: number
    card_state: string
    ease_factor: number
  } | null
}

const STATE_LABEL: Record<string, string> = {
  new: 'New',
  learning: 'Learning',
  relearning: 'Relearning',
  review: 'Review',
}
const STATE_COLOR: Record<string, string> = {
  new: 'var(--accent)',
  learning: 'var(--amber-dark)',
  relearning: 'var(--coral-dark)',
  review: 'var(--sage-dark)',
}

export default async function CardBrowser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) redirect('/login')

  const [{ data: topic }, { data: flashcards }, { data: schedules }] = await Promise.all([
    supabaseAdmin.from('topics').select('id, name').eq('id', id).single(),
    supabaseAdmin.from('flashcards').select('id, front, back').eq('topic_id', id),
    supabaseAdmin
      .from('flashcard_schedule')
      .select('flashcard_id, due_date, interval_days, review_count, card_state, ease_factor')
      .eq('student_id', studentId),
  ])

  const scheduleMap = new Map((schedules ?? []).map(s => [s.flashcard_id, s]))
  const today = new Date().toISOString().slice(0, 10)

  const cards: CardRow[] = (flashcards ?? []).map(f => ({
    id: f.id,
    front: f.front,
    back: f.back,
    schedule: scheduleMap.get(f.id) ?? null,
  }))

  // Sort: due first, then learning, then new
  const order = (c: CardRow) => {
    if (!c.schedule) return 3
    const state = c.schedule.card_state ?? 'new'
    if (c.schedule.due_date <= today) return 0
    if (state === 'learning' || state === 'relearning') return 1
    return 2
  }
  cards.sort((a, b) => order(a) - order(b))

  const dueCount = cards.filter(c => c.schedule && c.schedule.due_date <= today).length
  const newCount = cards.filter(c => !c.schedule).length
  const reviewCount = cards.filter(c => c.schedule?.card_state === 'review').length

  function formatDue(due: string) {
    if (due <= today) return 'Due now'
    const days = Math.round((new Date(due).getTime() - new Date(today).getTime()) / 86400000)
    if (days === 1) return 'Tomorrow'
    return `In ${days} days`
  }

  return (
    <>
      <Topbar role="student" />
      <div className="page" style={{ paddingTop: '16px' }}>
        <Link href={`/student/topics/${id}`} className="back-link">← {topic?.name}</Link>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>All cards</h1>

        {/* Summary row */}
        <div className="card-browser-summary">
          <div className="browser-stat">
            <span className="browser-stat-n" style={{ color: 'var(--coral-dark)' }}>{dueCount}</span>
            <span className="browser-stat-l">Due now</span>
          </div>
          <div className="browser-stat">
            <span className="browser-stat-n" style={{ color: 'var(--accent)' }}>{newCount}</span>
            <span className="browser-stat-l">New</span>
          </div>
          <div className="browser-stat">
            <span className="browser-stat-n" style={{ color: 'var(--sage-dark)' }}>{reviewCount}</span>
            <span className="browser-stat-l">Scheduled</span>
          </div>
          <div className="browser-stat">
            <span className="browser-stat-n">{cards.length}</span>
            <span className="browser-stat-l">Total</span>
          </div>
        </div>

        <Link href={`/student/topics/${id}/flashcards`} className="btn btn-primary" style={{ display: 'block', marginBottom: '20px', textAlign: 'center', textDecoration: 'none' }}>
          Start practice →
        </Link>

        {cards.map(c => {
          const state = c.schedule?.card_state ?? 'new'
          const isDue = c.schedule && c.schedule.due_date <= today
          return (
            <div key={c.id} className={`browser-card ${isDue ? 'is-due' : ''}`}>
              <div className="browser-card-front">{c.front}</div>
              <div className="browser-card-back">{c.back}</div>
              <div className="browser-card-meta">
                <span className="state-pill" style={{
                  background: `color-mix(in srgb, ${STATE_COLOR[state]} 12%, white)`,
                  color: STATE_COLOR[state],
                }}>
                  {STATE_LABEL[state] ?? 'New'}
                </span>
                {c.schedule ? (
                  <>
                    <span>{formatDue(c.schedule.due_date)}</span>
                    <span>{c.schedule.review_count} review{c.schedule.review_count === 1 ? '' : 's'}</span>
                    {c.schedule.interval_days > 0 && (
                      <span>Every {c.schedule.interval_days}d</span>
                    )}
                  </>
                ) : (
                  <span style={{ color: 'var(--ink-3)' }}>Not studied yet</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
