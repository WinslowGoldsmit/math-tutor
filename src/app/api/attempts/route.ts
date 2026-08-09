import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value

  if (!studentId) {
    return NextResponse.json({ message: 'Not logged in' }, { status: 401 })
  }

  const { mcq_id, selected_index } = await request.json()

  const { data: mcq } = await supabase
    .from('mcqs')
    .select('correct_index')
    .eq('id', mcq_id)
    .single()

  const is_correct =
    selected_index === null ? null : selected_index === mcq?.correct_index

  const { error } = await supabase
    .from('attempts')
    .insert({ student_id: studentId, mcq_id, selected_index, is_correct })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
