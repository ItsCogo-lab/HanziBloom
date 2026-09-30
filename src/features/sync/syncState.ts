/**
 * What this device knows about the last sync, and what to do on the next one.
 * Stored in localStorage alongside the rest of the data.
 */
import { getBrowserStorage, isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'

export const SYNC_STATE_STORAGE_KEY = 'hanzivocab.sync'

export interface SyncState {
  /** Account this device synced with. */
  userId: string
  /**
   * `updated_at` of the cloud copy the last time we pushed or pulled it. If
   * the cloud has another value, another device has pushed changes. It is
   * only compared for equality, so it doesn't matter if clocks differ.
   */
  syncedAt: string
  /** There are local changes not yet pushed. */
  dirty: boolean
}

export function loadSyncState(storage?: KeyValueStorage): SyncState | null {
  const saved = readJson(SYNC_STATE_STORAGE_KEY, storage)
  if (!isRecord(saved)) return null
  const { userId, syncedAt, dirty } = saved
  if (typeof userId !== 'string' || typeof syncedAt !== 'string' || typeof dirty !== 'boolean') return null
  return { userId, syncedAt, dirty }
}

/**
 * - `push`: upload local data (the cloud is empty or hasn't changed).
 * - `pull`: download the cloud (another device pushed changes and nothing is new here).
 * - `merge`: both sides have changes, or this is the first time this device
 *   uses this account: they are merged and the result is pushed.
 * - `none`: everything is up to date.
 */
export type SyncAction = 'push' | 'pull' | 'merge' | 'none'

export function planSync(state: SyncState | null, userId: string, remoteUpdatedAt: string | null): SyncAction {
  if (remoteUpdatedAt === null) return 'push'
  if (state?.userId !== userId) return 'merge'
  if (remoteUpdatedAt !== state.syncedAt) return state.dirty ? 'merge' : 'pull'
  return state.dirty ? 'push' : 'none'
}

export function saveSyncState(state: SyncState, storage?: KeyValueStorage): void {
  writeJson(SYNC_STATE_STORAGE_KEY, state, storage)
}

/** Records that there are unpushed changes, in case the app is closed before pushing them. */
export function markSyncDirty(storage?: KeyValueStorage): void {
  const state = loadSyncState(storage)
  if (state && !state.dirty) saveSyncState({ ...state, dirty: true }, storage)
}

/** On sign-out: the next account to sign in will merge its data with the data here. */
export function clearSyncState(storage = getBrowserStorage()): void {
  try {
    storage?.removeItem(SYNC_STATE_STORAGE_KEY)
  } catch {
    // Without storage there is nothing to clear
  }
}
