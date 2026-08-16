import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'
import DeleteButton from '@/app/DeleteButton'
import TopicRow from './TopicRow'

export default async function ChapterDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: chapter }, { data: topics }] = await Promise.all([
    supabaseAdmin.from('chapters').select('id, name').eq('id', id).single(),
    supabaseAdmin.from('topics').select('id, name, order_index').eq('chapter_id', id).order('order_index'),
  ])

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href="/teacher" className="back-link">← Dashboard</Link>
        <h1 className="page-title" style={{ marginBottom: '24px' }}>{chapter?.name}</h1>

        <div className="section-label" style={{ marginTop: 0 }}>Topics</div>
        {(!topics || topics.length === 0) && (
          <div className="empty">No topics yet. Add one below to start building content.</div>
        )}
        {topics?.map(t => <TopicRow key={t.id} id={t.id} name={t.name} />)}

        <Link href={`/teacher/chapters/${id}/topics/new`} className="btn-ghost" style={{ display: 'inline-block', marginTop: '4px' }}>
          + Add a topic
        </Link>

        <div className="section-label" style={{ color: 'var(--coral-dark)' }}>Danger zone</div>
        <p className="msg-text" style={{ marginBottom: '10px' }}>
          Deleting this chapter will only work if all topics inside it are deleted first.
        </p>
        <DeleteButton id={parseInt(id)} type="chapters" redirectTo="/teacher" label="Delete chapter" />
      </div>
    </>
  )
}
