import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params

  // Delete all related rows first to avoid foreign key violations
  await supabaseAdmin.from('access').delete().eq('student_id', id)
  await supabaseAdmin.from('reviews').delete().eq('student_id', id)
  await supabaseAdmin.from('attempts').delete().eq('student_id', id)
  await supabaseAdmin.from('streaks').delete().eq('student_id', id)
  await supabaseAdmin.from('badges').delete().eq('student_id', id)
  await supabaseAdmin.from('student_profile').delete().eq('student_id', id)
  await supabaseAdmin.from('flashcard_schedule').delete().eq('student_id', id)

  // Now safe to delete the student
  const { error } = await supabaseAdmin.from('students').delete().eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
