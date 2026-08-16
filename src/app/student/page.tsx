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
    supabaseAdmin.from('badges').select('badge_key, earned_at').eq('student_id', studentId).order('earned_at', { ascending: false }).limit(20),
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
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
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

  // Complete topics: only show on dashboard for 3 days, then send to progress map
  // We approximate "completed at" as today if pct just hit 100, otherwise hide after 3 days
  // Since we don't store exact completion date, we show complete topics that still have due cards
  // OR were completed recently (we show all complete for simplicity and filter in the UI)
  const recentComplete = topicData.filter(t => t.status === 'complete')
  const hiddenCompleteCount = 0 // future: track completion date per topic

  const dueTopics = topicData.filter(t => t.due > 0)
  const totalDue = dueTopics.reduce((sum, t) => sum + t.due, 0)

  // Only show badges earned today on the dashboard
  const todayBadges = (badges ?? []).filter((b: any) => b.earned_at?.slice(0, 10) === today)

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

  // Counts for the compact footer summary
  const inProgressCount  = topicData.filter(t => t.status === 'in-progress').length
  const notStartedTopics = topicData.filter(t => t.status === 'not-started')
  const emptyTopics      = topicData.filter(t => t.status === 'empty')

  return (
    <>
      <Topbar role="student" name="" />
      <div className="page">

        {/* ── HEADER ── avatar + name + class, compact */}
        <div className="student-header">
          <div className="student-header-left">
            {profile?.avatar ? (
              <img className="avatar-img" src={`/avatars/${profile.avatar}.png`} alt="" style={{ width: '44px', height: '44px' }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: '44px', height: '44px', fontSize: '16px' }}>{studentName?.charAt(0)?.toUpperCase()}</div>
            )}
            <div>
              <div className="student-header-name">Hey, {studentName} 👋</div>
              <span className="class-badge">Class {studentClass}</span>
            </div>
          </div>
          {/* Streak inline with header */}
          <div className={`streak-inline ${streakBroken ? 'broken' : ''}`}>
            <span className="streak-inline-num">{streakCount}</span>
            <span className="streak-inline-fire">{streakBroken ? '💔' : streakCount > 0 ? '🔥' : '○'}</span>
          </div>
        </div>

        {/* Avatar picker — only when no avatar set yet */}
        {!profile?.avatar && <AvatarPicker />}
        {profile?.avatar && <ChangeAvatarButton />}

        {/* ── TODAY'S PRACTICE — PRIMARY FOCUS ── */}
        {dueTopics.length > 0 ? (
          <div className="today-card">
            <div className="today-title">
              📚 Today&apos;s practice — {totalDue} card{totalDue !== 1 ? 's' : ''} due
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
        ) : (
          <div className="all-clear-card">
            <span style={{ fontSize: '28px' }}>✦</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>All caught up</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px' }}>No cards due right now — come back tomorrow.</div>
            </div>
          </div>
        )}

        {/* ── UNREAD TEACHER NOTES — only if present ── */}
        <Messages />

        {/* ── TODAY'S BADGES — only if earned today ── */}
        {todayBadges.length > 0 && (
          <div className="badge-row" style={{ marginBottom: '16px' }}>
            {todayBadges.map((b: any, i: number) => {
              const info = badgeLabel(b.badge_key)
              const tier = getBadgeTier(b.badge_key)
              return <span key={i} className={`badge-chip badge-${tier}`} style={{ animationDelay: `${i * 80}ms` }}>{info.icon} {info.label}</span>
            })}
          </div>
        )}

        {/* ── TOPICS ── */}
        {noTopicsExist && <div className="empty">Your teacher is still setting things up — check back soon.</div>}
        {topicsExistButLocked && <div className="empty">Your teacher hasn&apos;t unlocked any topics for you yet.</div>}

        {!noTopicsExist && !topicsExistButLocked && (
          <>
            {/* IN PROGRESS — main list, most prominent */}
            {inProgressCount > 0 && (
              <>
                <p className="topic-group-label" style={{ color: 'var(--amber-dark)' }}>◑ In progress</p>
                {topicData.filter(t => t.status === 'in-progress').map((topic, i) => (
                  <Link key={topic.id} href={`/student/topics/${topic.id}`} className="topic-status-card topic-status-in-progress anim-slide-right" style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{topic.name}</div>
                      <div className="topic-status-meta">
                        {topic.remaining.length ? topic.remaining.join(' · ') : `${topic.pct}% done`}
                      </div>
                      <div className="split-bars">
                        {topic.cards > 0 && (
                          <span className={`split-bar ${topic.fcComplete ? 'is-done' : ''}`}>
                            <span className="split-bar-fill" style={{ width: `${topic.fcPct}%` }} />
                            <span className="split-bar-label">{topic.fcComplete ? '✓' : ''} Cards</span>
                          </span>
                        )}
                        {topic.mcqCount > 0 && (
                          <span className={`split-bar ${topic.mcqComplete ? 'is-done' : ''}`}>
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

            {/* NOT STARTED — secondary, smaller */}
            {notStartedTopics.length > 0 && (
              <>
                <p className="topic-group-label" style={{ color: 'var(--ink-3)', marginTop: inProgressCount > 0 ? '20px' : '0' }}>○ Not started</p>
                {notStartedTopics.map((topic, i) => (
                  <Link key={topic.id} href={`/student/topics/${topic.id}`} className="topic-status-card topic-status-not-started anim-slide-right" style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ flex: 1 }}>
                      <div>{topic.name}</div>
                      <div className="topic-status-meta">{topic.cards} cards · {topic.mcqCount} problems</div>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* COMPLETE — just a pill/link, never a full list */}
            {recentComplete.length > 0 && (
              <Link href="/student/progress" className="complete-summary-link">
                ● {recentComplete.length} topic{recentComplete.length === 1 ? '' : 's'} complete — view progress map →
              </Link>
            )}

            {/* COMING SOON — most muted, last */}
            {emptyTopics.length > 0 && (
              <p className="coming-soon-label">◌ {emptyTopics.length} topic{emptyTopics.length === 1 ? '' : 's'} coming soon</p>
            )}
          </>
        )}

        {/* ── FOOTER NAV ── */}
        <div className="student-footer">
          <Link href="/student/progress" className="footer-link">📊 Progress map</Link>
        </div>

      </div>
    </>
  )
}
