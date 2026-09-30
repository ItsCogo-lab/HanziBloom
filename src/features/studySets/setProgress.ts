import type { ProgressData } from '../progress/types.ts'
import { summarizeItemIds, type ItemsSummary } from '../progress/stats.ts'
import type { StudySet } from './types.ts'

export interface SetProgress extends ItemsSummary {
  /** Mastered ratio (0-1): what the set's progress bar shows. */
  ratio: number
}

/**
 * Progress of a set. It is not stored anywhere: it is computed on the fly
 * from each item's progress (the same one the SRS uses). This way an item
 * that is in several sets counts in all of them at once and there are no
 * two pieces of data that could contradict each other.
 */
export function getSetProgress(set: StudySet, progress: ProgressData, now: Date): SetProgress {
  const summary = summarizeItemIds(set.itemIds, progress, now)
  return { ...summary, ratio: summary.total > 0 ? summary.mastered / summary.total : 0 }
}
