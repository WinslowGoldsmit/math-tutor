import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { checkStreakBadges } from '@/lib/badges'

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

  const { data } = await supabaseAdmin
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

  const { data: existing } = await supabaseAdmin
    .from('streaks')
    .select('id, count, last_practice_date')
    .eq('student_id', studentId)
    .single()

  let newCount = 1

  if (!existing) {
    await supabaseAdmin.from('streaks').insert({ student_id: studentId, count: 1, last_practice_date: today })
    newCount = 1
  } else if (existing.last_practice_date === today) {
    newCount = existing.count
  } else {
    newCount = existing.last_practice_date === yesterday ? existing.count + 1 : 1
    await supabaseAdmin
      .from('streaks')
      .update({ count: newCount, last_practice_date: today })
      .eq('id', existing.id)
  }

  await checkStreakBadges(studentId, newCount)

  return NextResponse.json({ count: newCount })
}
