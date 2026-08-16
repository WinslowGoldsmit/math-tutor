import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'
import DeleteButton from '@/app/DeleteButton'
import TopicList from './TopicList'

export default async function ChapterDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: chapter }, { data: topics }] = await Promise.all([
    supabaseAdmin.from('chapters').select('id, name, emoji, color').eq('id', id).single(),
    supabaseAdmin.from('topics').select('id, name, order_index, emoji, color').eq('chapter_id', id).order('order_index'),
  ])

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href="/teacher" className="back-link">← Dashboard</Link>

        <div className="chapter-box" style={{ background: chapter?.color || 'var(--bg-sunken)', marginBottom: '24px' }}>
          <div className="chapter-box-header" style={{ marginBottom: 0 }}>
            {chapter?.emoji && <span className="chapter-emoji">{chapter.emoji}</span>}
            <span className="chapter-title" style={{ fontSize: '20px' }}>{chapter?.name}</span>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 0 }}>Topics ({topics?.length ?? 0})</div>
        <TopicList topics={(topics ?? []) as any} />

        <Link href={`/teacher/chapters/${id}/topics/new`} className="btn-ghost" style={{ display: 'inline-block', marginTop: '8px' }}>
          + Add a topic
        </Link>

        <div className="section-label" style={{ color: 'var(--coral-dark)' }}>Danger zone</div>
        <p className="msg-text" style={{ marginBottom: '10px' }}>
          Deleting this chapter will show you exactly what will be removed before anything is deleted.
        </p>
        <DeleteButton id={parseInt(id)} type="chapters" redirectTo="/teacher" label="Delete chapter" />
      </div>
    </>
  )
}
