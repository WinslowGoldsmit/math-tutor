import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DeleteButton from '../../../DeleteButton'

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
        <div key={t.id} className="list-link" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/teacher/topics/${t.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
            {t.name}
          </Link>
          <DeleteButton id={t.id} type="topics" />
        </div>
      ))}

      <Link href={`/teacher/chapters/${id}/topics/new`} className="btn-ghost" style={{ display: 'inline-block', marginTop: '4px' }}>
        + Add a topic
      </Link>

      <div className="section-title">Danger zone</div>
      <DeleteButton id={parseInt(id)} type="chapters" redirectTo="/teacher" />
    </div>
  )
}