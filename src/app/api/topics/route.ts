import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { friendlyDbError } from '@/lib/dbErrors'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { name, chapter_id, emoji, color } = await request.json()

  const { count } = await supabaseAdmin
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapter_id)

  const { error } = await supabaseAdmin.from('topics').insert({
    name,
    chapter_id,
    order_index: count ?? 0,
    emoji: emoji ?? null,
    color: color ?? null,
  })

  if (error) {
    console.error('Topic create failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not create this topic.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
