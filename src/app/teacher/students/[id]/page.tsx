import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AccessToggles from './AccessToggles'

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: student } = await supabase.from('students').select('id, name').eq('id', id).single()
  const { data: reviews } = await supabase.from('reviews').select('id, rating, flashcards(front)').eq('student_id', id)
  const { data: attempts } = await supabase.from('attempts').select('id, selected_index, is_correct, mcqs(question, options)').eq('student_id', id)
  const { data: allTopics } = await supabase.from('topics').select('id, name').order('order_index')
  const { data: accessRows } = await supabase.from('access').select('topic_id').eq('student_id', id)

  const initiallyAllowed = accessRows?.map(r => r.topic_id) ?? []

  return (
    <div className="page">
      <Link href="/teacher" className="back-link">&larr; Back</Link>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>{student?.name}</h1>

      <section style={{ marginBottom: '32px' }}>
        <div className="section-title" style={{ marginTop: 0 }}>Topic access</div>
        <p className="msg-text" style={{ marginBottom: '10px' }}>
          If none are marked Allowed, this student can see every topic by default.
        </p>
        <AccessToggles studentId={id} allTopics={allTopics ?? []} initiallyAllowed={initiallyAllowed} />
      </section>

      <section style={{ marginBottom: '32px' }}>
        <div className="section-title">Flashcard reviews ({reviews?.length ?? 0})</div>
        {(!reviews || reviews.length === 0) && <div className="empty">None yet.</div>}
        <table className="log-table">
          <tbody>
            {reviews?.map((r: any) => (
              <tr key={r.id}>
                <td>{r.flashcards?.front}</td>
                <td style={{ textTransform: 'capitalize', color: 'var(--ink-soft)' }}>{r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <div className="section-title">Problem attempts ({attempts?.length ?? 0})</div>
        {(!attempts || attempts.length === 0) && <div className="empty">None yet.</div>}
        <table className="log-table">
          <tbody>
            {attempts?.map((a: any) => {
              let label = 'Skipped', cls = 'tag-skip'
              if (a.is_correct === true) { label = 'Correct'; cls = 'tag-ok' }
              else if (a.is_correct === false) { label = 'Incorrect'; cls = 'tag-no' }
              return (
                <tr key={a.id}>
                  <td>{a.mcqs?.question}</td>
                  <td>{a.selected_index !== null ? a.mcqs?.options[a.selected_index] : '—'}</td>
                  <td className={cls}>{label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}