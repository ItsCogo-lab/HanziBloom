import { isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'
import { createEmptyMyStudies, type MyStudies, type StudiedSet } from './myStudies.ts'

const STORAGE_KEY = 'hanzivocab.studies'
/** Versión del formato guardado, igual que en progress/storage.ts. */
const CURRENT_VERSION = 1

export function saveMyStudies(myStudies: MyStudies, storage?: KeyValueStorage): boolean {
  return writeJson(STORAGE_KEY, { version: CURRENT_VERSION, ...myStudies }, storage)
}

/** Carga los sets del usuario. Lo que no tenga el formato esperado se descarta. */
export function loadMyStudies(storage?: KeyValueStorage): MyStudies {
  const saved = readJson(STORAGE_KEY, storage)
  if (!isRecord(saved) || saved.version !== CURRENT_VERSION) return createEmptyMyStudies()

  const sets = Array.isArray(saved.sets) ? saved.sets.filter(isStudiedSet) : []
  const lastStudied: Record<string, string> = {}
  if (isRecord(saved.lastStudied)) {
    for (const [setId, date] of Object.entries(saved.lastStudied)) {
      if (typeof date === 'string') lastStudied[setId] = date
    }
  }
  // Sin repetidos, por si lo guardado se editó a mano
  const unique = sets.filter((set, index) => sets.findIndex((other) => other.setId === set.setId) === index)
  return { sets: unique, lastStudied }
}

function isStudiedSet(value: unknown): value is StudiedSet {
  return isRecord(value) && typeof value.setId === 'string' && typeof value.addedAt === 'string'
}
