import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'

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
  const unread = all.filter(m => !m.is_read)
  const archived = all.filter(m => m.is_read)

  function formatTime(ts: string) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  function renderNote(m: typeof all[0]) {
    return (
      <div key={m.id} className={`message-card ${!m.is_read ? 'unread' : ''}`} style={{ opacity: m.is_read ? 0.7 : 1 }}>
        <div className="msg-from" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{nameById.get(m.student_id) ?? 'Unknown student'}</span>
          <Link href={`/teacher/students/${m.student_id}`} className="text-link" style={{ fontSize: '11px' }}>
            Open student →
          </Link>
        </div>
        <div className="msg-text">{m.message}</div>
        <div className="msg-time">
          {formatTime(m.created_at)}
          <span className={`read-pill ${m.is_read ? 'is-read' : ''}`}>
            {m.is_read ? 'Read by student' : 'Not opened yet'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href="/teacher" className="back-link">← Dashboard</Link>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>Notes sent</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginBottom: '20px' }}>
          {all.length} note{all.length === 1 ? '' : 's'} total · {unread.length} not yet read by student
        </p>

        {all.length === 0 && (
          <div className="empty">
            No notes sent yet. Open a student and use &ldquo;Send a note&rdquo; to write one.
          </div>
        )}

        {/* Unread — waiting for student to open */}
        {unread.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <div className="section-label" style={{ marginTop: 0, color: 'var(--amber-dark)' }}>
              ● Waiting to be read ({unread.length})
            </div>
            {unread.map(renderNote)}
          </section>
        )}

        {/* Archive — student has read these */}
        {archived.length > 0 && (
          <section>
            <div className="section-label" style={{ marginTop: 0, color: 'var(--sage-dark)' }}>
              ✓ Read by student ({archived.length})
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-3)', marginBottom: '10px' }}>
              These disappear automatically 3 days after the student reads them.
            </p>
            {archived.map(renderNote)}
          </section>
        )}
      </div>
    </>
  )
}
