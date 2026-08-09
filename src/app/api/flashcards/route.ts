import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topic_id')

  const { data, error } = await supabase
    .from('flashcards')
    .select('id, front, back, image_url')
    .eq('topic_id', topicId)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
  return NextResponse.json({ flashcards: data })
}
