import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { friendlyDbError } from '@/lib/dbErrors'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { name, emoji, color } = await request.json()

  const { count } = await supabaseAdmin.from('chapters').select('*', { count: 'exact', head: true })

  const { error } = await supabaseAdmin.from('chapters').insert({
    name,
    emoji: emoji ?? '',
    color: color ?? '',
    order_index: count ?? 0,
  })

  if (error) {
    console.error('Chapter create failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not create this chapter.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
