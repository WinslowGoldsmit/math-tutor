import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) return NextResponse.json({ message: 'Not logged in' }, { status: 401 })

  const { avatar } = await request.json()

  const { data: existing } = await supabaseAdmin
    .from('student_profile').select('id').eq('student_id', studentId).maybeSingle()

  if (existing) {
    await supabaseAdmin.from('student_profile').update({ avatar }).eq('student_id', studentId)
  } else {
    await supabaseAdmin.from('student_profile').insert({ student_id: studentId, avatar })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('student_id')?.value
  if (!studentId) return NextResponse.json({ message: 'Not logged in' }, { status: 401 })

  await supabaseAdmin.from('student_profile').delete().eq('student_id', studentId)
  return NextResponse.json({ success: true })
}
