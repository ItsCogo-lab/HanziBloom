import { addDays, toDateKey, type DateKey } from '../../lib/dates.ts'
import { getStudyItemId, type StudyItem, type StudyItemId } from '../dictionary/studyItem.ts'
import { getItemStatus, isDue } from './progress.ts'
import type { DailyActivity, ItemProgress, ProgressData } from './types.ts'

export interface ItemsSummary {
  total: number
  /** Nunca estudiados. */
  new: number
  learning: number
  mastered: number
  /** Estudiados al menos una vez (en aprendizaje + dominados). */
  studied: number
  /** Con el repaso pendiente ahora mismo. */
  due: number
}

/** Cuántos elementos hay en cada estado. */
export function summarizeItems(items: readonly StudyItem[], progress: ProgressData, now: Date): ItemsSummary {
  return summarizeItemIds(items.map(getStudyItemId), progress, now)
}

/** Igual que summarizeItems, a partir de los ids (así los guardan los sets de estudio). */
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
  /** Proporción de aciertos (0-1), o `undefined` si aún no hay respuestas. */
  accuracy: number | undefined
}

/** Respuestas y aciertos de toda la historia. */
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

/** Actividad de los últimos `days` días, del más antiguo a hoy; los días sin estudiar valen 0. */
export function getRecentActivity(activity: Record<DateKey, DailyActivity>, today: Date, days = 7): DayActivity[] {
  return Array.from({ length: days }, (_, index) => {
    const date = toDateKey(addDays(today, index - days + 1))
    return { date, ...(activity[date] ?? { answers: 0, correct: 0 }) }
  })
}

/** Los elementos con más fallos; a igualdad de fallos, los de peor porcentaje de acierto. */
export function getMostMissed(progress: ProgressData, limit = 5): ItemProgress[] {
  const accuracy = (item: ItemProgress) => item.timesCorrect / item.timesSeen
  return Object.values(progress.items)
    .filter((item) => item !== undefined)
    .filter((item) => item.timesWrong > 0)
    .toSorted((a, b) => b.timesWrong - a.timesWrong || accuracy(a) - accuracy(b))
    .slice(0, limit)
}
