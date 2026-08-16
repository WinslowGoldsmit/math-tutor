import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

export async function POST(request: Request) {
  const { name, code } = await request.json()

  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, name, class')
    .eq('name', name)
    .eq('code', code)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: 'Name or code not recognised.' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('student_id', String(data.id), { httpOnly: true, path: '/', maxAge: SESSION_MAX_AGE })
  cookieStore.set('student_name', data.name, { httpOnly: true, path: '/', maxAge: SESSION_MAX_AGE })
  cookieStore.set('student_class', data.class ?? '10', { httpOnly: true, path: '/', maxAge: SESSION_MAX_AGE })

  return NextResponse.json({ success: true })
}
