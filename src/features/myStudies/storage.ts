import { isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'
import { createEmptyMyStudies, type MyStudies, type StudiedSet } from './myStudies.ts'

export const MY_STUDIES_STORAGE_KEY = 'hanzivocab.studies'
/** Version of the saved format, same as in progress/storage.ts. */
const CURRENT_VERSION = 1

export function saveMyStudies(myStudies: MyStudies, storage?: KeyValueStorage): boolean {
  return writeJson(MY_STUDIES_STORAGE_KEY, { version: CURRENT_VERSION, ...myStudies }, storage)
}

/** Loads the user's sets. Anything without the expected format is discarded. */
export function loadMyStudies(storage?: KeyValueStorage): MyStudies {
  const saved = readJson(MY_STUDIES_STORAGE_KEY, storage)
  if (!isRecord(saved) || saved.version !== CURRENT_VERSION) return createEmptyMyStudies()

  const sets = Array.isArray(saved.sets) ? saved.sets.filter(isStudiedSet) : []
  const lastStudied: Record<string, string> = {}
  if (isRecord(saved.lastStudied)) {
    for (const [setId, date] of Object.entries(saved.lastStudied)) {
      if (typeof date === 'string') lastStudied[setId] = date
    }
  }
  // No duplicates, in case the saved data was edited by hand
  const unique = sets.filter((set, index) => sets.findIndex((other) => other.setId === set.setId) === index)
  return { sets: unique, lastStudied }
}

function isStudiedSet(value: unknown): value is StudiedSet {
  return isRecord(value) && typeof value.setId === 'string' && typeof value.addedAt === 'string'
}
