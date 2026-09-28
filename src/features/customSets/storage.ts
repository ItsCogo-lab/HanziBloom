import { isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { CustomSet } from './types.ts'

const STORAGE_KEY = 'hanzivocab.customSets'
/** Versión del formato guardado, igual que en progress/storage.ts. */
const CURRENT_VERSION = 1

export function saveCustomSets(sets: readonly CustomSet[], storage?: KeyValueStorage): boolean {
  return writeJson(STORAGE_KEY, { version: CURRENT_VERSION, sets }, storage)
}

/**
 * Carga los sets del usuario. Un set con formato incorrecto se descarta y,
 * dentro de un set, lo que no tenga forma válida se ignora: un dato roto no
 * debe romper la interfaz.
 */
export function loadCustomSets(storage?: KeyValueStorage): CustomSet[] {
  const saved = readJson(STORAGE_KEY, storage)
  if (!isRecord(saved) || saved.version !== CURRENT_VERSION || !Array.isArray(saved.sets)) return []

  const sets: CustomSet[] = []
  for (const value of saved.sets) {
    const set = parseCustomSet(value)
    if (set && !sets.some((other) => other.id === set.id)) sets.push(set)
  }
  return sets
}

function parseCustomSet(value: unknown): CustomSet | undefined {
  if (!isRecord(value)) return undefined
  const { id, name, description, itemIds, createdAt, updatedAt } = value
  if (typeof id !== 'string' || !id.startsWith('custom-') || typeof name !== 'string' || name.trim() === '') {
    return undefined
  }
  if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') return undefined
  return {
    id,
    name,
    description: typeof description === 'string' ? description : '',
    itemIds: Array.isArray(itemIds) ? [...new Set(itemIds.filter(isStudyItemId))] : [],
    createdAt,
    updatedAt,
  }
}

export function isStudyItemId(value: unknown): value is StudyItemId {
  return typeof value === 'string' && (value.startsWith('char:') || value.startsWith('word:')) && value.length > 5
}
