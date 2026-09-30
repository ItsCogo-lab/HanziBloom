/**
 * Qué sabe este dispositivo de la última sincronización, y qué hacer en la
 * siguiente. Se guarda en localStorage junto al resto de datos.
 */
import { getBrowserStorage, isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'

export const SYNC_STATE_STORAGE_KEY = 'hanzivocab.sync'

export interface SyncState {
  /** Cuenta con la que se sincronizó este dispositivo. */
  userId: string
  /**
   * `updated_at` de la copia en la nube la última vez que la subimos o
   * bajamos. Si la nube tiene otro valor, otro dispositivo ha subido cambios.
   * Solo se compara por igualdad, así que no importa si los relojes difieren.
   */
  syncedAt: string
  /** Hay cambios locales que aún no se han subido. */
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
 * - `push`: subir lo local (la nube está vacía o no ha cambiado).
 * - `pull`: bajar la nube (otro dispositivo subió cambios y aquí no hay nada nuevo).
 * - `merge`: los dos lados tienen cambios, o es la primera vez que este
 *   dispositivo usa esta cuenta: se juntan y se sube el resultado.
 * - `none`: todo está al día.
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

/** Apunta que hay cambios sin subir, por si se cierra la app antes de subirlos. */
export function markSyncDirty(storage?: KeyValueStorage): void {
  const state = loadSyncState(storage)
  if (state && !state.dirty) saveSyncState({ ...state, dirty: true }, storage)
}

/** Al cerrar sesión: la próxima cuenta que entre juntará sus datos con los de aquí. */
export function clearSyncState(storage = getBrowserStorage()): void {
  try {
    storage?.removeItem(SYNC_STATE_STORAGE_KEY)
  } catch {
    // Sin almacenamiento no hay nada que borrar
  }
}
