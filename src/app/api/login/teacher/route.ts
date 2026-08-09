import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.TEACHER_PASSWORD) {
    return NextResponse.json({ message: 'Incorrect password.' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('is_teacher', 'true', { httpOnly: true, path: '/' })

  return NextResponse.json({ success: true })
}