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
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <Link href="/teacher" style={{ color: '#888', fontSize: '13px' }}>&larr; Back</Link>
      <h1 style={{ fontSize: '22px', margin: '10px 0 24px' }}>{chapter?.name}</h1>

      <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>Topics</h2>
      {(!topics || topics.length === 0) && <p style={{ color: '#888' }}>No topics yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {topics?.map(t => (
          <Link
            key={t.id}
            href={`/teacher/topics/${t.id}`}
            style={{ padding: '14px 16px', border: '1px solid #ddd', borderRadius: '10px', textDecoration: 'none', color: '#222' }}
          >
            {t.name}
          </Link>
        ))}
      </div>

      <Link href={`/teacher/chapters/${id}/topics/new`} style={{ color: '#33636A' }}>
        + Add a topic
      </Link>
    </div>
  )
}