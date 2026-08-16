import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { countMcqChildren, deleteMcqDeep } from '@/lib/cascade'
import { friendlyDbError } from '@/lib/dbErrors'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const force = new URL(request.url).searchParams.get('force') === 'true'
  const children = await countMcqChildren(id)

  if (children.total > 0 && !force) {
    return NextResponse.json(
      {
        requiresConfirm: true,
        counts: children,
        message: `This problem has ${children.attempts} student attempt${children.attempts === 1 ? '' : 's'} recorded.`,
      },
      { status: 409 }
    )
  }

  const { error } = children.total > 0
    ? await deleteMcqDeep(id)
    : await supabaseAdmin.from('mcqs').delete().eq('id', id)

  if (error) {
    console.error('MCQ delete failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not delete this problem.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const { question, options, correct_index, explanation, hint, image_url, explanation_image_url } = await request.json()

  const update: Record<string, unknown> = {}
  if (question !== undefined) update.question = question
  if (options !== undefined) update.options = options
  if (correct_index !== undefined) update.correct_index = correct_index
  if (explanation !== undefined) update.explanation = explanation
  if (hint !== undefined) update.hint = hint || null
  if (image_url !== undefined) update.image_url = image_url || null
  if (explanation_image_url !== undefined) update.explanation_image_url = explanation_image_url || null

  const { error } = await supabaseAdmin.from('mcqs').update(update).eq('id', id)
  if (error) {
    console.error('MCQ update failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not save this problem.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
