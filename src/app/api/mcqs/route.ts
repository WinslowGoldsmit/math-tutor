import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topic_id')

  const { data, error } = await supabaseAdmin
    .from('mcqs')
    .select('id, question, options, correct_index, explanation, image_url')
    .eq('topic_id', topicId)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ mcqs: data })
}
