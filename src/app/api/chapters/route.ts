import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { name, emoji, color } = await request.json()
  const { error } = await supabaseAdmin.from('chapters').insert({ name, emoji: emoji ?? '', color: color ?? '' })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
