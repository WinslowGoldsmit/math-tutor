import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'
import AvatarPicker from '@/app/student/AvatarPicker'
import ChangeAvatarButton from '@/app/student/ChangeAvatarButton'
import Messages from '@/app/student/Messages'
import { badgeLabel, getBadgeTier } from '@/lib/badges'

export default async function StudentHome() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  const studentName = cookieStore.get('student_name')?.value
  const studentClass = cookieStore.get('student_class')?.value ?? '10'
  if (!studentId) redirect('/login')

  const [
    { data: allTopics },
    { data: accessRows },
    { data: streak },
    { data: profile },
    { data: badges },
    { data: allFlashcards },
    { data: allMcqs },
    { data: reviews },
    { data: attempts },
  ] = await Promise.all([
    supabaseAdmin.from('topics').select('id, name, order_index').order('order_index'),
    supabaseAdmin.from('access').select('topic_id').eq('student_id', studentId),
    supabaseAdmin.from('streaks').select('count, last_practice_date').eq('student_id', studentId).single(),
    supabaseAdmin.from('student_profile').select('avatar').eq('student_id', studentId).maybeSingle(),
    supabaseAdmin.from('badges').select('badge_key').eq('student_id', studentId).order('earned_at', { ascending: false }).limit(6),
    supabaseAdmin.from('flashcards').select('id, topic_id'),
    supabaseAdmin.from('mcqs').select('id, topic_id'),
    supabaseAdmin.from('reviews').select('flashcard_id').eq('student_id', studentId),
    supabaseAdmin.from('attempts').select('mcq_id').eq('student_id', studentId),
  ])

  const allowedIds = accessRows?.map(r => r.topic_id) ?? []
  const hasRestrictions = allowedIds.length > 0
  const topics = hasRestrictions ? allTopics?.filter(t => allowedIds.includes(t.id)) : allTopics

  const reviewedIds = new Set((reviews ?? []).map(r => r.flashcard_id))
  const attemptedIds = new Set((attempts ?? []).map(a => a.mcq_id))

  // Per-topic progress + due counts
  const today = new Date().toISOString().slice(0, 10)
  const { data: schedules } = await supabaseAdmin
    .from('flashcard_schedule').select('flashcard_id, due_date').eq('student_id', studentId)
  const scheduledMap = new Map((schedules ?? []).map(s => [s.flashcard_id, s.due_date]))

  type TopicStatus = 'not-started' | 'in-progress' | 'complete' | 'empty'
  const topicData = (topics ?? []).map(topic => {
    const cards = (allFlashcards ?? []).filter(f => f.topic_id === topic.id)
    const mcqs = (allMcqs ?? []).filter(m => m.topic_id === topic.id)
    const fcDone = cards.filter(c => reviewedIds.has(c.id)).length
    const mcqDone = mcqs.filter(m => attemptedIds.has(m.id)).length
    const total = cards.length + mcqs.length
    const done = fcDone + mcqDone
    const pct = total ? Math.round((done / total) * 100) : 0

    // Track each content type separately, so a topic with no problems written
    // yet can still be marked complete once every flashcard is done.
    const fcComplete = cards.length > 0 && fcDone >= cards.length
    const mcqComplete = mcqs.length > 0 && mcqDone >= mcqs.length
    const fcPct = cards.length ? Math.round((fcDone / cards.length) * 100) : 0
    const mcqPct = mcqs.length ? Math.round((mcqDone / mcqs.length) * 100) : 0

    // Due count for this topic
    const cardIds = cards.map(c => c.id)
    const overdue = cardIds.filter(id => {
      const due = scheduledMap.get(id)
      return due && due <= today
    }).length
    const newCards = cardIds.filter(id => !scheduledMap.has(id)).length
    const due = overdue + Math.min(newCards, 10)

    // A part only counts against completion if it actually has content.
    const parts = [
      cards.length > 0 ? fcComplete : null,
      mcqs.length > 0 ? mcqComplete : null,
    ].filter(p => p !== null) as boolean[]

    let status: TopicStatus = 'not-started'
    if (total === 0) status = 'empty'
    else if (parts.length > 0 && parts.every(Boolean)) status = 'complete'
    else if (done > 0) status = 'in-progress'

    // What is actually left to do — shown to the student instead of a bare %
    const remaining: string[] = []
    if (cards.length > 0 && !fcComplete) remaining.push(`${cards.length - fcDone} card${cards.length - fcDone === 1 ? '' : 's'} left`)
    if (mcqs.length > 0 && !mcqComplete) remaining.push(`${mcqs.length - mcqDone} problem${mcqs.length - mcqDone === 1 ? '' : 's'} left`)

    return {
      ...topic, pct, due, status, fcDone, mcqDone, total,
      cards: cards.length, mcqCount: mcqs.length,
      fcComplete, mcqComplete, fcPct, mcqPct, remaining,
    }
  })

  const dueTopics = topicData.filter(t => t.due > 0)
  const totalDue = dueTopics.reduce((sum, t) => sum + t.due, 0)

  const streakCount = streak?.count ?? 0
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const streakBroken = streakCount > 0 && streak?.last_practice_date !== today && streak?.last_practice_date !== yesterday
  const dots = Array.from({ length: 7 }, (_, i) => i < Math.min(streakCount, 7))

  const noTopicsExist = (allTopics?.length ?? 0) === 0
  const topicsExistButLocked = (allTopics?.length ?? 0) > 0 && hasRestrictions && (topics?.length ?? 0) === 0

  const statusIcon: Record<TopicStatus, string> = {
    'not-started': '○',
    'in-progress': '◑',
    'complete': '●',
    'empty': '◌',
  }
  const statusLabel: Record<TopicStatus, string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    'complete': 'Complete',
    'empty': 'Coming soon',
  }

  return (
    <>
      <Topbar role="student" name="" />
      <div className="page">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          {profile?.avatar ? (
            <img className="avatar-img" src={`/avatars/${profile.avatar}.png`} alt="" style={{ width: '52px', height: '52px' }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: '52px', height: '52px' }}>{studentName?.charAt(0)?.toUpperCase()}</div>
          )}
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ marginBottom: '4px' }}>Hey, {studentName}</h1>
            <span className="class-badge">Class {studentClass}</span>
          </div>
        </div>

        {!profile?.avatar && <AvatarPicker />}
        {profile?.avatar && <ChangeAvatarButton />}

        {/* Teacher messages */}
        <Messages />

        {/* Today's practice with direct topic links */}
        {dueTopics.length > 0 && (
          <div className="today-card">
            <div className="today-title">
              Today&apos;s practice — {totalDue} card{totalDue !== 1 ? 's' : ''} due
            </div>
            <div className="today-links">
              {dueTopics.map(t => (
                <Link key={t.id} href={`/student/topics/${t.id}/flashcards`} className="today-link">
                  <span>{t.name}</span>
                  <span className="due-count">{t.due} due</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Streak */}
        <div className={`streak-card ${streakBroken ? 'streak-broken' : ''}`}>
          <div className="streak-dots">
            {dots.map((filled, i) => (
              <div key={i} className={`streak-dot ${filled ? 'filled' : ''}`} style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
          <div>
            <div className="streak-num">{streakCount}</div>
            <div className="streak-label">{streakBroken ? 'streak broken — restart today' : streakCount === 0 ? 'start your streak' : 'day streak'}</div>
          </div>
        </div>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="badge-row">
            {badges.map((b, i) => {
              const info = badgeLabel(b.badge_key)
              const tier = getBadgeTier(b.badge_key)
              return <span key={i} className={`badge-chip badge-${tier}`} style={{ animationDelay: `${i * 80}ms` }}>{info.icon} {info.label}</span>
            })}
          </div>
        )}

        <Link href="/student/progress" className="text-link" style={{ display: 'inline-block', marginBottom: '20px' }}>
          View full progress map →
        </Link>

        {/* Topics with clear status distinction */}
        <div className="section-label">Topics</div>

        {noTopicsExist && <div className="empty">Your teacher is still setting things up — check back soon.</div>}
        {topicsExistButLocked && <div className="empty">Your teacher hasn&apos;t unlocked any topics for you yet.</div>}

        {/* Separator sections */}
        {!noTopicsExist && !topicsExistButLocked && (
          <>
            {/* In progress — shown first */}
            {topicData.filter(t => t.status === 'in-progress').length > 0 && (
              <>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  ◑ In progress
                </p>
                {topicData.filter(t => t.status === 'in-progress').map((topic, i) => (
                  <Link key={topic.id} href={`/student/topics/${topic.id}`} className="topic-status-card topic-status-in-progress anim-slide-right" style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ flex: 1 }}>
                      <div>{topic.name}</div>
                      <div className="topic-status-meta">
                        {topic.remaining.length ? topic.remaining.join(' · ') : `${topic.pct}% done`}
                      </div>
                      <div className="split-bars">
                        {topic.cards > 0 && (
                          <span className={`split-bar ${topic.fcComplete ? 'is-done' : ''}`} title={`Flashcards ${topic.fcPct}%`}>
                            <span className="split-bar-fill" style={{ width: `${topic.fcPct}%` }} />
                            <span className="split-bar-label">{topic.fcComplete ? '✓' : ''} Cards</span>
                          </span>
                        )}
                        {topic.mcqCount > 0 && (
                          <span className={`split-bar ${topic.mcqComplete ? 'is-done' : ''}`} title={`Problems ${topic.mcqPct}%`}>
                            <span className="split-bar-fill" style={{ width: `${topic.mcqPct}%` }} />
                            <span className="split-bar-label">{topic.mcqComplete ? '✓' : ''} Problems</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {topic.due > 0 && <span className="due-count">{topic.due} due</span>}
                  </Link>
                ))}
              </>
            )}

            {/* Not started */}
            {topicData.filter(t => t.status === 'not-started').length > 0 && (
              <>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 8px' }}>
                  ○ Not started
                </p>
                {topicData.filter(t => t.status === 'not-started').map((topic, i) => (
                  <Link key={topic.id} href={`/student/topics/${topic.id}`} className="topic-status-card topic-status-not-started anim-slide-right" style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ flex: 1 }}>
                      <div>{topic.name}</div>
                      <div className="topic-status-meta">{topic.cards} flashcards · {topic.mcqCount} problems</div>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* Nothing authored yet — keep these out of Not started */}
            {topicData.filter(t => t.status === 'empty').length > 0 && (
              <>
                <p className="topic-group-label" style={{ color: 'var(--ink-3)' }}>◌ Coming soon</p>
                {topicData.filter(t => t.status === 'empty').map((topic, i) => (
                  <div key={topic.id} className="topic-status-card topic-status-empty anim-slide-right" style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ flex: 1 }}>
                      <div>{topic.name}</div>
                      <div className="topic-status-meta">Your teacher is still adding content here</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Complete */}
            {topicData.filter(t => t.status === 'complete').length > 0 && (
              <>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sage-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 8px' }}>
                  ● Complete
                </p>
                {topicData.filter(t => t.status === 'complete').map((topic, i) => (
                  <Link key={topic.id} href={`/student/topics/${topic.id}`} className="topic-status-card topic-status-complete anim-slide-right" style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ flex: 1 }}>
                      <div>{topic.name}</div>
                      <div className="topic-status-meta">
                        {topic.cards > 0 && `${topic.cards} cards`}
                        {topic.cards > 0 && topic.mcqCount > 0 && ' · '}
                        {topic.mcqCount > 0 && `${topic.mcqCount} problems`}
                        {' — all done ✓'}
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
