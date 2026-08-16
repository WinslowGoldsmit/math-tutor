import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'

/** Every note sent to every student, in one place. */
export default async function TeacherMessages() {
  const cookieStore = await cookies()
  if (!cookieStore.get('is_teacher')?.value) redirect('/login')

  const [{ data: messages }, { data: students }] = await Promise.all([
    supabaseAdmin
      .from('student_messages')
      .select('id, student_id, message, is_read, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('students').select('id, name'),
  ])

  const nameById = new Map((students ?? []).map(s => [s.id, s.name]))
  const all = messages ?? []
  const unreadCount = all.filter(m => !m.is_read).length

  // Group by student so the teacher can see each conversation at a glance
  const byStudent = new Map<number, typeof all>()
  all.forEach(m => {
    const list = byStudent.get(m.student_id) ?? []
    list.push(m)
    byStudent.set(m.student_id, list)
  })

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href="/teacher" className="back-link">← Dashboard</Link>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>Notes sent</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginBottom: '20px' }}>
          {all.length} note{all.length === 1 ? '' : 's'} · {unreadCount} not yet opened by the student
        </p>

        {all.length === 0 && (
          <div className="empty">
            No notes sent yet. Open a student and use &ldquo;Send a note&rdquo; to write one.
          </div>
        )}

        {Array.from(byStudent.entries()).map(([studentId, list]) => (
          <section key={studentId} style={{ marginBottom: '28px' }}>
            <div className="section-label" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{nameById.get(studentId) ?? 'Unknown student'}</span>
              <Link href={`/teacher/students/${studentId}`} className="text-link" style={{ fontSize: '12px' }}>
                Open student →
              </Link>
            </div>
            {list.map(m => (
              <div key={m.id} className={`message-card ${!m.is_read ? 'unread' : ''}`}>
                <div className="msg-text">{m.message}</div>
                <div className="msg-time">
                  {formatTime(m.created_at)}
                  <span className={`read-pill ${m.is_read ? 'is-read' : ''}`}>
                    {m.is_read ? 'Read' : 'Not opened yet'}
                  </span>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  )
}
