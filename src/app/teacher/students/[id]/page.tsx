import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'
import AccessToggles from './AccessToggles'
import DeleteButton from '@/app/DeleteButton'
import SendMessage from './SendMessage'
import { badgeLabel, getBadgeTier } from '@/lib/badges'

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [
    { data: student },
    { data: reviews },
    { data: attempts },
    { data: allTopics },
    { data: accessRows },
    { data: profile },
    { data: streak },
    { data: badges },
    { data: messages },
    { data: allFlashcards },
  ] = await Promise.all([
    supabaseAdmin.from('students').select('id, name, class').eq('id', id).single(),
    supabaseAdmin.from('reviews').select('id, rating, flashcard_id, flashcards(front, topic_id)').eq('student_id', id),
    supabaseAdmin.from('attempts').select('id, selected_index, is_correct, created_at, mcqs(id, question, options, correct_index, topic_id)').eq('student_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('topics').select('id, name, chapter_id').order('order_index'),
    supabaseAdmin.from('access').select('topic_id').eq('student_id', id),
    supabaseAdmin.from('student_profile').select('avatar').eq('student_id', id).maybeSingle(),
    supabaseAdmin.from('streaks').select('count').eq('student_id', id).single(),
    supabaseAdmin.from('badges').select('badge_key, earned_at').eq('student_id', id).order('earned_at', { ascending: false }),
    supabaseAdmin.from('student_messages').select('id, message, is_read, created_at').eq('student_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('flashcards').select('id, topic_id'),
  ])

  const initiallyAllowed = accessRows?.map(r => r.topic_id) ?? []
  const correctCount = (attempts ?? []).filter(a => a.is_correct === true).length
  const totalAttempted = (attempts ?? []).filter(a => a.is_correct !== null).length
  const today = new Date().toISOString().slice(0, 10)

  // ── Per-topic performance summary ──────────────────────────────────────────
  // Group flashcard reviews by topic
  const reviewsByTopic: Record<number, { front: string; rating: any }[]> = {}
  ;(reviews ?? []).forEach((r: any) => {
    const tid = r.flashcards?.topic_id
    if (!tid) return
    if (!reviewsByTopic[tid]) reviewsByTopic[tid] = []
    reviewsByTopic[tid].push({ front: r.flashcards?.front, rating: r.rating })
  })

  // Group attempts by topic
  const attemptsByTopic: Record<number, { question: string; options: string[]; correct_index: number; selected_index: number | null; is_correct: boolean | null; created_at: string }[]> = {}
  ;(attempts ?? []).forEach((a: any) => {
    const tid = a.mcqs?.topic_id
    if (!tid) return
    if (!attemptsByTopic[tid]) attemptsByTopic[tid] = []
    attemptsByTopic[tid].push({
      question: a.mcqs?.question,
      options: a.mcqs?.options ?? [],
      correct_index: a.mcqs?.correct_index,
      selected_index: a.selected_index,
      is_correct: a.is_correct,
      created_at: a.created_at,
    })
  })

  // Total flashcards per topic
  const flashcardsPerTopic: Record<number, number> = {}
  ;(allFlashcards ?? []).forEach((f: any) => {
    flashcardsPerTopic[f.topic_id] = (flashcardsPerTopic[f.topic_id] ?? 0) + 1
  })

  // Merge into topic summary rows
  const topicIds = new Set([
    ...Object.keys(reviewsByTopic).map(Number),
    ...Object.keys(attemptsByTopic).map(Number),
  ])

  type TopicSummary = {
    id: number
    name: string
    cardsReviewed: number
    totalCards: number
    attemptsTotal: number
    attemptsCorrect: number
    accuracy: number | null
    missedQuestions: string[]
  }

  const topicSummaries: TopicSummary[] = Array.from(topicIds).map(tid => {
    const topic = allTopics?.find(t => t.id === tid)
    const topicReviews = reviewsByTopic[tid] ?? []
    const topicAttempts = attemptsByTopic[tid] ?? []
    const correct = topicAttempts.filter(a => a.is_correct === true).length
    const attempted = topicAttempts.filter(a => a.is_correct !== null).length

    // Most-missed: wrong answers, group by question
    const wrong = topicAttempts.filter(a => a.is_correct === false)
    const missed = wrong.slice(0, 2).map(a => a.question).filter(Boolean) as string[]

    return {
      id: tid,
      name: topic?.name ?? 'Unknown topic',
      cardsReviewed: new Set(topicReviews.map((_, i) => i)).size,
      totalCards: flashcardsPerTopic[tid] ?? 0,
      attemptsTotal: attempted,
      attemptsCorrect: correct,
      accuracy: attempted ? Math.round((correct / attempted) * 100) : null,
      missedQuestions: missed,
    }
  }).sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101)) // worst first

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // Badges — show today's highlighted, rest collapsed
  const todayBadges = (badges ?? []).filter(b => b.earned_at?.slice(0, 10) === today)
  const olderBadges = (badges ?? []).filter(b => b.earned_at?.slice(0, 10) !== today)

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href="/teacher" className="back-link">← Dashboard</Link>

        {/* ── HEADER ── */}
        <div className="student-detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {profile?.avatar ? (
              <img className="avatar-img" src={`/avatars/${profile.avatar}.png`} alt="" style={{ width: '52px', height: '52px' }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: '52px', height: '52px' }}>{student?.name?.charAt(0)}</div>
            )}
            <div>
              <h1 className="page-title" style={{ marginBottom: '2px' }}>{student?.name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: 0 }}>
                Class {student?.class ?? '10'} · {streak?.count ? `🔥 ${streak.count} day streak` : 'No practice yet'}
              </p>
            </div>
          </div>
          <DeleteButton id={parseInt(id)} type="students" redirectTo="/teacher" label="Remove" />
        </div>

        {/* ── STATS — 3 numbers ── */}
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          {[
            { v: reviews?.length ?? 0, l: 'Cards reviewed' },
            { v: totalAttempted, l: 'Problems done' },
            { v: totalAttempted ? `${Math.round((correctCount / totalAttempted) * 100)}%` : '—', l: 'Accuracy' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{s.v}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── SEND NOTE — always visible ── */}
        <section className="detail-section">
          <div className="section-label" style={{ marginTop: 0 }}>Send a note</div>
          <p className="msg-text" style={{ marginBottom: '10px' }}>Appears on {student?.name}&apos;s home page instantly.</p>
          <SendMessage studentId={id} />
        </section>

        {/* ── PERFORMANCE BY TOPIC — the main insight ── */}
        {topicSummaries.length > 0 && (
          <section className="detail-section">
            <div className="section-label">Performance by topic</div>
            {topicSummaries.map(t => (
              <div key={t.id} className="topic-perf-card">
                <div className="topic-perf-header">
                  <span className="topic-perf-name">{t.name}</span>
                  {t.accuracy !== null && (
                    <span className={`topic-perf-acc ${t.accuracy >= 80 ? 'good' : t.accuracy >= 50 ? 'ok' : 'low'}`}>
                      {t.accuracy}% accuracy
                    </span>
                  )}
                </div>
                <div className="topic-perf-meta">
                  {t.totalCards > 0 && (
                    <span>📇 {t.cardsReviewed}/{t.totalCards} cards reviewed</span>
                  )}
                  {t.attemptsTotal > 0 && (
                    <span>✏️ {t.attemptsCorrect}/{t.attemptsTotal} correct</span>
                  )}
                </div>
                {t.missedQuestions.length > 0 && (
                  <div className="topic-perf-missed">
                    <span className="topic-perf-missed-label">Needs work:</span>
                    {t.missedQuestions.map((q, i) => (
                      <div key={i} className="topic-perf-missed-q">{q}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── BADGES ── today highlighted, older collapsed */}
        {(badges ?? []).length > 0 && (
          <section className="detail-section">
            <div className="section-label">Badges</div>
            <div className="badge-row" style={{ marginBottom: '6px' }}>
              {(todayBadges.length > 0 ? todayBadges : (badges ?? []).slice(0, 3)).map((b, i) => {
                const info = badgeLabel(b.badge_key)
                const tier = getBadgeTier(b.badge_key)
                return (
                  <span key={i} className={`badge-chip badge-${tier}`}>
                    {info.icon} {info.label}
                    <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.6 }}>
                      {b.earned_at?.slice(0, 10)}
                    </span>
                  </span>
                )
              })}
            </div>
            {olderBadges.length > 0 && todayBadges.length === 0 && (badges ?? []).length > 3 && (
              <p className="msg-text">+{(badges ?? []).length - 3} more badges earned previously.</p>
            )}
            {todayBadges.length > 0 && olderBadges.length > 0 && (
              <p className="msg-text">{olderBadges.length} older badge{olderBadges.length === 1 ? '' : 's'} — shown in full progress.</p>
            )}
          </section>
        )}

        {/* ── PREVIOUS NOTES — collapse after 2 ── */}
        {messages && messages.length > 0 && (
          <section className="detail-section">
            <div className="section-label">Previous notes</div>
            {(messages as any[]).slice(0, 2).map((m: any) => (
              <div key={m.id} className="card" style={{ padding: '12px 14px', fontSize: '13px', marginBottom: '8px' }}>
                <div style={{ color: 'var(--ink)' }}>{m.message}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatTime(m.created_at)}</span>
                  <span className={`read-pill ${m.is_read ? 'is-read' : ''}`}>{m.is_read ? 'Read' : 'Unread'}</span>
                </div>
              </div>
            ))}
            {messages.length > 2 && (
              <Link href="/teacher/messages" className="text-link" style={{ fontSize: '12px' }}>
                +{messages.length - 2} more — view all notes →
              </Link>
            )}
          </section>
        )}

        {/* ── TOPIC ACCESS — least urgent, bottom ── */}
        <section className="detail-section">
          <div className="section-label">Topic access</div>
          <p className="msg-text" style={{ marginBottom: '10px' }}>If none are marked Allowed, all topics are open by default.</p>
          <AccessToggles studentId={id} allTopics={allTopics ?? []} initiallyAllowed={initiallyAllowed} />
        </section>

      </div>
    </>
  )
}
