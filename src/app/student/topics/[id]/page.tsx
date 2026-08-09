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
    <div style={{ maxWidth: '420px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <Link href="/student" style={{ color: '#888', fontSize: '13px' }}>&larr; Back</Link>
      <h1 style={{ fontSize: '22px', margin: '10px 0 28px' }}>{topic?.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Link
          href={`/student/topics/${id}/flashcards`}
          style={{ padding: '24px 12px', border: '1px solid #ddd', borderRadius: '14px', textAlign: 'center', textDecoration: 'none', color: '#222' }}
        >
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{fcCount ?? 0}</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Flashcards</div>
        </Link>
        <Link
          href={`/student/topics/${id}/problems`}
          style={{ padding: '24px 12px', border: '1px solid #ddd', borderRadius: '14px', textAlign: 'center', textDecoration: 'none', color: '#222' }}
        >
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{mcqCount ?? 0}</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Problems</div>
        </Link>
      </div>
    </div>
  )
}

