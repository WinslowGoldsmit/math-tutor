/**
 * Zenko — SM-2 Spaced Repetition Algorithm (Anki-style)
 *
 * Key differences from the old version:
 *
 * 1. LEARNING STEPS — new and failed cards go through short same-day
 *    intervals (1 min → 10 min) before graduating to days. This is exactly
 *    what Anki does and is the biggest feel difference.
 *
 * 2. RELEARNING — "Not yet" on a graduated card puts it back into learning
 *    steps, not just tomorrow. Student sees it again in the same session.
 *
 * 3. GRADUATION — only after passing all learning steps does a card enter
 *    the spaced schedule (starting at 1 day, then 4 days, then SM-2 formula).
 *
 * Card states:
 *   'new'        — never seen
 *   'learning'   — in same-day learning steps
 *   'review'     — graduated, on spaced schedule
 *   'relearning' — failed a review card, back in steps
 */

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export const RATING_SCORE: Record<Rating, number> = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 5,
}

export type CardState = 'new' | 'learning' | 'review' | 'relearning'

export type SM2State = {
  interval_days: number
  ease_factor: number
  review_count: number
  card_state?: CardState
  learning_step?: number   // which step we are on (0, 1, ...)
}

// Learning steps in MINUTES — same as Anki default (1 min, 10 min)
const LEARNING_STEPS_MINUTES = [1, 10]
// After passing all steps, first review interval in days
const GRADUATING_INTERVAL = 1
// "Easy" skips steps entirely and goes straight to this interval
const EASY_INTERVAL = 4

const MIN_EASE = 1.3
const DEFAULT_EASE = 2.5

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function minutesFromNow(minutes: number): string {
  // Store sub-day due times as today's date — the flashcard API will
  // treat any due_date <= today as due, so the student sees it again
  // this session (within the same day).
  return new Date().toISOString().slice(0, 10)
}

export function sm2(
  state: SM2State | null,
  rating: Rating
): SM2State & { due_date: string } {

  const score = RATING_SCORE[rating]

  // Brand new card
  if (!state || !state.card_state || state.card_state === 'new') {
    if (rating === 'easy') {
      return {
        interval_days: EASY_INTERVAL,
        ease_factor: DEFAULT_EASE + 0.15,
        review_count: 1,
        card_state: 'review',
        learning_step: 0,
        due_date: daysFromNow(EASY_INTERVAL),
      }
    }
    if (rating === 'again') {
      return {
        interval_days: 0,
        ease_factor: DEFAULT_EASE,
        review_count: 0,
        card_state: 'learning',
        learning_step: 0,
        due_date: minutesFromNow(LEARNING_STEPS_MINUTES[0]),
      }
    }
    // hard or good — start at step 0
    return {
      interval_days: 0,
      ease_factor: DEFAULT_EASE,
      review_count: 0,
      card_state: 'learning',
      learning_step: 0,
      due_date: minutesFromNow(LEARNING_STEPS_MINUTES[0]),
    }
  }

  // Card is in learning or relearning steps
  if (state.card_state === 'learning' || state.card_state === 'relearning') {
    const currentStep = state.learning_step ?? 0

    if (rating === 'again') {
      // Reset to first step
      return {
        ...state,
        review_count: state.review_count,
        card_state: state.card_state,
        learning_step: 0,
        due_date: minutesFromNow(LEARNING_STEPS_MINUTES[0]),
      }
    }

    if (rating === 'easy') {
      // Graduate immediately
      const interval = state.card_state === 'relearning' ? 1 : EASY_INTERVAL
      return {
        interval_days: interval,
        ease_factor: Math.min(state.ease_factor + 0.15, 3.5),
        review_count: state.review_count + 1,
        card_state: 'review',
        learning_step: 0,
        due_date: daysFromNow(interval),
      }
    }

    // hard or good — advance to next step
    const nextStep = currentStep + 1
    if (nextStep >= LEARNING_STEPS_MINUTES.length) {
      // Graduated! Enter review schedule
      return {
        interval_days: GRADUATING_INTERVAL,
        ease_factor: state.ease_factor,
        review_count: state.review_count + 1,
        card_state: 'review',
        learning_step: 0,
        due_date: daysFromNow(GRADUATING_INTERVAL),
      }
    }

    return {
      ...state,
      card_state: state.card_state,
      learning_step: nextStep,
      due_date: minutesFromNow(LEARNING_STEPS_MINUTES[nextStep]),
    }
  }

  // Card is in review (graduated)
  let { interval_days, ease_factor, review_count } = state

  if (rating === 'again') {
    // Failed — send back to relearning
    return {
      interval_days: 0,
      ease_factor: Math.max(MIN_EASE, ease_factor - 0.2),
      review_count,
      card_state: 'relearning',
      learning_step: 0,
      due_date: minutesFromNow(LEARNING_STEPS_MINUTES[0]),
    }
  }

  // Successful review — apply SM-2 formula
  if (review_count === 0) {
    interval_days = GRADUATING_INTERVAL
  } else if (review_count === 1) {
    interval_days = 4
  } else {
    if (rating === 'hard') {
      interval_days = Math.round(interval_days * 1.2)
      ease_factor = Math.max(MIN_EASE, ease_factor - 0.15)
    } else if (rating === 'good') {
      interval_days = Math.round(interval_days * ease_factor)
    } else if (rating === 'easy') {
      interval_days = Math.round(interval_days * ease_factor * 1.3)
      ease_factor = Math.min(ease_factor + 0.15, 3.5)
    }
  }

  interval_days = Math.min(Math.max(1, interval_days), 365)
  review_count += 1

  return {
    interval_days,
    ease_factor,
    review_count,
    card_state: 'review',
    learning_step: 0,
    due_date: daysFromNow(interval_days),
  }
}
