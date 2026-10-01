import { shuffle, type RandomFn } from '../../lib/random.ts'
import { getStudyItemId, type StudyItem } from '../dictionary/studyItem.ts'
import { isDue } from '../progress/progress.ts'
import type { ProgressData } from '../progress/types.ts'
import { getMeaningLabel } from './choiceExercises.ts'

/** Longer words (chengyu, names) are not asked in writing. */
export const MAX_WRITING_LENGTH = 4

/**
 * Recognition level from which an item can be written: you first learn to
 * read it (level 1 = answered right once). With the review intervals, a new
 * word is written from the day after it is first answered right.
 */
export const WRITING_MIN_LEVEL = 1

/** Misses on one stroke after which Hanzi Writer shows it as a hint. */
export const AUTO_HINT_AFTER_MISSES = 3

const HAN_ONLY = /^\p{Script=Han}+$/u

/**
 * Can this item be asked in writing? Only hanzi, at most 4 of them, with a
 * meaning to use as the prompt, and already known well enough to read.
 */
export function canWrite(item: StudyItem, progress: ProgressData): boolean {
  const { hanzi } = item.entry
  const recognition = progress.items[getStudyItemId(item)]
  return (
    HAN_ONLY.test(hanzi) &&
    Array.from(hanzi).length <= MAX_WRITING_LENGTH &&
    getMeaningLabel(item) !== '' &&
    (recognition?.masteryLevel ?? 0) >= WRITING_MIN_LEVEL
  )
}

/**
 * Is it time to write this item? When it can be written and it has never
 * been written, or its writing review is due. Writing has its own spaced
 * repetition (ProgressData.writing).
 */
export function isWritingDue(item: StudyItem, progress: ProgressData, now: Date): boolean {
  if (!canWrite(item, progress)) return false
  const writing = progress.writing[getStudyItemId(item)]
  return writing === undefined || isDue(writing, now)
}

/**
 * The items of a writing-only session (Practice writing): only items that
 * can be written, those whose writing is due first (the ones studied by the
 * user before the ones only marked known by their HSK level), then the rest,
 * the earliest writing review first.
 */
export function selectWritingItems(
  pool: readonly StudyItem[],
  progress: ProgressData,
  now: Date,
  size: number,
  random: RandomFn = Math.random,
): StudyItem[] {
  const rank = (item: StudyItem) => {
    if (!isWritingDue(item, progress, now)) return 2
    return progress.items[getStudyItemId(item)]?.fromLevel ? 1 : 0
  }
  // Never written sorts first: '' comes before any date
  const nextWriting = (item: StudyItem) => progress.writing[getStudyItemId(item)]?.nextReviewAt ?? ''
  const selected = shuffle(pool, random)
    .filter((item) => canWrite(item, progress))
    .sort((a, b) => rank(a) - rank(b) || nextWriting(a).localeCompare(nextWriting(b)))
    .slice(0, size)
  return shuffle(selected, random)
}

/** The help the user needed while writing. */
export interface WritingHelp {
  /** Pressed "Hint". */
  hintUsed: boolean
  /** Pressed "Show me": the character was drawn for them. */
  revealed: boolean
  /** Most misses on a single stroke, in any of the characters. */
  maxMissesOnStroke: number
}

export const NO_HELP: WritingHelp = { hintUsed: false, revealed: false, maxMissesOnStroke: 0 }

/**
 * Correct if written without help: no hint, no "Show me", and no stroke
 * missed so many times that Hanzi Writer showed it. One or two misses on a
 * stroke are fine: drawing with a finger, a stroke is sometimes not recognized.
 */
export function gradeWriting(help: WritingHelp): boolean {
  return !help.hintUsed && !help.revealed && help.maxMissesOnStroke < AUTO_HINT_AFTER_MISSES
}
