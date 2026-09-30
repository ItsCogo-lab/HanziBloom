import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { HskLevel } from '../dictionary/types.ts'

/**
 * Where a set comes from:
 * - `hsk`: an HSK level, computed from the dataset.
 * - `topic`: a topic (food, family...), from a hand-curated list (src/data/topics.ts).
 * - `custom`: created by the user (features/customSets).
 */
export type StudySetType = 'hsk' | 'topic' | 'custom'

/**
 * A collection of items to study. All set types share this model, so the UI,
 * progress and sessions work the same with any of them.
 *
 * A set does not copy the words: it stores their ids. The same word can be in
 * several sets (苹果 in HSK 1 and in "Food") and it has a single progress.
 */
export interface StudySet {
  /** Unique among all sets: "hsk-1", "topic-food", "custom-..." */
  id: string
  type: StudySetType
  name: string
  description: string
  /** Only in HSK sets. */
  level?: HskLevel
  /** A decorative character used as an icon (not read by screen readers). */
  icon?: string
  /** Characters and words of the set, in study order. */
  itemIds: readonly StudyItemId[]
}
