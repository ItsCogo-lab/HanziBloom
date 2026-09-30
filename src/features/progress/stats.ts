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

/** The items with the most mistakes; on ties, those with the worst accuracy. */
export function getMostMissed(progress: ProgressData, limit = 5): ItemProgress[] {
  const accuracy = (item: ItemProgress) => item.timesCorrect / item.timesSeen
  return Object.values(progress.items)
    .filter((item) => item !== undefined)
    .filter((item) => item.timesWrong > 0)
    .toSorted((a, b) => b.timesWrong - a.timesWrong || accuracy(a) - accuracy(b))
    .slice(0, limit)
}
