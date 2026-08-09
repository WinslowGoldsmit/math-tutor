import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AccessToggles from './AccessToggles'

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', id)
    .single()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, flashcards(front)')
    .eq('student_id', id)

  const { data: attempts } = await supabase
    .from('attempts')
    .select('id, selected_index, is_correct, mcqs(question, options)')
    .eq('student_id', id)

  const { data: allTopics } = await supabase
    .from('topics')
    .select('id, name')
    .order('order_index')

  const { data: accessRows } = await supabase
    .from('access')
    .select('topic_id')
    .eq('student_id', id)

  const initiallyAllowed = accessRows?.map(r => r.topic_id) ?? []

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px', fontFamily: 'sans-serif' }}>
      <Link href="/teacher" style={{ color: '#888', fontSize: '13px' }}>&larr; Back</Link>
      <h1 style={{ fontSize: '22px', margin: '10px 0 24px' }}>{student?.name}</h1>
      

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>Topic access</h2>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
          If none are marked Allowed, this student can see every topic by default.
        </p>
        <AccessToggles
          studentId={id}
          allTopics={allTopics ?? []}
          initiallyAllowed={initiallyAllowed}
        />
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>
          Flashcard reviews ({reviews?.length ?? 0})
        </h2>
        {(!reviews || reviews.length === 0) && <p style={{ color: '#888' }}>None yet.</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <tbody>
            {reviews?.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 4px' }}>{r.flashcards?.front}</td>
                <td style={{ padding: '8px 4px', textTransform: 'capitalize', color: '#666' }}>{r.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={{ fontSize: '15px', color: '#666', marginBottom: '10px' }}>
          Problem attempts ({attempts?.length ?? 0})
        </h2>
        {(!attempts || attempts.length === 0) && <p style={{ color: '#888' }}>None yet.</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <tbody>
            {attempts?.map((a: any) => {
              let resultLabel = 'Skipped'
              let color = '#888'
              if (a.is_correct === true) { resultLabel = 'Correct'; color = '#3D5C3D' }
              else if (a.is_correct === false) { resultLabel = 'Incorrect'; color = '#8C3B31' }
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px' }}>{a.mcqs?.question}</td>
                  <td style={{ padding: '8px 4px' }}>
                    {a.selected_index !== null ? a.mcqs?.options[a.selected_index] : '—'}
                  </td>
                  <td style={{ padding: '8px 4px', color, fontWeight: 500 }}>{resultLabel}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}