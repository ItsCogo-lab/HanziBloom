/**
 * Copy of the user's synced data: exactly what is stored in localStorage
 * (parsed JSON), including its version number. The cloud keeps the same
 * format as the browser, and after a download the Providers load and
 * validate it as usual.
 */
import { createMemoryStorage, isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'
import { CUSTOM_SETS_STORAGE_KEY, loadCustomSets, saveCustomSets } from '../customSets/storage.ts'
import { MY_STUDIES_STORAGE_KEY, loadMyStudies, saveMyStudies } from '../myStudies/storage.ts'
import { PROGRESS_STORAGE_KEY, loadProgress, saveProgress } from '../progress/storage.ts'
import { loadSettings, saveSettings, SETTINGS_STORAGE_KEY } from '../settings/settings.ts'
import { mergeCustomSets, mergeMyStudies, mergeProgress } from './merge.ts'

/** What gets synced. Device-only data (the install prompt) does not. */
export const SYNCED_KEYS = [
  PROGRESS_STORAGE_KEY,
  MY_STUDIES_STORAGE_KEY,
  CUSTOM_SETS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
] as const

export type SyncedKey = (typeof SYNCED_KEYS)[number]

export type Snapshot = Partial<Record<SyncedKey, unknown>>

export function isSyncedKey(key: string): key is SyncedKey {
  return (SYNCED_KEYS as readonly string[]).includes(key)
}

export function readSnapshot(storage?: KeyValueStorage): Snapshot {
  const snapshot: Snapshot = {}
  for (const key of SYNCED_KEYS) {
    const value = readJson(key, storage)
    if (value !== undefined) snapshot[key] = value
  }
  return snapshot
}

/** Writes what the copy contains and leaves everything else as it was. */
export function writeSnapshot(snapshot: Snapshot, storage?: KeyValueStorage): void {
  for (const key of SYNCED_KEYS) {
    if (key in snapshot) writeJson(key, snapshot[key], storage)
  }
}

/** Turns what comes from the cloud into a copy, dropping anything that isn't app data. */
export function parseSnapshot(value: unknown): Snapshot {
  if (!isRecord(value)) return {}
  const snapshot: Snapshot = {}
  for (const key of SYNCED_KEYS) {
    if (key in value) snapshot[key] = value[key]
  }
  return snapshot
}

/**
 * Combines two copies (see merge.ts). Settings are not combined: the current
 * device's settings win, or the cloud's if this device has none.
 */
export function mergeSnapshots(local: Snapshot, remote: Snapshot): Snapshot {
  const localData = toStorage(local)
  const remoteData = toStorage(remote)
  const merged = createMemoryStorage()

  saveProgress(mergeProgress(loadProgress(localData), loadProgress(remoteData)), merged)
  saveMyStudies(mergeMyStudies(loadMyStudies(localData), loadMyStudies(remoteData)), merged)
  saveCustomSets(mergeCustomSets(loadCustomSets(localData), loadCustomSets(remoteData)), merged)
  saveSettings(loadSettings(SETTINGS_STORAGE_KEY in local ? localData : remoteData), merged)

  return readSnapshot(merged)
}

/**
 * The copy exactly as the Providers would save it. Needed after a download:
 * the database (jsonb) reorders keys, so otherwise each Provider's first save
 * would look like a change to upload again.
 */
export function normalizeSnapshot(snapshot: Snapshot): Snapshot {
  const data = toStorage(snapshot)
  const normalized = createMemoryStorage()
  if (PROGRESS_STORAGE_KEY in snapshot) saveProgress(loadProgress(data), normalized)
  if (MY_STUDIES_STORAGE_KEY in snapshot) saveMyStudies(loadMyStudies(data), normalized)
  if (CUSTOM_SETS_STORAGE_KEY in snapshot) saveCustomSets(loadCustomSets(data), normalized)
  if (SETTINGS_STORAGE_KEY in snapshot) saveSettings(loadSettings(data), normalized)
  return readSnapshot(normalized)
}

function toStorage(snapshot: Snapshot): KeyValueStorage {
  const storage = createMemoryStorage()
  writeSnapshot(snapshot, storage)
  return storage
}
