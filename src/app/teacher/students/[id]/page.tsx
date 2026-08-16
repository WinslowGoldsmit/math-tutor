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
  ] = await Promise.all([
    supabaseAdmin.from('students').select('id, name, class').eq('id', id).single(),
    supabaseAdmin.from('reviews').select('id, rating, flashcards(front)').eq('student_id', id),
    supabaseAdmin.from('attempts').select('id, selected_index, is_correct, created_at, mcqs(id, question, options, topic_id)').eq('student_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('topics').select('id, name').order('order_index'),
    supabaseAdmin.from('access').select('topic_id').eq('student_id', id),
    supabaseAdmin.from('student_profile').select('avatar').eq('student_id', id).maybeSingle(),
    supabaseAdmin.from('streaks').select('count').eq('student_id', id).single(),
    supabaseAdmin.from('badges').select('badge_key, earned_at').eq('student_id', id).order('earned_at', { ascending: false }),
    supabaseAdmin.from('student_messages').select('id, message, is_read, created_at').eq('student_id', id).order('created_at', { ascending: false }),
  ])

  const initiallyAllowed = accessRows?.map(r => r.topic_id) ?? []
  const correctCount = (attempts ?? []).filter(a => a.is_correct === true).length
  const totalAttempted = (attempts ?? []).filter(a => a.is_correct !== null).length

  // Group attempts by topic
  const attemptsByTopic: Record<number, { topicName: string; attempts: any[] }> = {}
  ;(attempts ?? []).forEach((a: any) => {
    const topicId = a.mcqs?.topic_id
    if (!topicId) return
    if (!attemptsByTopic[topicId]) {
      const topic = allTopics?.find(t => t.id === topicId)
      attemptsByTopic[topicId] = { topicName: topic?.name ?? 'Unknown topic', attempts: [] }
    }
    attemptsByTopic[topicId].attempts.push(a)
  })

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href="/teacher" className="back-link">← Dashboard</Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div className="avatar-row">
            {profile?.avatar ? (
              <img className="avatar-img" src={`/avatars/${profile.avatar}.png`} alt="" />
            ) : (
              <div className="avatar-placeholder">{student?.name?.charAt(0)}</div>
            )}
            <div>
              <h1 className="page-title" style={{ marginBottom: 0 }}>{student?.name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: 0 }}>
                Class {student?.class ?? '10'} · {streak?.count ? `${streak.count} day streak` : 'No practice yet'}
              </p>
            </div>
          </div>
          <DeleteButton id={parseInt(id)} type="students" redirectTo="/teacher" label="Remove" />
        </div>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: '24px' }}>
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

        {/* Badges */}
        {badges && badges.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <div className="section-label" style={{ marginTop: 0 }}>Badges earned</div>
            <div className="badge-row">
              {badges.map((b, i) => {
                const info = badgeLabel(b.badge_key)
                const tier = getBadgeTier(b.badge_key)
                return <span key={i} className={`badge-chip badge-${tier}`}>{info.icon} {info.label}</span>
              })}
            </div>
          </section>
        )}

        {/* Send message */}
        <section style={{ marginBottom: '24px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>Send a note</div>
          <p className="msg-text" style={{ marginBottom: '10px' }}>This will appear on {student?.name}&apos;s home page.</p>
          <SendMessage studentId={id} />
        </section>

        {/* Previous messages */}
        {messages && messages.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <div className="section-label">Previous notes</div>
            {messages.map((m: any) => (
              <div key={m.id} className="card" style={{ padding: '12px 14px', fontSize: '13px' }}>
                <div style={{ color: 'var(--ink)' }}>{m.message}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatTime(m.created_at)}</span>
                  <span>{m.is_read ? '✓ Read' : 'Unread'}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Access */}
        <section style={{ marginBottom: '28px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>Topic access</div>
          <p className="msg-text" style={{ marginBottom: '10px' }}>If none are marked Allowed, all topics are open by default.</p>
          <AccessToggles studentId={id} allTopics={allTopics ?? []} initiallyAllowed={initiallyAllowed} />
        </section>

        {/* Reviews */}
        <section style={{ marginBottom: '28px' }}>
          <div className="section-label">Flashcard reviews ({reviews?.length ?? 0})</div>
          {(!reviews || reviews.length === 0) && (
            <div className="empty">No flashcard reviews yet.</div>
          )}
          {reviews && reviews.length > 0 && (
            <table className="log-table">
              <tbody>
                {reviews.map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.flashcards?.front}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{r.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Attempts grouped by topic */}
        <section>
          <div className="section-label">Problem attempts ({attempts?.length ?? 0})</div>
          {(!attempts || attempts.length === 0) && (
            <div className="empty">No problem attempts yet.</div>
          )}
          {Object.entries(attemptsByTopic).map(([topicId, group]) => (
            <div key={topicId} className="attempt-group">
              <div className="attempt-group-title">{group.topicName}</div>
              {group.attempts.map((a: any) => {
                let label = 'Skipped', cls = 'tag-skip'
                if (a.is_correct === true) { label = '✓ Correct'; cls = 'tag-ok' }
                else if (a.is_correct === false) { label = '✗ Wrong'; cls = 'tag-no' }
                return (
                  <div key={a.id} className="attempt-row">
                    <div style={{ flex: 1 }}>
                      <div className="attempt-q">{a.mcqs?.question}</div>
                      {a.selected_index !== null && (
                        <div className="attempt-answer">
                          Answered: {a.mcqs?.options?.[a.selected_index]}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={cls} style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
                      <span className="attempt-time">{formatTime(a.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
