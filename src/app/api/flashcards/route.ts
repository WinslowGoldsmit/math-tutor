import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

const NEW_CARDS_PER_SESSION = 10
const today = () => new Date().toISOString().slice(0, 10)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topic_id')
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value

  const { data: allCards, error } = await supabaseAdmin
    .from('flashcards')
    .select('id, front, back, image_url')
    .eq('topic_id', topicId)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  if (!allCards?.length) return NextResponse.json({ flashcards: [] })

  if (!studentId) return NextResponse.json({ flashcards: allCards })

  const cardIds = allCards.map(c => c.id)

  // Get existing schedules for this student
  const { data: schedules } = await supabaseAdmin
    .from('flashcard_schedule')
    .select('flashcard_id, due_date')
    .eq('student_id', studentId)
    .in('flashcard_id', cardIds)

  const scheduledMap = new Map<number, string>()
  ;(schedules ?? []).forEach(s => scheduledMap.set(s.flashcard_id, s.due_date))

  const todayStr = today()

  // Due cards: have a schedule AND due_date <= today
  const dueCards = allCards.filter(c => {
    const due = scheduledMap.get(c.id)
    return due && due <= todayStr
  })

  // New cards: never reviewed (no schedule entry)
  const newCards = allCards.filter(c => !scheduledMap.has(c.id))

  // Combine: due first, then new cards up to limit
  const newToShow = newCards.slice(0, Math.max(0, NEW_CARDS_PER_SESSION - dueCards.length))
  const flashcards = [...dueCards, ...newToShow]

  return NextResponse.json({
    flashcards,
    due_count: dueCards.length,
    new_count: newToShow.length,
    total_due: dueCards.length + newCards.length,
  })
}
