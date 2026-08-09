import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import BulkAddForm from './BulkAddForm'

export default async function TopicDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: topic } = await supabase
    .from('topics')
    .select('id, name, chapter_id')
    .eq('id', id)
    .single()

  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('id, front, back')
    .eq('topic_id', id)

  const { data: mcqs } = await supabase
    .from('mcqs')
    .select('id, question')
    .eq('topic_id', id)

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <Link href={`/teacher/chapters/${topic?.chapter_id}`} style={{ color: '#888', fontSize: '13px' }}>&larr; Back</Link>
      <h1 style={{ fontSize: '22px', margin: '10px 0 24px' }}>{topic?.name}</h1>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>
          Flashcards ({flashcards?.length ?? 0})
        </h2>
        {(!flashcards || flashcards.length === 0) && <p style={{ color: '#888' }}>None yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {flashcards?.map(f => (
            <div key={f.id} style={{ padding: '10px 12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px' }}>
              {f.front}
            </div>
          ))}
        </div>
        <BulkAddForm topicId={id} type="flashcards" />
      </section>

      <section>
        <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>
          Problems ({mcqs?.length ?? 0})
        </h2>
        {(!mcqs || mcqs.length === 0) && <p style={{ color: '#888' }}>None yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {mcqs?.map(q => (
            <div key={q.id} style={{ padding: '10px 12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px' }}>
              {q.question}
            </div>
          ))}
        </div>
        <BulkAddForm topicId={id} type="mcqs" />
      </section>
    </div>
  )
}