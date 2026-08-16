import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'

export default async function ProgressMap() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  const studentClass = cookieStore.get('student_class')?.value ?? '10'
  if (!studentId) redirect('/login')

  const [
    { data: allTopics },
    { data: accessRows },
    { data: allFlashcards },
    { data: allMcqs },
    { data: reviews },
    { data: attemptsRaw },
    { data: archivedMessages },
  ] = await Promise.all([
    supabaseAdmin.from('topics').select('id, name, order_index').order('order_index'),
    supabaseAdmin.from('access').select('topic_id').eq('student_id', studentId),
    supabaseAdmin.from('flashcards').select('id, topic_id'),
    supabaseAdmin.from('mcqs').select('id, topic_id'),
    supabaseAdmin.from('reviews').select('flashcard_id').eq('student_id', studentId),
    supabaseAdmin.from('attempts').select('mcq_id, is_correct').eq('student_id', studentId),
    // Archive = read messages that still exist (not yet auto-deleted)
    supabaseAdmin
      .from('student_messages')
      .select('id, message, created_at')
      .eq('student_id', studentId)
      .eq('is_read', true)
      .order('created_at', { ascending: false }),
  ])

  const allowedIds = accessRows?.map(r => r.topic_id) ?? []
  const hasRestrictions = allowedIds.length > 0
  const reviewedIds = new Set((reviews ?? []).map(r => r.flashcard_id))
  const attemptedIds = new Set((attemptsRaw ?? []).map(a => a.mcq_id))

  function formatTime(ts: string) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Topbar role="student" name={`Class ${studentClass}`} />
      <div className="page" style={{ paddingTop: '16px' }}>
        <Link href="/student" className="back-link">← Home</Link>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>Your progress</h1>
        <p className="page-sub">Every topic and how far you&apos;ve come.</p>

        {(!allTopics || allTopics.length === 0) && (
          <div className="empty">No topics added yet — your teacher is setting things up.</div>
        )}

        {allTopics?.map((topic, i) => {
          const locked = hasRestrictions && !allowedIds.includes(topic.id)
          const topicCards = (allFlashcards ?? []).filter(f => f.topic_id === topic.id)
          const topicMcqs = (allMcqs ?? []).filter(m => m.topic_id === topic.id)
          const fcDone = topicCards.filter(c => reviewedIds.has(c.id)).length
          const mcqDone = topicMcqs.filter(m => attemptedIds.has(m.id)).length
          const totalItems = topicCards.length + topicMcqs.length
          const doneItems = fcDone + mcqDone
          const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0
          const isComplete = pct >= 100
          const isReady = !locked && pct >= 80 && !isComplete

          const topicMcqIds = new Set(topicMcqs.map(m => m.id))
          const topicAttempts = (attemptsRaw ?? []).filter(a => topicMcqIds.has(a.mcq_id) && a.is_correct !== null)
          const correctCount = topicAttempts.filter(a => a.is_correct === true).length
          const accuracyStr = topicAttempts.length
            ? `${Math.round((correctCount / topicAttempts.length) * 100)}% accuracy`
            : null

          return (
            <div
              key={topic.id}
              className={`map-node anim-slide-right ${locked ? 'locked' : isComplete ? 'complete' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="map-title-row">
                <strong style={{ fontSize: '14px' }}>{topic.name}</strong>
                {locked ? (
                  <span className="pill pill-muted">Locked</span>
                ) : isComplete ? (
                  <span className="pill pill-sage">Complete ✓</span>
                ) : isReady ? (
                  <span className="pill">{pct}% — keep going</span>
                ) : (
                  <span className="pill pill-muted">{pct}%</span>
                )}
              </div>
              {!locked && (
                <>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${pct >= 80 ? 'sage' : pct >= 40 ? '' : 'amber'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="progress-meta">
                    <span>{fcDone}/{topicCards.length} cards · {mcqDone}/{topicMcqs.length} problems</span>
                    {accuracyStr && <span>{accuracyStr}</span>}
                  </div>
                  {isReady && (
                    <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '6px', fontWeight: 500 }}>
                      You&apos;re ready for what comes next. Keep going.
                    </p>
                  )}
                </>
              )}
            </div>
          )
        })}

        {/* ---- Notes archive ---- */}
        {archivedMessages && archivedMessages.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div className="section-label">Past notes from your teacher</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-3)', marginBottom: '12px' }}>
              Notes are kept for 3 days after you read them.
            </p>
            {archivedMessages.map(m => (
              <div key={m.id} className="message-card" style={{ opacity: 0.75 }}>
                <div className="msg-from">Teacher</div>
                <div className="msg-text">{m.message}</div>
                <div className="msg-time">{formatTime(m.created_at)}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}
