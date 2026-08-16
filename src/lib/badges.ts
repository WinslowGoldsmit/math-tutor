import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const BADGE_INFO: Record<string, { label: string; icon: string; tier: 'bronze' | 'silver' | 'gold' }> = {
  'streak-3':          { label: '3 day streak',       icon: '🔥', tier: 'bronze' },
  'streak-7':          { label: '7 day streak',       icon: '🔥', tier: 'silver' },
  'streak-14':         { label: '14 day streak',      icon: '🔥', tier: 'gold'   },
  'streak-30':         { label: '30 day streak',      icon: '🔥', tier: 'gold'   },
  'flashcards-complete':{ label: 'Topic flashcards done', icon: '★', tier: 'bronze' },
  'mcqs-complete':     { label: 'Topic problems done', icon: '★', tier: 'bronze' },
  'perfect-set':       { label: 'Perfect set',        icon: '◆', tier: 'gold'   },
}

export function badgeLabel(key: string): { label: string; icon: string } {
  if (BADGE_INFO[key]) return BADGE_INFO[key]
  return { label: key, icon: '•' }
}

export function getBadgeTier(key: string): 'bronze' | 'silver' | 'gold' {
  return BADGE_INFO[key]?.tier ?? 'bronze'
}

export async function awardBadgeIfNew(studentId: string | number, badgeKey: string, topicId: number | null = null) {
  let query = supabaseAdmin
    .from('badges').select('id').eq('student_id', studentId).eq('badge_key', badgeKey)
  query = topicId === null ? query.is('topic_id', null) : query.eq('topic_id', topicId)
  const { data: existing } = await query.maybeSingle()
  if (existing) return
  await supabaseAdmin.from('badges').insert({ student_id: studentId, badge_key: badgeKey, topic_id: topicId })
}

export async function checkFlashcardCompletion(studentId: string | number, topicId: number) {
  const { count: total } = await supabaseAdmin
    .from('flashcards').select('*', { count: 'exact', head: true }).eq('topic_id', topicId)
  if (!total) return
  const { data: topicCards } = await supabaseAdmin.from('flashcards').select('id').eq('topic_id', topicId)
  const cardIds = (topicCards ?? []).map(c => c.id)
  if (!cardIds.length) return
  const { data: reviewed } = await supabaseAdmin
    .from('reviews').select('flashcard_id').eq('student_id', studentId).in('flashcard_id', cardIds)
  const distinctReviewed = new Set((reviewed ?? []).map(r => r.flashcard_id))
  if (distinctReviewed.size >= total) await awardBadgeIfNew(studentId, 'flashcards-complete', topicId)
}

export async function checkMcqCompletion(studentId: string | number, topicId: number) {
  const { data: topicMcqs } = await supabaseAdmin.from('mcqs').select('id').eq('topic_id', topicId)
  const mcqIds = (topicMcqs ?? []).map(m => m.id)
  const total = mcqIds.length
  if (!total) return
  const { data: attempts } = await supabaseAdmin
    .from('attempts').select('mcq_id, is_correct').eq('student_id', studentId).in('mcq_id', mcqIds)
  const answered = (attempts ?? []).filter(a => a.is_correct !== null)
  const distinctAnswered = new Set(answered.map(a => a.mcq_id))
  if (distinctAnswered.size >= total) {
    await awardBadgeIfNew(studentId, 'mcqs-complete', topicId)
    const allCorrect = (attempts ?? []).filter(a => a.is_correct !== null).every(a => a.is_correct !== false)
    if (allCorrect) await awardBadgeIfNew(studentId, 'perfect-set', topicId)
  }
}

export async function checkStreakBadges(studentId: string | number, count: number) {
  const milestones = [3, 7, 14, 30]
  if (milestones.includes(count)) await awardBadgeIfNew(studentId, `streak-${count}`, null)
}
