import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { countTopicChildren, deleteTopicDeep } from '@/lib/cascade'
import { friendlyDbError } from '@/lib/dbErrors'

/**
 * DELETE a topic.
 *
 * Foreign keys are "No action", so deleting a topic that still has flashcards
 * threw: 'violates foreign key constraint "flashcards_topic_id_fkey"'.
 *
 * Now: if the topic still has content we return 409 with the exact counts, so
 * the teacher can be told what will be lost. Re-calling with ?force=true
 * removes the children in dependency order, then the topic.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const force = new URL(request.url).searchParams.get('force') === 'true'
  const children = await countTopicChildren(id)

  if (children.total > 0 && !force) {
    const parts: string[] = []
    if (children.flashcards) parts.push(`${children.flashcards} flashcard${children.flashcards === 1 ? '' : 's'}`)
    if (children.mcqs) parts.push(`${children.mcqs} problem${children.mcqs === 1 ? '' : 's'}`)
    if (children.reviews + children.attempts) parts.push(`${children.reviews + children.attempts} student answer${children.reviews + children.attempts === 1 ? '' : 's'}`)
    if (children.access) parts.push(`${children.access} access setting${children.access === 1 ? '' : 's'}`)

    return NextResponse.json(
      { requiresConfirm: true, counts: children, message: `This topic still has ${parts.join(', ')}.` },
      { status: 409 }
    )
  }

  const { error } = children.total > 0
    ? await deleteTopicDeep(id)
    : await supabaseAdmin.from('topics').delete().eq('id', id)

  if (error) {
    console.error('Topic delete failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not delete this topic.') }, { status: 500 })
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

  const { error } = await supabaseAdmin.from('topics').update(update).eq('id', id)
  if (error) {
    console.error('Topic update failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not save this topic.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
