import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function TeacherHome() {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value

  if (!isTeacher) {
    redirect('/login')
  }

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name')

  const { data: students } = await supabase
    .from('students')
    .select('id, name')

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '24px' }}>Teacher Dashboard</h1>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>Chapters</h2>
        {(!chapters || chapters.length === 0) && <p style={{ color: '#888' }}>No chapters yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {chapters?.map(ch => (
            <Link
              key={ch.id}
              href={`/teacher/chapters/${ch.id}`}
              style={{ padding: '14px 16px', border: '1px solid #ddd', borderRadius: '10px', textDecoration: 'none', color: '#222' }}
            >
              {ch.name}
            </Link>
          ))}
        </div>
        <Link href="/teacher/chapters/new" style={{ display: 'inline-block', marginTop: '10px', color: '#33636A' }}>
          + Add a chapter
        </Link>
      </section>

      <section>
        <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>Students ({students?.length ?? 0})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {students?.map(s => (
            <Link
              key={s.id}
              href={`/teacher/students/${s.id}`}
              style={{ padding: '14px 16px', border: '1px solid #ddd', borderRadius: '10px', textDecoration: 'none', color: '#222' }}
            >
              {s.name}
            </Link>
          ))}
        </div>
        <Link href="/teacher/students/new" style={{ display: 'inline-block', marginTop: '10px', color: '#33636A' }}>
          + Add a student
        </Link>
      </section>
    </div>
  )
}