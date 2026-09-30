import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { loadSyncState, markSyncDirty, planSync, saveSyncState } from './syncState.ts'

const state = { userId: 'user-1', syncedAt: 'T1', dirty: false }

describe('planSync', () => {
  it('sube lo local si la nube aún no tiene copia', () => {
    expect(planSync(null, 'user-1', null)).toBe('push')
  })

  it('junta los datos la primera vez que este dispositivo usa la cuenta', () => {
    expect(planSync(null, 'user-1', 'T1')).toBe('merge')
    expect(planSync({ ...state, userId: 'other' }, 'user-1', 'T1')).toBe('merge')
  })

  it('baja la nube si otro dispositivo subió cambios y aquí no hay nada nuevo', () => {
    expect(planSync(state, 'user-1', 'T2')).toBe('pull')
  })

  it('junta los datos si los dos lados han cambiado', () => {
    expect(planSync({ ...state, dirty: true }, 'user-1', 'T2')).toBe('merge')
  })

  it('sube los cambios locales si la nube no ha cambiado', () => {
    expect(planSync({ ...state, dirty: true }, 'user-1', 'T1')).toBe('push')
  })

  it('no hace nada si todo está al día', () => {
    expect(planSync(state, 'user-1', 'T1')).toBe('none')
  })
})

describe('estado guardado', () => {
  it('markSyncDirty marca cambios pendientes solo si ya se había sincronizado', () => {
    const storage = memoryStorage()
    markSyncDirty(storage)
    expect(loadSyncState(storage)).toBeNull()

    saveSyncState(state, storage)
    markSyncDirty(storage)
    expect(loadSyncState(storage)).toEqual({ ...state, dirty: true })
  })
})
