import { isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'
import { createEmptyProgress } from './progress.ts'
import type { DailyActivity, ItemProgress, ProgressData } from './types.ts'

export const PROGRESS_STORAGE_KEY = 'hanzivocab.progress'

/**
 * Versión del formato guardado. Si algún día cambia la forma de los datos, se
 * sube este número y se añade aquí la conversión desde la versión anterior.
 */
const CURRENT_VERSION = 1

type SavedProgress = ProgressData & { version: typeof CURRENT_VERSION }

export function saveProgress(progress: ProgressData, storage?: KeyValueStorage): boolean {
  const saved: SavedProgress = { version: CURRENT_VERSION, ...progress }
  return writeJson(PROGRESS_STORAGE_KEY, saved, storage)
}

/**
 * Carga el progreso guardado. Si no hay nada, o lo guardado no tiene el
 * formato esperado, empieza de cero en lugar de romper la app. Las entradas
 * sueltas que estén mal se descartan y el resto se conserva.
 */
export function loadProgress(storage?: KeyValueStorage): ProgressData {
  const saved = readJson(PROGRESS_STORAGE_KEY, storage)
  if (!isRecord(saved) || saved.version !== CURRENT_VERSION) return createEmptyProgress()
  if (!isRecord(saved.items) || !isRecord(saved.activity)) return createEmptyProgress()

  return {
    items: keepValid(saved.items, isItemProgress),
    activity: keepValid(saved.activity, isDailyActivity),
  }
}

/** Copia del objeto solo con los valores que pasan la comprobación. */
function keepValid<T>(record: Record<string, unknown>, isValid: (value: unknown) => value is T): Record<string, T> {
  const result: Record<string, T> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isValid(value)) result[key] = value
  }
  return result
}

function isItemProgress(value: unknown): value is ItemProgress {
  return (
    isRecord(value) &&
    typeof value.itemId === 'string' &&
    ['timesSeen', 'timesCorrect', 'timesWrong', 'masteryLevel'].every((key) => typeof value[key] === 'number') &&
    typeof value.lastReviewedAt === 'string' &&
    typeof value.nextReviewAt === 'string'
  )
}

function isDailyActivity(value: unknown): value is DailyActivity {
  return isRecord(value) && typeof value.answers === 'number' && typeof value.correct === 'number'
}
