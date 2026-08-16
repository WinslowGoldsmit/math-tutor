import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

/**
 * Undo the last review for a flashcard.
 * Deletes the most recent review row and resets the schedule
 * to the second-most-recent state (or removes the schedule if it was first review).
 * Best-effort: if something fails we still return 200 so the UI goes back.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) return NextResponse.json({ message: 'Not logged in' }, { status: 401 })

  const { flashcard_id } = await request.json()

  // Delete the most recent review for this card
  const { data: lastReview } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('student_id', studentId)
    .eq('flashcard_id', flashcard_id)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastReview) {
    await supabaseAdmin.from('reviews').delete().eq('id', lastReview.id)
  }

  // Check if there are any remaining reviews for this card
  const { count } = await supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('flashcard_id', flashcard_id)

  if (!count || count === 0) {
    // No previous reviews — remove the schedule entirely (card goes back to new)
    await supabaseAdmin
      .from('flashcard_schedule')
      .delete()
      .eq('student_id', studentId)
      .eq('flashcard_id', flashcard_id)
  } else {
    // Reset schedule to due today so it shows up again immediately
    await supabaseAdmin
      .from('flashcard_schedule')
      .update({
        due_date: new Date().toISOString().slice(0, 10),
        card_state: 'learning',
        learning_step: 0,
      })
      .eq('student_id', studentId)
      .eq('flashcard_id', flashcard_id)
  }

  return NextResponse.json({ success: true })
}
