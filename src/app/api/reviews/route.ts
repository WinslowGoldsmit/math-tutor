import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { checkFlashcardCompletion } from '@/lib/badges'
import { sm2, type Rating, RATING_SCORE } from '@/lib/sm2'
import { friendlyDbError } from '@/lib/dbErrors'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) {
    return NextResponse.json({ message: 'Not logged in' }, { status: 401 })
  }

  const body = await request.json()
  const flashcard_id = body.flashcard_id
  const rawRating = body.rating

  const ratingWord: Rating =
    typeof rawRating === 'number'
      ? ((Object.keys(RATING_SCORE) as Rating[]).find(k => RATING_SCORE[k] === rawRating) ?? 'good')
      : (rawRating as Rating)

  const ratingScore = RATING_SCORE[ratingWord] ?? 3

  // Save review event — try numeric first, fall back to text
  let reviewError = (
    await supabaseAdmin
      .from('reviews')
      .insert({ student_id: studentId, flashcard_id, rating: ratingScore })
  ).error

  if (reviewError && (reviewError.code === '22P02' || (reviewError.message ?? '').includes('invalid input syntax'))) {
    reviewError = (
      await supabaseAdmin
        .from('reviews')
        .insert({ student_id: studentId, flashcard_id, rating: ratingWord })
    ).error
  }

  if (reviewError) {
    console.error('Review insert failed:', reviewError)
    return NextResponse.json({ message: friendlyDbError(reviewError, 'Could not save that rating.') }, { status: 500 })
  }

  // Get current schedule state — now includes card_state and learning_step
  const { data: existing, error: scheduleReadError } = await supabaseAdmin
    .from('flashcard_schedule')
    .select('id, interval_days, ease_factor, review_count, card_state, learning_step')
    .eq('student_id', studentId)
    .eq('flashcard_id', flashcard_id)
    .maybeSingle()

  if (scheduleReadError) {
    console.error('Schedule read failed:', scheduleReadError)
    return NextResponse.json({ success: true })
  }

  const next = sm2(existing ?? null, ratingWord)

  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from('flashcard_schedule')
      .update({
        interval_days: next.interval_days,
        ease_factor: next.ease_factor,
        review_count: next.review_count,
        due_date: next.due_date,
        card_state: next.card_state,
        learning_step: next.learning_step,
      })
      .eq('id', existing.id)
    if (updateError) console.error('Schedule update failed:', updateError)
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
        card_state: next.card_state,
        learning_step: next.learning_step,
      })
    if (insertError) console.error('Schedule insert failed:', insertError)
  }

  // Badge check
  try {
    const { data: card } = await supabaseAdmin
      .from('flashcards')
      .select('topic_id')
      .eq('id', flashcard_id)
      .single()
    if (card?.topic_id) await checkFlashcardCompletion(studentId, card.topic_id)
  } catch (e) {
    console.error('Badge check failed:', e)
  }

  return NextResponse.json({
    success: true,
    next_due: next.due_date,
    card_state: next.card_state,
  })
}
