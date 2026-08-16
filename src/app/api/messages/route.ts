import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

// Teacher sends a message to a student
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { student_id, message } = await request.json()
  const { error } = await supabaseAdmin
    .from('student_messages')
    .insert({ student_id, message, teacher_note: true, is_read: false })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Student fetches their messages
// Returns: unread (for home screen) + read within 3 days (for archive)
export async function GET() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) return NextResponse.json({ message: 'Not logged in' }, { status: 401 })

  // Auto-delete messages older than 3 days
  const cutoff = new Date(Date.now() - THREE_DAYS_MS).toISOString()
  await supabaseAdmin
    .from('student_messages')
    .delete()
    .eq('student_id', studentId)
    .lt('created_at', cutoff)

  const { data, error } = await supabaseAdmin
    .from('student_messages')
    .select('id, message, is_read, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}
