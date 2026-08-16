import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { countChapterChildren, deleteChapterDeep } from '@/lib/cascade'
import { friendlyDbError } from '@/lib/dbErrors'

/** Same confirm-then-cascade pattern as topics. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const force = new URL(request.url).searchParams.get('force') === 'true'
  const children = await countChapterChildren(id)

  if (children.total > 0 && !force) {
    const parts: string[] = []
    if (children.topics) parts.push(`${children.topics} topic${children.topics === 1 ? '' : 's'}`)
    if (children.flashcards) parts.push(`${children.flashcards} flashcard${children.flashcards === 1 ? '' : 's'}`)
    if (children.mcqs) parts.push(`${children.mcqs} problem${children.mcqs === 1 ? '' : 's'}`)

    return NextResponse.json(
      { requiresConfirm: true, counts: children, message: `This chapter still has ${parts.join(', ')}.` },
      { status: 409 }
    )
  }

  const { error } = children.total > 0
    ? await deleteChapterDeep(id)
    : await supabaseAdmin.from('chapters').delete().eq('id', id)

  if (error) {
    console.error('Chapter delete failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not delete this chapter.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const { name, emoji, color } = await request.json()

  const update: Record<string, unknown> = {}
  if (name !== undefined) update.name = name
  if (emoji !== undefined) update.emoji = emoji
  if (color !== undefined) update.color = color

  const { error } = await supabaseAdmin.from('chapters').update(update).eq('id', id)
  if (error) {
    console.error('Chapter update failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not save this chapter.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
