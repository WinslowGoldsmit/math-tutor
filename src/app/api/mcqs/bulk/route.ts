import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

function splitBlocks(text: string) {
  return text.split(/\n\s*-{3,}\s*\n?/).map(b => b.trim()).filter(Boolean)
}
function extractField(block: string, key: string) {
  const re = new RegExp('^' + key + '\\s*:\\s*([\\s\\S]*?)(?=\\n[A-Za-z]+\\s*:|\\n[A-D][\\)\\.]|$)', 'im')
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
  const rows: {
    topic_id: string
    question: string
    options: string[]
    correct_index: number
    explanation: string
    image_url: string
  }[] = []
  let skipped = 0

  blocks.forEach((b: string) => {
    const question = extractField(b, 'Q')
    const explanation = extractField(b, 'EXPLAIN')
    const image_url = extractField(b, 'IMAGE')
    const correctLetter = (extractField(b, 'CORRECT') || '').trim().toUpperCase().charAt(0)

    const options: string[] = []
    ;['A', 'B', 'C', 'D'].forEach(L => {
      const re = new RegExp('^' + L + '[\\)\\.]\\s*(.+)$', 'im')
      const m = b.match(re)
      options.push(m ? m[1].trim() : '')
    })

    if (!question || options.some(o => !o) || !correctLetter) {
      skipped++
      return
    }

    const correct_index = 'ABCD'.indexOf(correctLetter)
    rows.push({ topic_id, question, options, correct_index, explanation, image_url })
  })

  if (rows.length) {
    const { error } = await supabaseAdmin.from('mcqs').insert(rows)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ added: rows.length, skipped })
}


