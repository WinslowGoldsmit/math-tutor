import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function TeacherHome() {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) redirect('/login')

  const { data: chapters } = await supabase.from('chapters').select('id, name')
  const { data: students } = await supabase.from('students').select('id, name')

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: '24px' }}>Teacher Dashboard</h1>

      <div className="section-title" style={{ marginTop: 0 }}>Chapters</div>
      {(!chapters || chapters.length === 0) && <div className="empty">No chapters yet.</div>}
      {chapters?.map(ch => (
        <Link key={ch.id} href={`/teacher/chapters/${ch.id}`} className="list-link">
          {ch.name}
        </Link>
      ))}
      <Link href="/teacher/chapters/new" className="btn-ghost" style={{ display: 'inline-block', marginTop: '4px' }}>
        + Add a chapter
      </Link>

      <div className="section-title">Students ({students?.length ?? 0})</div>
      {(!students || students.length === 0) && <div className="empty">No students yet.</div>}
      {students?.map(s => (
        <Link key={s.id} href={`/teacher/students/${s.id}`} className="list-link">
          {s.name}
        </Link>
      ))}
      <Link href="/teacher/students/new" className="btn-ghost" style={{ display: 'inline-block', marginTop: '4px' }}>
        + Add a student
      </Link>
    </div>
  )
}