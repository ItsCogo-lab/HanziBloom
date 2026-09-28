import type { StudySet } from './types.ts'

/** Ruta de la página de un set. */
export function getSetPath(set: StudySet): string {
  return `/study/sets/${encodeURIComponent(set.id)}`
}

/** Ruta para empezar una sesión con un set. */
export function getSetPracticePath(set: StudySet): string {
  return `/study/practice?set=${encodeURIComponent(set.id)}`
}
