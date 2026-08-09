import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

export async function GET() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) {
    return NextResponse.json({ message: 'Not logged in' }, { status: 401 })
  }

  const { data } = await supabase
    .from('streaks')
    .select('count, last_practice_date')
    .eq('student_id', studentId)
    .single()

  return NextResponse.json({ count: data?.count ?? 0 })
}

export async function POST() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) {
    return NextResponse.json({ message: 'Not logged in' }, { status: 401 })
  }

  const today = todayStr()
  const yesterday = yesterdayStr()

  const { data: existing } = await supabase
    .from('streaks')
    .select('id, count, last_practice_date')
    .eq('student_id', studentId)
    .single()

  if (!existing) {
    await supabase.from('streaks').insert({ student_id: studentId, count: 1, last_practice_date: today })
    return NextResponse.json({ count: 1 })
  }

  if (existing.last_practice_date === today) {
    return NextResponse.json({ count: existing.count })
  }

  const newCount = existing.last_practice_date === yesterday ? existing.count + 1 : 1

  await supabase
    .from('streaks')
    .update({ count: newCount, last_practice_date: today })
    .eq('id', existing.id)

  return NextResponse.json({ count: newCount })
}
