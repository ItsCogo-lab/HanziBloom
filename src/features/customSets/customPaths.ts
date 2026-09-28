import { getEntryPath } from '../dictionary/entryPaths.ts'
import type { StudyItem } from '../dictionary/studyItem.ts'
import type { StudySet } from '../studySets/types.ts'

/** La ficha normal del diccionario, abierta desde un set propio: muestra también sus notas. */
export function getCustomEntryPath(item: StudyItem, set: StudySet): string {
  return `${getEntryPath(item)}?set=${encodeURIComponent(set.id)}`
}
