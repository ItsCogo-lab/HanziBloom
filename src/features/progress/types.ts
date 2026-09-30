import type { DateKey } from '../../lib/dates.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'

/** What is known about a character or word the user has already studied. */
export interface ItemProgress {
  itemId: StudyItemId
  timesSeen: number
  timesCorrect: number
  timesWrong: number
  /** Spaced repetition mastery level (0-5). */
  masteryLevel: number
  /** Dates in ISO 8601 format. */
  lastReviewedAt: string
  nextReviewAt: string
  /**
   * Basic vocabulary for the user's HSK level (see applyHskLevel): it is
   * never due for review. If it is answered wrong in a voluntary review, it
   * loses the flag and returns to normal spaced repetition.
   */
  basic?: true
  /**
   * The record was created by applyHskLevel and has never been answered: if
   * the user lowers their level, it is deleted and the item becomes new again.
   */
  fromLevel?: true
}

/** A day's answers, for the streak and statistics. */
export interface DailyActivity {
  answers: number
  correct: number
}

/**
 * All of the user's progress. Items that don't appear in `items` are new
 * (never studied).
 */
export interface ProgressData {
  items: Partial<Record<StudyItemId, ItemProgress>>
  activity: Record<DateKey, DailyActivity>
}
