import type { KeyValueStorage } from '../../lib/storage.ts'
import { mergeSnapshots, normalizeSnapshot, readSnapshot, writeSnapshot, type Snapshot } from './snapshot.ts'
import { loadSyncState, planSync, saveSyncState } from './syncState.ts'

/** The cloud copy of the user's data. */
export interface CloudCopy {
  data: Snapshot
  updatedAt: string
}

/** Where the copy is stored. In the app it's Supabase; in tests, an in-memory object. */
export interface CloudStore {
  load: (userId: string) => Promise<CloudCopy | null>
  /** Saves the copy and returns its new `updatedAt`. */
  save: (userId: string, data: Snapshot) => Promise<string>
}

type SyncOptions = {
  cloud: CloudStore
  userId: string
  storage?: KeyValueStorage
  /**
   * How many local changes there have been since the app started. If it
   * changes while waiting on the network, the new data isn't pushed yet.
   */
  changeCount: () => number
}

/**
 * A full sync (see planSync). Returns `true` if it changed the local data,
 * so the app reloads it.
 */
export async function syncUserData({ cloud, userId, storage, changeCount }: SyncOptions): Promise<boolean> {
  const countAtStart = changeCount()
  const remote = await cloud.load(userId)

  const countAfterLoad = changeCount()
  const state = loadSyncState(storage)
  const dirty = (state?.dirty ?? false) || countAfterLoad !== countAtStart
  const action = planSync(state && { ...state, dirty }, userId, remote?.updatedAt ?? null)
  if (action === 'none') return false

  const local = readSnapshot(storage)
  let upload: Snapshot | null = null
  let localChanged = false
  if (action === 'pull' && remote) {
    writeSnapshot(normalizeSnapshot(remote.data), storage)
    localChanged = true
  } else if (action === 'merge' && remote) {
    upload = mergeSnapshots(local, remote.data)
    writeSnapshot(upload, storage)
    localChanged = true
  } else {
    upload = local
  }

  const syncedAt = upload ? await cloud.save(userId, upload) : (remote?.updatedAt ?? '')
  saveSyncState({ userId, syncedAt, dirty: changeCount() !== countAfterLoad }, storage)
  return localChanged
}
