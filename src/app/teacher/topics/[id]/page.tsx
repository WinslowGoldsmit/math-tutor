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
    <div className="page">
      <Link href={`/teacher/chapters/${topic?.chapter_id}`} className="back-link">&larr; Back</Link>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>{topic?.name}</h1>

      <section style={{ marginBottom: '32px' }}>
        <div className="section-title" style={{ marginTop: 0 }}>Flashcards ({flashcards?.length ?? 0})</div>
        {(!flashcards || flashcards.length === 0) && <div className="empty">None yet.</div>}
        {flashcards?.map(f => (
          <div key={f.id} className="card" style={{ padding: '10px 12px', fontSize: '13px' }}>{f.front}</div>
        ))}
        <BulkAddForm topicId={id} type="flashcards" />
      </section>

      <section>
        <div className="section-title">Problems ({mcqs?.length ?? 0})</div>
        {(!mcqs || mcqs.length === 0) && <div className="empty">None yet.</div>}
        {mcqs?.map(q => (
          <div key={q.id} className="card" style={{ padding: '10px 12px', fontSize: '13px' }}>{q.question}</div>
        ))}
        <BulkAddForm topicId={id} type="mcqs" />
      </section>
    </div>
  )
}