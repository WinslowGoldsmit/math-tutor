import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { friendlyDbError } from '@/lib/dbErrors'

/** Teacher-only. Body: { ids: number[] } in the new display order. */
export async function PATCH(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { ids } = await request.json()
  if (!Array.isArray(ids)) return NextResponse.json({ message: 'Invalid order' }, { status: 400 })

  const results = await Promise.all(
    ids.map((id: number, index: number) =>
      supabaseAdmin.from('chapters').update({ order_index: index }).eq('id', id)
    )
  )
  const failed = results.find(r => r.error)
  if (failed?.error) {
    console.error('Chapter reorder failed:', failed.error)
    return NextResponse.json({ message: friendlyDbError(failed.error, 'Could not save the new order.') }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
