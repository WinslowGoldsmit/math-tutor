import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, code } = await request.json()

  const { data, error } = await supabase
    .from('students')
    .select('id, name')
    .eq('name', name)
    .eq('code', code)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: 'Name or code not recognised.' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('student_id', String(data.id), { httpOnly: true, path: '/' })
  cookieStore.set('student_name', data.name, { httpOnly: true, path: '/' })

  return NextResponse.json({ success: true })
}