import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { friendlyDbError } from '@/lib/dbErrors'

function splitBlocks(text: string) {
  return text.split(/\n\s*-{3,}\s*\n?/).map(b => b.trim()).filter(Boolean)
}

function extractField(block: string, key: string) {
  const re = new RegExp('^' + key + '\\s*:\\s*([\\s\\S]*?)(?=\\n[A-Za-z]+\\s*:\\s|$)', 'im')
  const m = block.match(re)
  return m ? m[1].trim() : ''
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isTeacher = cookieStore.get('is_teacher')?.value
  if (!isTeacher) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })

  const { topic_id, text } = await request.json()
  const blocks = splitBlocks(text ?? '')
  const rows: Record<string, unknown>[] = []
  let skipped = 0

  blocks.forEach((b: string) => {
    const front = extractField(b, 'Q')
    const back = extractField(b, 'A')
    // IMAGE = question image, AIMAGE = answer image
    const image_url = extractField(b, 'IMAGE')
    const answer_image_url = extractField(b, 'AIMAGE')
    if (!front || !back) { skipped++; return }
    rows.push({
      topic_id,
      front,
      back,
      image_url: image_url || null,
      answer_image_url: answer_image_url || null,
    })
  })

  if (rows.length) {
    const { error } = await supabaseAdmin.from('flashcards').insert(rows)
    if (error) {
      console.error('Flashcard bulk insert failed:', error)
      return NextResponse.json({ message: friendlyDbError(error, 'Could not add these cards.') }, { status: 500 })
    }
  }

  return NextResponse.json({ added: rows.length, skipped })
}
