import type { SetSessionType } from './sessionItems.ts'
import type { StudySet } from './types.ts'

/** Ruta de la página de un set. */
export function getSetPath(set: StudySet): string {
  return `/study/sets/${encodeURIComponent(set.id)}`
}

/** Ruta de una sesión Learn o Study con un set. `reviewAll`: repasar también lo que aún no toca. */
export function getSetSessionPath(set: StudySet, type: SetSessionType, { reviewAll = false } = {}): string {
  const path = `/study/practice?set=${encodeURIComponent(set.id)}&mode=${type}`
  return reviewAll ? `${path}&scope=all` : path
}
