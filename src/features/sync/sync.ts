import type { KeyValueStorage } from '../../lib/storage.ts'
import { mergeSnapshots, normalizeSnapshot, readSnapshot, writeSnapshot, type Snapshot } from './snapshot.ts'
import { loadSyncState, planSync, saveSyncState } from './syncState.ts'

/** La copia de los datos del usuario en la nube. */
export interface CloudCopy {
  data: Snapshot
  updatedAt: string
}

/** Dónde se guarda la copia. En la app es Supabase; en los tests, un objeto en memoria. */
export interface CloudStore {
  load: (userId: string) => Promise<CloudCopy | null>
  /** Guarda la copia y devuelve su nuevo `updatedAt`. */
  save: (userId: string, data: Snapshot) => Promise<string>
}

type SyncOptions = {
  cloud: CloudStore
  userId: string
  storage?: KeyValueStorage
  /**
   * Cuántos cambios locales ha habido desde que arrancó la app. Si cambia
   * mientras se espera a la red, lo nuevo aún no está subido.
   */
  changeCount: () => number
}

/**
 * Una sincronización completa (ver planSync). Devuelve `true` si ha cambiado
 * los datos locales, para que la app los vuelva a cargar.
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
