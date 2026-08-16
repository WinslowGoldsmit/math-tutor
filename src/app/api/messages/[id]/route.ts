import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

// Mark message as read
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) return NextResponse.json({ message: 'Not logged in' }, { status: 401 })
  const { id } = await params
  await supabaseAdmin.from('student_messages').update({ is_read: true }).eq('id', id).eq('student_id', studentId)
  return NextResponse.json({ success: true })
}

// Teacher deletes a message
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
  const { id } = await params
  await supabaseAdmin.from('student_messages').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
