/**
 * "My Studies": the sets the user is studying and when they last studied
 * each set. It is the user's local profile (there are no accounts).
 *
 * There is NO progress here: each set's progress is computed from its items'
 * progress (studySets/setProgress.ts). This only stores which sets were chosen.
 */
export interface StudiedSet {
  setId: string
  /** ISO date when it was added. */
  addedAt: string
}

export interface MyStudies {
  /** Added sets, in the order they were added. */
  sets: StudiedSet[]
  /**
   * Last session for each set (ISO date). Includes sets not in the list:
   * a set can also be studied without adding it.
   */
  lastStudied: Record<string, string>
}

export function createEmptyMyStudies(): MyStudies {
  return { sets: [], lastStudied: {} }
}

export function isStudying(myStudies: MyStudies, setId: string): boolean {
  return myStudies.sets.some((set) => set.setId === setId)
}

/** Adds a set. If it was already there, nothing changes (no duplicates). */
export function addSet(myStudies: MyStudies, setId: string, now: Date): MyStudies {
  if (isStudying(myStudies, setId)) return myStudies
  return { ...myStudies, sets: [...myStudies.sets, { setId, addedAt: now.toISOString() }] }
}

/** Removes a set from the list. Its items' progress is left alone. */
export function removeSet(myStudies: MyStudies, setId: string): MyStudies {
  if (!isStudying(myStudies, setId)) return myStudies
  return { ...myStudies, sets: myStudies.sets.filter((set) => set.setId !== setId) }
}

/** Records that a session was started with this set. */
export function markSetStudied(myStudies: MyStudies, setId: string, now: Date): MyStudies {
  return { ...myStudies, lastStudied: { ...myStudies.lastStudied, [setId]: now.toISOString() } }
}

/** The most recently studied sets, from newest to oldest. */
export function getRecentlyStudied(myStudies: MyStudies, limit = 3): { setId: string; studiedAt: string }[] {
  return Object.entries(myStudies.lastStudied)
    .map(([setId, studiedAt]) => ({ setId, studiedAt }))
    // ISO dates in UTC sort correctly as text
    .toSorted((a, b) => b.studiedAt.localeCompare(a.studiedAt))
    .slice(0, limit)
}
