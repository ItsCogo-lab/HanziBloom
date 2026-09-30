import type { SetSessionType } from './sessionItems.ts'
import type { StudySet } from './types.ts'

/** Path of a set's page. */
export function getSetPath(set: StudySet): string {
  return `/study/sets/${encodeURIComponent(set.id)}`
}

/** Path of a Learn or Study session with a set. `reviewAll`: also review what is not due yet. */
export function getSetSessionPath(set: StudySet, type: SetSessionType, { reviewAll = false } = {}): string {
  const path = `/study/practice?set=${encodeURIComponent(set.id)}&mode=${type}`
  return reviewAll ? `${path}&scope=all` : path
}
