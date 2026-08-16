import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

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
  if (!isTeacher) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
  }

  const { topic_id, text } = await request.json()
  const blocks = splitBlocks(text)
  const rows: { topic_id: string; front: string; back: string; image_url: string }[] = []
  let skipped = 0

  blocks.forEach((b: string) => {
    const front = extractField(b, 'Q')
    const back = extractField(b, 'A')
    const image_url = extractField(b, 'IMAGE')
    if (!front || !back) { skipped++; return }
    rows.push({ topic_id, front, back, image_url })
  })

  if (rows.length) {
    const { error } = await supabaseAdmin.from('flashcards').insert(rows)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ added: rows.length, skipped })
}