/**
 * Zenko — SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo SM-2 algorithm.
 *
 * Rating mapping:
 *   again = 0, hard = 1, good = 3, easy = 5
 */

export type SM2State = {
  interval_days: number
  ease_factor: number
  review_count: number
}

export type Rating = 'again' | 'hard' | 'good' | 'easy'

const RATING_SCORE: Record<Rating, number> = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 5,
}

const MIN_EASE = 1.3
const DEFAULT_EASE = 2.5

export function sm2(state: SM2State | null, rating: Rating): SM2State & { due_date: string } {
  const score = RATING_SCORE[rating]
  const prev = state ?? { interval_days: 0, ease_factor: DEFAULT_EASE, review_count: 0 }

  let { interval_days, ease_factor, review_count } = prev

  if (score < 3) {
    // Forgotten or too hard — reset to beginning
    interval_days = 1
    review_count = 0
  } else {
    // Successful recall
    if (review_count === 0) {
      interval_days = 1
    } else if (review_count === 1) {
      interval_days = 6
    } else {
      interval_days = Math.round(interval_days * ease_factor)
    }
    review_count += 1
  }

  // Update ease factor
  ease_factor = ease_factor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
  ease_factor = Math.max(MIN_EASE, ease_factor)

  // Cap interval at 365 days
  interval_days = Math.min(Math.max(1, interval_days), 365)

  // Calculate due date
  const due = new Date()
  due.setDate(due.getDate() + interval_days)
  const due_date = due.toISOString().slice(0, 10)

  return { interval_days, ease_factor, review_count, due_date }
}
