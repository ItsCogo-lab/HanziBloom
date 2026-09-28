import type { ProgressData } from '../progress/types.ts'
import { summarizeItemIds, type ItemsSummary } from '../progress/stats.ts'
import type { StudySet } from './types.ts'

export interface SetProgress extends ItemsSummary {
  /** Proporción dominada (0-1): lo que muestra la barra de progreso del set. */
  ratio: number
}

/**
 * Progreso de un set. No se guarda en ningún sitio: se calcula en cada
 * momento a partir del progreso de cada elemento (el mismo que usa el SRS).
 * Así un elemento que está en varios sets cuenta en todos a la vez y no hay
 * dos datos que puedan contradecirse.
 */
export function getSetProgress(set: StudySet, progress: ProgressData, now: Date): SetProgress {
  const summary = summarizeItemIds(set.itemIds, progress, now)
  return { ...summary, ratio: summary.total > 0 ? summary.mastered / summary.total : 0 }
}
