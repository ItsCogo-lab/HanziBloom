import { addDays, toDateKey, type DateKey } from '../../lib/dates.ts'
import { getStudyItemId, type StudyItem, type StudyItemId } from '../dictionary/studyItem.ts'
import { getItemStatus, isDue } from './progress.ts'
import type { DailyActivity, ItemProgress, ProgressData } from './types.ts'

export interface ItemsSummary {
  total: number
  /** Never studied. */
  new: number
  learning: number
  mastered: number
  /** Studied at least once (learning + mastered). */
  studied: number
  /** With a review due right now. */
  due: number
}

/** How many items are in each state. */
export function summarizeItems(items: readonly StudyItem[], progress: ProgressData, now: Date): ItemsSummary {
  return summarizeItemIds(items.map(getStudyItemId), progress, now)
}

const STATUS_RANK = { new: 0, learning: 1, mastered: 2 } as const

/**
 * How far along the characters are. Characters are learned through words, so
 * a character counts as far as the furthest word that contains it (学 is
 * mastered once 学习 or 学生 is). Its own card counts too, for characters
 * added to custom sets and progress saved when HSK sets had character cards.
 */
export function summarizeCharacters(
  characters: readonly StudyItem[],
  words: readonly StudyItem[],
  progress: ProgressData,
  now: Date,
): ItemsSummary {
  const wordIdsByHanzi = new Map<string, StudyItemId[]>()
  for (const word of words) {
    for (const hanzi of new Set(Array.from(word.entry.hanzi))) {
      wordIdsByHanzi.set(hanzi, [...(wordIdsByHanzi.get(hanzi) ?? []), getStudyItemId(word)])
    }
  }

  const summary: ItemsSummary = { total: characters.length, new: 0, learning: 0, mastered: 0, studied: 0, due: 0 }
  for (const character of characters) {
    const ownId = getStudyItemId(character)
    const statuses = [ownId, ...(wordIdsByHanzi.get(character.entry.hanzi) ?? [])].map((id) =>
      getItemStatus(progress.items[id]),
    )
    const best = statuses.reduce((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a))
    summary[best] += 1
    // Only the character's own card can be due; its words have their own reviews
    if (isDue(progress.items[ownId], now)) summary.due += 1
  }
  summary.studied = summary.learning + summary.mastered
  return summary
}

/** Same as summarizeItems, from the ids (that's how study sets store them). */
export function summarizeItemIds(itemIds: readonly StudyItemId[], progress: ProgressData, now: Date): ItemsSummary {
  const summary: ItemsSummary = { total: itemIds.length, new: 0, learning: 0, mastered: 0, studied: 0, due: 0 }
  for (const itemId of itemIds) {
    const itemProgress = progress.items[itemId]
    summary[getItemStatus(itemProgress)] += 1
    if (isDue(itemProgress, now)) summary.due += 1
  }
  summary.studied = summary.learning + summary.mastered
  return summary
}

/** How many items are learning and mastered in writing (see ProgressData.writing). */
export function summarizeWriting(progress: ProgressData): { learning: number; mastered: number } {
  const statuses = Object.values(progress.writing).map(getItemStatus)
  return {
    learning: statuses.filter((status) => status === 'learning').length,
    mastered: statuses.filter((status) => status === 'mastered').length,
  }
}

export interface AnswerTotals {
  answers: number
  correct: number
  /** Share of correct answers (0-1), or `undefined` if there are no answers yet. */
  accuracy: number | undefined
}

/** All-time answers and correct answers. */
export function getAnswerTotals(activity: Record<DateKey, DailyActivity>): AnswerTotals {
  let answers = 0
  let correct = 0
  for (const day of Object.values(activity)) {
    answers += day.answers
    correct += day.correct
  }
  return { answers, correct, accuracy: answers > 0 ? correct / answers : undefined }
}

export interface DayActivity extends DailyActivity {
  date: DateKey
}

/** Activity over the last `days` days, from oldest to today; days without study count as 0. */
export function getRecentActivity(activity: Record<DateKey, DailyActivity>, today: Date, days = 7): DayActivity[] {
  return Array.from({ length: days }, (_, index) => {
    const date = toDateKey(addDays(today, index - days + 1))
    return { date, ...(activity[date] ?? { answers: 0, correct: 0 }) }
  })
}

/** Mistakes from which an item can count as difficult (see isDifficult). */
export const DIFFICULT_MIN_MISTAKES = 3

/** Share of correct answers below which an item with enough mistakes is difficult. */
export const DIFFICULT_MAX_ACCURACY = 0.6

/**
 * A difficult item (a "leech" in Anki): missed at least 3 times and right
 * less than 60% of the time. Spaced repetition alone isn't helping with it,
 * so it is worth looking at again on purpose.
 */
export function isDifficult(item: ItemProgress): boolean {
  return item.timesWrong >= DIFFICULT_MIN_MISTAKES && item.timesCorrect / item.timesSeen < DIFFICULT_MAX_ACCURACY
}

/** The difficult items, with the most mistakes first; on ties, those with the worst accuracy. */
export function getDifficultItems(progress: ProgressData): ItemProgress[] {
  const accuracy = (item: ItemProgress) => item.timesCorrect / item.timesSeen
  return Object.values(progress.items)
    .filter((item) => item !== undefined)
    .filter(isDifficult)
    .toSorted((a, b) => b.timesWrong - a.timesWrong || accuracy(a) - accuracy(b))
}
