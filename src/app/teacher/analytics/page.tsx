import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'

function cellColor(pct: number | null) {
  if (pct === null) return { background: 'var(--bg-sunken)', color: 'var(--ink-3)' }
  if (pct >= 80) return { background: 'var(--sage-tint)', color: 'var(--sage-dark)' }
  if (pct >= 50) return { background: 'var(--amber-tint)', color: 'var(--amber-dark)' }
  return { background: 'var(--coral-tint)', color: 'var(--coral-dark)' }
}

export default async function Analytics() {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) redirect('/login')

  // Parallel queries
  const [
    { data: students },
    { data: topics },
    { data: mcqs },
    { data: attempts },
  ] = await Promise.all([
    supabaseAdmin.from('students').select('id, name, class'),
    supabaseAdmin.from('topics').select('id, name, order_index').order('order_index'),
    supabaseAdmin.from('mcqs').select('id, topic_id, question, options, correct_index'),
    supabaseAdmin.from('attempts').select('student_id, mcq_id, selected_index, is_correct'),
  ])

  const mcqTopic = new Map<number, number>()
  ;(mcqs ?? []).forEach(m => mcqTopic.set(m.id, m.topic_id))

  function accuracy(studentId: number, topicId: number): number | null {
    const rel = (attempts ?? []).filter(a =>
      a.student_id === studentId && mcqTopic.get(a.mcq_id) === topicId && a.is_correct !== null
    )
    if (!rel.length) return null
    return Math.round((rel.filter(a => a.is_correct === true).length / rel.length) * 100)
  }

  function topicAccuracy(topicId: number): number | null {
    const rel = (attempts ?? []).filter(a => mcqTopic.get(a.mcq_id) === topicId && a.is_correct !== null)
    if (!rel.length) return null
    return Math.round((rel.filter(a => a.is_correct === true).length / rel.length) * 100)
  }

  const hasAnyAttempts = (attempts ?? []).length > 0

  const questionStats = (mcqs ?? []).map(m => {
    const rel = (attempts ?? []).filter(a => a.mcq_id === m.id && a.is_correct !== null)
    const wrong = rel.filter(a => a.is_correct === false)
    const counts: Record<number, number> = {}
    wrong.forEach(a => { if (a.selected_index !== null) counts[a.selected_index] = (counts[a.selected_index] ?? 0) + 1 })
    let topIndex = -1, topCount = 0
    Object.entries(counts).forEach(([idx, c]) => { if (c > topCount) { topCount = c; topIndex = parseInt(idx) } })
    const topDistractor = topIndex >= 0 ? { index: topIndex, count: topCount } : null
    return { mcq: m, attempted: rel.length, wrong: wrong.length, topDistractor }
  }).filter(q => q.attempted > 0).sort((a, b) => b.wrong - a.wrong).slice(0, 5)

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href="/teacher" className="back-link">← Dashboard</Link>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>Class analytics</h1>
        <p className="page-sub">Based on all problem attempts recorded so far.</p>

        {!hasAnyAttempts && (
          <div className="empty" style={{ marginBottom: '24px' }}>
            No data yet. Analytics will appear here once students start answering problems.
          </div>
        )}

        {hasAnyAttempts && (
          <>
            <div className="section-label" style={{ marginTop: 0 }}>Class accuracy by topic</div>
            {topics?.map(t => {
              const pct = topicAccuracy(t.id)
              return (
                <div key={t.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{t.name}</span>
                    <span style={{ color: 'var(--ink-3)' }}>{pct === null ? 'No attempts yet' : `${pct}% accuracy`}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${pct === null ? '' : pct >= 80 ? 'sage' : pct >= 50 ? '' : 'coral'}`}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="section-label">Student × topic heatmap</div>
            {(!students?.length || !topics?.length) ? (
              <div className="empty">No students or topics yet.</div>
            ) : (
              <div className="heatmap-wrap">
                <table className="heatmap-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', minWidth: '80px' }}>Student</th>
                      {topics.map(t => (
                        <th key={t.id}>{t.name.length > 8 ? t.name.slice(0, 8) + '…' : t.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td style={{ textAlign: 'left', fontWeight: 500 }}>{s.name}</td>
                        {topics.map(t => {
                          const pct = accuracy(s.id, t.id)
                          return (
                            <td key={t.id} className="heatmap-cell" style={cellColor(pct)}>
                              {pct === null ? '–' : `${pct}%`}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="section-label">Most-missed questions</div>
            {questionStats.length === 0 ? (
              <div className="empty">No incorrect attempts recorded yet.</div>
            ) : (
              questionStats.map(q => (
                <div key={q.mcq.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>{q.mcq.question}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
                    {q.wrong} incorrect of {q.attempted} attempts
                    {q.topDistractor !== null && (
                      <> · most common wrong: <strong>{String.fromCharCode(65 + q.topDistractor.index)}</strong> — {q.mcq.options?.[q.topDistractor.index]}</>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  )
}
