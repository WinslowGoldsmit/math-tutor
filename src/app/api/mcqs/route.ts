import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'
import { friendlyDbError } from '@/lib/dbErrors'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topic_id')

  const [{ data, error }, { data: topic }] = await Promise.all([
    supabaseAdmin
      .from('mcqs')
      .select('id, question, options, correct_index, explanation, hint, image_url, explanation_image_url')
      .eq('topic_id', topicId),
    supabaseAdmin.from('topics').select('name').eq('id', topicId).maybeSingle(),
  ])

  if (error) {
    console.error('MCQ load failed:', error)
    return NextResponse.json({ message: friendlyDbError(error, 'Could not load problems.') }, { status: 500 })
  }
  return NextResponse.json({ mcqs: data, topic_name: topic?.name ?? '' })
}
