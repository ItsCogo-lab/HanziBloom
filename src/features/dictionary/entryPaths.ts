import type { StudyItem } from './studyItem.ts'

/** Ruta de la ficha de un carácter o de una palabra. */
export function getEntryPath(item: StudyItem): string {
  const section = item.kind === 'character' ? 'characters' : 'vocabulary'
  return `/${section}/${encodeURIComponent(item.entry.id)}`
}
