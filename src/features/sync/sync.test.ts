import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { createEmptyProgress, recordAnswer } from '../progress/progress.ts'
import { loadProgress, PROGRESS_STORAGE_KEY, saveProgress } from '../progress/storage.ts'
import { readSnapshot, type Snapshot } from './snapshot.ts'
import { syncUserData, type CloudCopy, type CloudStore } from './sync.ts'
import { loadSyncState, markSyncDirty } from './syncState.ts'

/** In-memory cloud: every save gets a new `updatedAt`. */
function fakeCloud(initial: CloudCopy | null = null): CloudStore & { copy: CloudCopy | null; saves: number } {
  const cloud = {
    copy: initial,
    saves: 0,
    load: () => Promise.resolve(cloud.copy),
    save: (_userId: string, data: Snapshot) => {
      cloud.saves += 1
      cloud.copy = { data, updatedAt: `T${cloud.saves + 100}` }
      return Promise.resolve(cloud.copy.updatedAt)
    },
  }
  return cloud
}

const monday = new Date(2026, 8, 28, 10, 0)
const tuesday = new Date(2026, 8, 29, 10, 0)

function storageWithAnswer(itemId: 'char:你' | 'char:好', date: Date) {
  const storage = memoryStorage()
  saveProgress(recordAnswer(createEmptyProgress(), itemId, true, date), storage)
  return storage
}

const noChanges = () => 0

describe('syncUserData', () => {
  it('the first time, pushes local data to an empty cloud', async () => {
    const storage = storageWithAnswer('char:你', monday)
    const cloud = fakeCloud()

    const localChanged = await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    expect(localChanged).toBe(false)
    expect(cloud.copy?.data).toEqual(readSnapshot(storage))
    expect(loadSyncState(storage)).toEqual({ userId: 'user-1', syncedAt: 'T101', dirty: false })
  })

  it('on a new device, merges local data with the cloud', async () => {
    const other = storageWithAnswer('char:好', monday)
    const cloud = fakeCloud({ data: readSnapshot(other), updatedAt: 'T1' })
    const storage = storageWithAnswer('char:你', tuesday)

    const localChanged = await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    expect(localChanged).toBe(true)
    expect(Object.keys(loadProgress(storage).items).toSorted()).toEqual(['char:你', 'char:好'])
    expect(cloud.copy?.data).toEqual(readSnapshot(storage))
  })

  it("pulls another device's changes without pushing anything", async () => {
    const storage = storageWithAnswer('char:你', monday)
    const cloud = fakeCloud()
    await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    // Another device pushes its progress
    const other = storageWithAnswer('char:好', tuesday)
    cloud.copy = { data: readSnapshot(other), updatedAt: 'T2' }

    const localChanged = await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    expect(localChanged).toBe(true)
    expect(Object.keys(loadProgress(storage).items)).toEqual(['char:好'])
    expect(cloud.saves).toBe(1)
    expect(loadSyncState(storage)?.syncedAt).toBe('T2')
  })

  it('pushes pending local changes', async () => {
    const storage = storageWithAnswer('char:你', monday)
    const cloud = fakeCloud()
    await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    saveProgress(recordAnswer(loadProgress(storage), 'char:好', true, tuesday), storage)
    markSyncDirty(storage)
    await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    expect(cloud.saves).toBe(2)
    expect(cloud.copy?.data[PROGRESS_STORAGE_KEY]).toEqual(readSnapshot(storage)[PROGRESS_STORAGE_KEY])
    expect(loadSyncState(storage)?.dirty).toBe(false)
  })

  it('changes made during a push stay pending for next time', async () => {
    const storage = storageWithAnswer('char:你', monday)
    let changes = 0
    const cloud = fakeCloud()
    const save = cloud.save
    cloud.save = (userId, data) => {
      changes += 1
      return save(userId, data)
    }

    await syncUserData({ cloud, userId: 'user-1', storage, changeCount: () => changes })

    expect(loadSyncState(storage)?.dirty).toBe(true)
  })
})
