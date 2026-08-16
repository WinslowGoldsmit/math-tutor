import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { name, code, class: studentClass } = await request.json()

  // Prevent duplicate names
  const { data: existing } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ message: 'A student with this name already exists.' }, { status: 409 })
  }

  const { error } = await supabaseAdmin
    .from('students')
    .insert({ name, code, class: studentClass ?? '10' })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
