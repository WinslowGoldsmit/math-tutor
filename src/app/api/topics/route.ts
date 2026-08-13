import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
  }

  const { name, chapter_id } = await request.json()

  const { count } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapter_id)

  const { error } = await supabase
    .from('topics')
    .insert({ name, chapter_id, order_index: count ?? 0 })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}