import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Topbar from '@/app/Topbar'
import BulkAddForm from './BulkAddForm'
import FlashcardItem from './FlashcardItem'
import McqItem from './McqItem'

export default async function TopicDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [
    { data: topic },
    { data: flashcards },
    { data: mcqs },
  ] = await Promise.all([
    supabaseAdmin.from('topics').select('id, name, chapter_id').eq('id', id).single(),
    supabaseAdmin.from('flashcards').select('id, front, back, image_url, answer_image_url').eq('topic_id', id),
    supabaseAdmin.from('mcqs').select('id, question, options, correct_index, explanation, hint, image_url, explanation_image_url').eq('topic_id', id),
  ])

  return (
    <>
      <Topbar role="teacher" />
      <div className="page-wide" style={{ paddingTop: '16px' }}>
        <Link href={`/teacher/chapters/${topic?.chapter_id}`} className="back-link">← Chapter</Link>
        <h1 className="page-title" style={{ marginBottom: '24px' }}>{topic?.name}</h1>

        <section style={{ marginBottom: '32px' }}>
          <div className="section-label" style={{ marginTop: 0 }}>
            Flashcards ({flashcards?.length ?? 0})
          </div>
          {(!flashcards || flashcards.length === 0) && (
            <div className="empty">No flashcards yet. Use the form below to add some.</div>
          )}
          {flashcards?.map(f => <FlashcardItem key={f.id} card={f as any} />)}
          <BulkAddForm topicId={id} type="flashcards" />
        </section>

        <section>
          <div className="section-label">Problems ({mcqs?.length ?? 0})</div>
          {(!mcqs || mcqs.length === 0) && (
            <div className="empty">No problems yet. Use the form below to add some.</div>
          )}
          {mcqs?.map(q => <McqItem key={q.id} mcq={q as any} />)}
          <BulkAddForm topicId={id} type="mcqs" />
        </section>
      </div>
    </>
  )
}
