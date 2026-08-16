import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { countFlashcardChildren, deleteFlashcardDeep } from '@/lib/cascade'
import { friendlyDbError } from '@/lib/dbErrors'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const force = new URL(request.url).searchParams.get('force') === 'true'
  const children = await countFlashcardChildren(id)

  if (children.total > 0 && !force) {
    return NextResponse.json(
      {
        requiresConfirm: true,
        counts: children,
        message: `This card has ${children.reviews} student review${children.reviews === 1 ? '' : 's'} recorded.`,
      },
      { status: 409 }
    )
  }

  const { error } = children.total > 0
    ? await deleteFlashcardDeep(id)
    : await supabaseAdmin.from('flashcards').delete().eq('id', id)

  if (error) {
    console.error('Flashcard delete failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not delete this card.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { id } = await params
  const { front, back, image_url, answer_image_url } = await request.json()

  const update: Record<string, unknown> = {}
  if (front !== undefined) update.front = front
  if (back !== undefined) update.back = back
  if (image_url !== undefined) update.image_url = image_url || null
  if (answer_image_url !== undefined) update.answer_image_url = answer_image_url || null

  const { error } = await supabaseAdmin.from('flashcards').update(update).eq('id', id)
  if (error) {
    console.error('Flashcard update failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not save this card.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
