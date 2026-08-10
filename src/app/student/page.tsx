import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function StudentHome() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  const studentName = cookieStore.get('student_name')?.value

  if (!studentId) redirect('/login')

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
    <div className="page">
      <h1 className="page-title">Hi, {studentName}</h1>
      <p className="page-sub">Pick a topic to practice.</p>

      <div className="streak-badge">
        <span className="num">{streak?.count ?? 0}</span>
        <span className="lbl">day streak</span>
      </div>

      {(!topics || topics.length === 0) && (
        <div className="empty">Nothing available yet — check back once your teacher adds content.</div>
      )}

      {topics?.map(topic => (
        <Link key={topic.id} href={`/student/topics/${topic.id}`} className="list-link">
          {topic.name}
        </Link>
      ))}
    </div>
  )
}