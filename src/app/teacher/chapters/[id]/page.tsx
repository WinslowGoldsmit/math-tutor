import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function ChapterDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: chapter } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('id', id)
    .single()

  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, order_index')
    .eq('chapter_id', id)
    .order('order_index')

  return (
    <div className="page">
      <Link href="/teacher" className="back-link">&larr; Back</Link>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>{chapter?.name}</h1>

      <div className="section-title" style={{ marginTop: 0 }}>Topics</div>
      {(!topics || topics.length === 0) && <div className="empty">No topics yet.</div>}
      {topics?.map(t => (
        <Link key={t.id} href={`/teacher/topics/${t.id}`} className="list-link">
          {t.name}
        </Link>
      ))}

      <Link href={`/teacher/chapters/${id}/topics/new`} className="btn-ghost" style={{ display: 'inline-block', marginTop: '4px' }}>
        + Add a topic
      </Link>
    </div>
  )
}