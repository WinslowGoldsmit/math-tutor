import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
  }
  const { id } = await params
  const { error } = await supabaseAdmin.from('flashcards').delete().eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
  }
  const { id } = await params
  const { front, back } = await request.json()
  const { error } = await supabaseAdmin.from('flashcards').update({ front, back }).eq('id', id)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}