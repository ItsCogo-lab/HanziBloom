import type { StudyItem } from './studyItem.ts'

/** Path to a character's or word's entry page. */
export function getEntryPath(item: StudyItem): string {
  const section = item.kind === 'character' ? 'characters' : 'vocabulary'
  return `/${section}/${encodeURIComponent(item.entry.id)}`
}
