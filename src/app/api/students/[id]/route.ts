import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { deleteStudentDeep } from '@/lib/cascade'
import { friendlyDbError } from '@/lib/dbErrors'

/**
 * Deleting a student clears every table that references them.
 * student_messages was missing from the old list, which caused
 * "Delete this student? This can't be undone." to fail with an FK error
 * for any student who had received a teacher note.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const { error } = await deleteStudentDeep(id)

  if (error) {
    console.error('Student delete failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not remove this student.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
