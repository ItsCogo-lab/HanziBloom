import { getEntryPath } from '../dictionary/entryPaths.ts'
import type { StudyItem } from '../dictionary/studyItem.ts'
import type { StudySet } from '../studySets/types.ts'

/** The regular dictionary entry page, opened from a custom set: also shows its notes. */
export function getCustomEntryPath(item: StudyItem, set: StudySet): string {
  return `${getEntryPath(item)}?set=${encodeURIComponent(set.id)}`
}
