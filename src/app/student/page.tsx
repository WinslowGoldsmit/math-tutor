import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function StudentHome() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  const studentName = cookieStore.get('student_name')?.value

  if (!studentId) {
    redirect('/login')
  }

  const { data: allTopics } = await supabase
    .from('topics')
    .select('id, name, order_index, chapter_id')
    .order('order_index')

  const { data: accessRows } = await supabase
    .from('access')
    .select('topic_id')
    .eq('student_id', studentId)

  const allowedIds = accessRows?.map(r => r.topic_id) ?? []
  const topics = allowedIds.length
    ? allTopics?.filter(t => allowedIds.includes(t.id))
    : allTopics

  const { data: streak } = await supabase
    .from('streaks')
    .select('count')
    .eq('student_id', studentId)
    .single()

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Hi, {studentName}</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Pick a topic to practice.</p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
        borderRadius: '14px', background: '#FAEBDA', marginBottom: '28px'
      }}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#834F1C' }}>{streak?.count ?? 0}</span>
        <span style={{ fontSize: '13px', color: '#834F1C' }}>day streak</span>
      </div>

      {(!topics || topics.length === 0) && (
        <p style={{ color: '#888' }}>Nothing available yet — check back once your teacher adds content.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {topics?.map(topic => (
          <Link
            key={topic.id}
            href={`/student/topics/${topic.id}`}
            style={{
              display: 'block',
              padding: '16px 18px',
              border: '1px solid #ddd',
              borderRadius: '12px',
              textDecoration: 'none',
              color: '#222',
            }}
          >
            {topic.name}
          </Link>
        ))}
      </div>
    </div>
  )
}