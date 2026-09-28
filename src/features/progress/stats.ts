import { getStudyItemId, type StudyItem } from '../dictionary/studyItem.ts'
import { getItemStatus, isDue } from './progress.ts'
import type { ProgressData } from './types.ts'

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
  const summary: ItemsSummary = { total: items.length, new: 0, learning: 0, mastered: 0, studied: 0, due: 0 }
  for (const item of items) {
    const itemProgress = progress.items[getStudyItemId(item)]
    summary[getItemStatus(itemProgress)] += 1
    if (isDue(itemProgress, now)) summary.due += 1
  }
  summary.studied = summary.learning + summary.mastered
  return summary
}
