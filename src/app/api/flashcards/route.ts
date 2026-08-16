import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { friendlyDbError } from '@/lib/dbErrors'

const NEW_CARDS_PER_SESSION = 10
const today = () => new Date().toISOString().slice(0, 10)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topic_id')
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value

  const [{ data: allCards, error }, { data: topic }] = await Promise.all([
    supabaseAdmin
      .from('flashcards')
      .select('id, front, back, image_url, answer_image_url')
      .eq('topic_id', topicId),
    supabaseAdmin.from('topics').select('name').eq('id', topicId).maybeSingle(),
  ])

  if (error) {
    console.error('Flashcard load failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not load cards.') }, { status: 500 })
  }

  const topic_name = topic?.name ?? ''
  if (!allCards?.length) return NextResponse.json({ flashcards: [], topic_name })
  if (!studentId) return NextResponse.json({ flashcards: allCards, topic_name })

  const cardIds = allCards.map(c => c.id)

  const { data: schedules } = await supabaseAdmin
    .from('flashcard_schedule')
    .select('flashcard_id, due_date')
    .eq('student_id', studentId)
    .in('flashcard_id', cardIds)

  const scheduledMap = new Map<number, string>()
  ;(schedules ?? []).forEach(s => scheduledMap.set(s.flashcard_id, s.due_date))

  const todayStr = today()

  const dueCards = allCards.filter(c => {
    const due = scheduledMap.get(c.id)
    return due && due <= todayStr
  })

  const newCards = allCards.filter(c => !scheduledMap.has(c.id))
  const newToShow = newCards.slice(0, Math.max(0, NEW_CARDS_PER_SESSION - dueCards.length))
  const flashcards = [...dueCards, ...newToShow]

  return NextResponse.json({
    flashcards,
    topic_name,
    due_count: dueCards.length,
    new_count: newToShow.length,
    total_due: dueCards.length + newCards.length,
  })
}
