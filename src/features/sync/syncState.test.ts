import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { loadSyncState, markSyncDirty, planSync, saveSyncState } from './syncState.ts'

const state = { userId: 'user-1', syncedAt: 'T1', dirty: false }

describe('planSync', () => {
  it('uploads local data if the cloud has no copy yet', () => {
    expect(planSync(null, 'user-1', null)).toBe('push')
  })

  it('merges the first time this device uses the account', () => {
    expect(planSync(null, 'user-1', 'T1')).toBe('merge')
    expect(planSync({ ...state, userId: 'other' }, 'user-1', 'T1')).toBe('merge')
  })

  it('downloads if another device uploaded and nothing changed here', () => {
    expect(planSync(state, 'user-1', 'T2')).toBe('pull')
  })

  it('merges if both sides changed', () => {
    expect(planSync({ ...state, dirty: true }, 'user-1', 'T2')).toBe('merge')
  })

  it('uploads local changes if the cloud has not changed', () => {
    expect(planSync({ ...state, dirty: true }, 'user-1', 'T1')).toBe('push')
  })

  it('does nothing when everything is up to date', () => {
    expect(planSync(state, 'user-1', 'T1')).toBe('none')
  })
})

describe('saved state', () => {
  it('markSyncDirty marks pending changes only after a first sync', () => {
    const storage = memoryStorage()
    markSyncDirty(storage)
    expect(loadSyncState(storage)).toBeNull()

    saveSyncState(state, storage)
    markSyncDirty(storage)
    expect(loadSyncState(storage)).toEqual({ ...state, dirty: true })
  })
})
