import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { friendlyDbError } from '@/lib/dbErrors'

/** Teacher-only. Every note sent to every student, newest first. */
export async function GET() {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const [{ data: messages, error }, { data: students }] = await Promise.all([
    supabaseAdmin
      .from('student_messages')
      .select('id, student_id, message, is_read, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('students').select('id, name'),
  ])

  if (error) {
    console.error('Message inbox load failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not load notes.') }, { status: 500 })
  }

  const nameById = new Map((students ?? []).map(s => [s.id, s.name]))
  const withNames = (messages ?? []).map(m => ({ ...m, student_name: nameById.get(m.student_id) ?? 'Unknown student' }))

  return NextResponse.json({ messages: withNames })
}
