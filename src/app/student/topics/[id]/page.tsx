import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function TopicHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: topic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('id', id)
    .single()

  const { count: fcCount } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', id)

  const { count: mcqCount } = await supabase
    .from('mcqs')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', id)

  return (
    <div className="page">
      <Link href="/student" className="back-link">&larr; Back</Link>
      <h1 className="page-title" style={{ marginBottom: '28px' }}>{topic?.name}</h1>

      <div className="mode-grid">
        <Link href={`/student/topics/${id}/flashcards`} className="mode-card">
          <div className="n">{fcCount ?? 0}</div>
          <div className="l">Flashcards</div>
        </Link>
        <Link href={`/student/topics/${id}/problems`} className="mode-card">
          <div className="n">{mcqCount ?? 0}</div>
          <div className="l">Problems</div>
        </Link>
      </div>
    </div>
  )
}