import { isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'
import { DEFAULT_SESSION_SIZE } from '../practice/session.ts'

/** Tamaños de sesión que se pueden elegir en Ajustes. */
export const SESSION_SIZE_OPTIONS = [5, 10, 20] as const

export type SessionSize = (typeof SESSION_SIZE_OPTIONS)[number]

export interface Settings {
  sessionSize: SessionSize
}

export const DEFAULT_SETTINGS: Settings = { sessionSize: DEFAULT_SESSION_SIZE }

const STORAGE_KEY = 'hanzivocab.settings'
const CURRENT_VERSION = 1

export function saveSettings(settings: Settings, storage?: KeyValueStorage): boolean {
  return writeJson(STORAGE_KEY, { version: CURRENT_VERSION, ...settings }, storage)
}

/** Carga los ajustes; cualquier valor que falte o no sea válido toma su valor por defecto. */
export function loadSettings(storage?: KeyValueStorage): Settings {
  const saved = readJson(STORAGE_KEY, storage)
  if (!isRecord(saved) || saved.version !== CURRENT_VERSION) return DEFAULT_SETTINGS
  return { sessionSize: isSessionSize(saved.sessionSize) ? saved.sessionSize : DEFAULT_SETTINGS.sessionSize }
}

export function isSessionSize(value: unknown): value is SessionSize {
  return SESSION_SIZE_OPTIONS.some((option) => option === value)
}
