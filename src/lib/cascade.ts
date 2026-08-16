/**
 * Zenko — safe cascade deletes.
 *
 * Foreign keys use "No action" on purpose, so Postgres blocks any delete that
 * would orphan rows. That is the right default, but it means the API has to
 * clear children itself — in the right order — when the teacher confirms.
 *
 * Every helper here returns a count first (so the teacher can be warned),
 * and only deletes when explicitly told to.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function countRows(table: string, column: string, value: string | number | (string | number)[]) {
  const query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
  const { count } = Array.isArray(value)
    ? await query.in(column, value)
    : await query.eq(column, value)
  return count ?? 0
}

/** What would be removed if this flashcard were deleted. */
export async function countFlashcardChildren(flashcardId: string | number) {
  const [reviews, schedules] = await Promise.all([
    countRows('reviews', 'flashcard_id', flashcardId),
    countRows('flashcard_schedule', 'flashcard_id', flashcardId),
  ])
  return { reviews, schedules, total: reviews + schedules }
}

/** Remove a flashcard's student history, then the card itself. */
export async function deleteFlashcardDeep(flashcardId: string | number) {
  await supabaseAdmin.from('reviews').delete().eq('flashcard_id', flashcardId)
  await supabaseAdmin.from('flashcard_schedule').delete().eq('flashcard_id', flashcardId)
  return supabaseAdmin.from('flashcards').delete().eq('id', flashcardId)
}

/** What would be removed if this MCQ were deleted. */
export async function countMcqChildren(mcqId: string | number) {
  const attempts = await countRows('attempts', 'mcq_id', mcqId)
  return { attempts, total: attempts }
}

/** Remove an MCQ's attempt history, then the question itself. */
export async function deleteMcqDeep(mcqId: string | number) {
  await supabaseAdmin.from('attempts').delete().eq('mcq_id', mcqId)
  return supabaseAdmin.from('mcqs').delete().eq('id', mcqId)
}

/** What would be removed if this topic were deleted. */
export async function countTopicChildren(topicId: string | number) {
  const [{ data: cards }, { data: questions }] = await Promise.all([
    supabaseAdmin.from('flashcards').select('id').eq('topic_id', topicId),
    supabaseAdmin.from('mcqs').select('id').eq('topic_id', topicId),
  ])
  const cardIds = (cards ?? []).map(c => c.id)
  const mcqIds = (questions ?? []).map(m => m.id)

  const [reviews, schedules, attempts, access, badges] = await Promise.all([
    cardIds.length ? countRows('reviews', 'flashcard_id', cardIds) : 0,
    cardIds.length ? countRows('flashcard_schedule', 'flashcard_id', cardIds) : 0,
    mcqIds.length ? countRows('attempts', 'mcq_id', mcqIds) : 0,
    countRows('access', 'topic_id', topicId),
    countRows('badges', 'topic_id', topicId),
  ])

  return {
    flashcards: cardIds.length,
    mcqs: mcqIds.length,
    reviews,
    schedules,
    attempts,
    access,
    badges,
    cardIds,
    mcqIds,
    total: cardIds.length + mcqIds.length + reviews + schedules + attempts + access + badges,
  }
}

/**
 * Delete a topic and everything beneath it, deepest first:
 * reviews/schedules/attempts -> flashcards/mcqs -> access/badges -> topic.
 */
export async function deleteTopicDeep(topicId: string | number) {
  const children = await countTopicChildren(topicId)

  if (children.cardIds.length) {
    await supabaseAdmin.from('reviews').delete().in('flashcard_id', children.cardIds)
    await supabaseAdmin.from('flashcard_schedule').delete().in('flashcard_id', children.cardIds)
  }
  if (children.mcqIds.length) {
    await supabaseAdmin.from('attempts').delete().in('mcq_id', children.mcqIds)
  }

  await supabaseAdmin.from('flashcards').delete().eq('topic_id', topicId)
  await supabaseAdmin.from('mcqs').delete().eq('topic_id', topicId)
  await supabaseAdmin.from('access').delete().eq('topic_id', topicId)
  await supabaseAdmin.from('badges').delete().eq('topic_id', topicId)

  return supabaseAdmin.from('topics').delete().eq('id', topicId)
}

/** What would be removed if this chapter were deleted. */
export async function countChapterChildren(chapterId: string | number) {
  const { data: topics } = await supabaseAdmin.from('topics').select('id').eq('chapter_id', chapterId)
  const topicIds = (topics ?? []).map(t => t.id)

  let flashcards = 0
  let mcqs = 0
  for (const topicId of topicIds) {
    const c = await countTopicChildren(topicId)
    flashcards += c.flashcards
    mcqs += c.mcqs
  }

  return { topics: topicIds.length, flashcards, mcqs, topicIds, total: topicIds.length + flashcards + mcqs }
}

/** Delete a chapter, every topic in it, and everything beneath those topics. */
export async function deleteChapterDeep(chapterId: string | number) {
  const { topicIds } = await countChapterChildren(chapterId)
  for (const topicId of topicIds) {
    await deleteTopicDeep(topicId)
  }
  return supabaseAdmin.from('chapters').delete().eq('id', chapterId)
}

/** Every table that references a student — must all be cleared before delete. */
export async function deleteStudentDeep(studentId: string | number) {
  const tables = [
    'access',
    'reviews',
    'attempts',
    'streaks',
    'badges',
    'student_profile',
    'flashcard_schedule',
    'student_messages', // was missing before — caused FK violations on delete
  ]
  for (const table of tables) {
    await supabaseAdmin.from(table).delete().eq('student_id', studentId)
  }
  return supabaseAdmin.from('students').delete().eq('id', studentId)
}
