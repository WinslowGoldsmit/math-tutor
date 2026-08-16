import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'

export default async function TeacherHome() {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) redirect('/login')

  const [
    { data: chapters },
    { data: students },
    { data: streaks },
    { data: profiles },
  ] = await Promise.all([
    supabaseAdmin.from('chapters').select('id, name, emoji, color'),
    supabaseAdmin.from('students').select('id, name, class'),
    supabaseAdmin.from('streaks').select('student_id, count, last_practice_date'),
    supabaseAdmin.from('student_profile').select('student_id, avatar'),
  ])

  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
  function needsAttention(studentId: number) {
    const s = streaks?.find(st => st.student_id === studentId)
    if (!s || !s.last_practice_date) return true
    return s.last_practice_date < threeDaysAgo
  }
  const attentionList = (students ?? []).filter(s => needsAttention(s.id))

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 className="page-title" style={{ marginBottom: '2px' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--ink-3)' }}>
            {students?.length ?? 0} students · {chapters?.length ?? 0} chapters
          </p>
        </div>

        <Link href="/teacher/analytics" className="text-link" style={{ display: 'inline-block', marginBottom: '16px' }}>
          View class analytics →
        </Link>

        {attentionList.length > 0 && (
          <>
            <div className="section-label">Needs attention</div>
            <p className="msg-text" style={{ marginBottom: '10px' }}>No practice in 3+ days or not started yet.</p>
            {attentionList.map(s => {
              const profile = profiles?.find(p => p.student_id === s.id)
              const streak = streaks?.find(st => st.student_id === s.id)
              return (
                <Link key={s.id} href={`/teacher/students/${s.id}`} className="student-card" style={{ borderColor: 'var(--coral)' }}>
                  {profile?.avatar ? (
                    <img className="avatar-img" src={`/avatars/${profile.avatar}.png`} alt="" style={{ width: '36px', height: '36px' }} />
                  ) : (
                    <div className="avatar-placeholder" style={{ width: '36px', height: '36px', fontSize: '14px' }}>{s.name?.charAt(0)}</div>
                  )}
                  <div className="info">
                    <div className="name">{s.name}</div>
                    <div className="meta">Class {s.class ?? '10'} · {streak?.count ? `${streak.count} day streak` : 'No activity yet'}</div>
                  </div>
                  <div className="attention-dot" />
                </Link>
              )
            })}
          </>
        )}

        <div className="section-label">Chapters</div>
        {(!chapters || chapters.length === 0) && (
          <div className="empty">No chapters yet. Add one below.</div>
        )}
        {chapters?.map(ch => {
          const bg = ch.color || 'var(--bg-sunken)'
          return (
            <Link key={ch.id} href={`/teacher/chapters/${ch.id}`} style={{ textDecoration: 'none' }}>
              <div className="chapter-box" style={{ background: bg }}>
                <div className="chapter-box-header">
                  {ch.emoji && <span className="chapter-emoji">{ch.emoji}</span>}
                  <span className="chapter-title">{ch.name}</span>
                </div>
              </div>
            </Link>
          )
        })}
        <Link href="/teacher/chapters/new" className="btn-ghost" style={{ display: 'inline-block', marginTop: '4px' }}>+ Add a chapter</Link>

        <div className="section-label">All students</div>
        {(!students || students.length === 0) && <div className="empty">No students yet.</div>}
        {students?.map(s => {
          const profile = profiles?.find(p => p.student_id === s.id)
          const streak = streaks?.find(st => st.student_id === s.id)
          return (
            <Link key={s.id} href={`/teacher/students/${s.id}`} className="student-card">
              {profile?.avatar ? (
                <img className="avatar-img" src={`/avatars/${profile.avatar}.png`} alt="" style={{ width: '36px', height: '36px' }} />
              ) : (
                <div className="avatar-placeholder" style={{ width: '36px', height: '36px', fontSize: '14px' }}>{s.name?.charAt(0)}</div>
              )}
              <div className="info">
                <div className="name">{s.name}</div>
                <div className="meta">Class {s.class ?? '10'} · {streak?.count ? `${streak.count} day streak` : 'No activity'}</div>
              </div>
              {needsAttention(s.id) && <div className="attention-dot" />}
            </Link>
          )
        })}
        <Link href="/teacher/students/new" className="btn-ghost" style={{ display: 'inline-block', marginTop: '4px' }}>+ Add a student</Link>
      </div>
    </>
  )
}
