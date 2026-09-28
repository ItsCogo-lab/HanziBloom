import { toDateKey } from '../../lib/dates.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import { isReviewDue, scheduleNextReview } from '../srs/srs.ts'
import type { ItemProgress, ProgressData } from './types.ts'

/**
 * Nivel a partir del cual un elemento se considera dominado: su siguiente
 * repaso está a 14 días o más.
 */
export const MASTERED_LEVEL = 4

export type ItemStatus = 'new' | 'learning' | 'mastered'

export function createEmptyProgress(): ProgressData {
  return { items: {}, activity: {} }
}

/**
 * Registra una respuesta: actualiza los contadores del elemento, programa su
 * siguiente repaso y suma la respuesta a la actividad del día. Devuelve un
 * objeto nuevo sin modificar el anterior (así React detecta el cambio).
 */
export function recordAnswer(progress: ProgressData, itemId: StudyItemId, correct: boolean, now: Date): ProgressData {
  const previous = progress.items[itemId]
  const item: ItemProgress = {
    itemId,
    timesSeen: (previous?.timesSeen ?? 0) + 1,
    timesCorrect: (previous?.timesCorrect ?? 0) + (correct ? 1 : 0),
    timesWrong: (previous?.timesWrong ?? 0) + (correct ? 0 : 1),
    lastReviewedAt: now.toISOString(),
    ...scheduleNextReview(previous?.masteryLevel ?? 0, correct, now),
  }

  const day = toDateKey(now)
  const today = progress.activity[day] ?? { answers: 0, correct: 0 }

  return {
    items: { ...progress.items, [itemId]: item },
    activity: {
      ...progress.activity,
      [day]: { answers: today.answers + 1, correct: today.correct + (correct ? 1 : 0) },
    },
  }
}

export function getItemStatus(item: ItemProgress | undefined): ItemStatus {
  if (!item) return 'new'
  return item.masteryLevel >= MASTERED_LEVEL ? 'mastered' : 'learning'
}

/** ¿Toca repasar este elemento? Los nuevos no cuentan como repaso pendiente. */
export function isDue(item: ItemProgress | undefined, now: Date): boolean {
  return item !== undefined && isReviewDue(item.nextReviewAt, now)
}
