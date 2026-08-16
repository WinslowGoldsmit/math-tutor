import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { checkFlashcardCompletion } from '@/lib/badges'
import { sm2, type Rating } from '@/lib/sm2'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) {
    return NextResponse.json({ message: 'Not logged in' }, { status: 401 })
  }

  const { flashcard_id, rating } = await request.json()

  // Save the raw review event
  const { error: reviewError } = await supabaseAdmin
    .from('reviews')
    .insert({ student_id: studentId, flashcard_id, rating })

  if (reviewError) {
    console.error('Review insert error:', reviewError)
    return NextResponse.json({ message: reviewError.message }, { status: 500 })
  }

  // Get current schedule state
  const { data: existing, error: scheduleReadError } = await supabaseAdmin
    .from('flashcard_schedule')
    .select('id, interval_days, ease_factor, review_count')
    .eq('student_id', studentId)
    .eq('flashcard_id', flashcard_id)
    .maybeSingle()

  if (scheduleReadError) {
    console.error('Schedule read error:', scheduleReadError)
    // Don't fail — review is already saved, just skip scheduling
    return NextResponse.json({ success: true })
  }

  // Run SM-2
  const next = sm2(existing ?? null, rating as Rating)

  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from('flashcard_schedule')
      .update({
        interval_days: next.interval_days,
        ease_factor: next.ease_factor,
        review_count: next.review_count,
        due_date: next.due_date,
      })
      .eq('id', existing.id)
    if (updateError) console.error('Schedule update error:', updateError)
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('flashcard_schedule')
      .insert({
        student_id: studentId,
        flashcard_id,
        interval_days: next.interval_days,
        ease_factor: next.ease_factor,
        review_count: next.review_count,
        due_date: next.due_date,
      })
    if (insertError) console.error('Schedule insert error:', insertError)
  }

  // Badge check — non-blocking
  try {
    const { data: card } = await supabaseAdmin
      .from('flashcards')
      .select('topic_id')
      .eq('id', flashcard_id)
      .single()
    if (card?.topic_id) await checkFlashcardCompletion(studentId, card.topic_id)
  } catch (e) {
    console.error('Badge check error:', e)
  }

  return NextResponse.json({ success: true, next_due: next.due_date })
}
