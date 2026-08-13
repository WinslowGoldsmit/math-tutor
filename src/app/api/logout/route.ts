import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('student_id')
  cookieStore.delete('student_name')
  cookieStore.delete('is_teacher')
  return NextResponse.json({ success: true })
}