import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value

  if (!studentId) {
    return NextResponse.json({ message: 'Not logged in' }, { status: 401 })
  }

  const { flashcard_id, rating } = await request.json()

  const { error } = await supabase
    .from('reviews')
    .insert({ student_id: studentId, flashcard_id, rating })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
