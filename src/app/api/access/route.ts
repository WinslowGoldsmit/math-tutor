import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
  }

  const { student_id, topic_id, allow } = await request.json()

  if (allow) {
    const { error } = await supabaseAdmin.from('access').insert({ student_id, topic_id })
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  } else {
    const { error } = await supabaseAdmin
      .from('access')
      .delete()
      .eq('student_id', student_id)
      .eq('topic_id', topic_id)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}