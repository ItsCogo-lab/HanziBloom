import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { createEmptyProgress, recordAnswer } from '../progress/progress.ts'
import { loadProgress, PROGRESS_STORAGE_KEY, saveProgress } from '../progress/storage.ts'
import { readSnapshot, type Snapshot } from './snapshot.ts'
import { syncUserData, type CloudCopy, type CloudStore } from './sync.ts'
import { loadSyncState, markSyncDirty } from './syncState.ts'

/** Nube en memoria: cada guardado tiene un `updatedAt` nuevo. */
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
  it('la primera vez sube lo local a una nube vacía', async () => {
    const storage = storageWithAnswer('char:你', monday)
    const cloud = fakeCloud()

    const localChanged = await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    expect(localChanged).toBe(false)
    expect(cloud.copy?.data).toEqual(readSnapshot(storage))
    expect(loadSyncState(storage)).toEqual({ userId: 'user-1', syncedAt: 'T101', dirty: false })
  })

  it('en un dispositivo nuevo junta lo local con la nube', async () => {
    const other = storageWithAnswer('char:好', monday)
    const cloud = fakeCloud({ data: readSnapshot(other), updatedAt: 'T1' })
    const storage = storageWithAnswer('char:你', tuesday)

    const localChanged = await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    expect(localChanged).toBe(true)
    expect(Object.keys(loadProgress(storage).items).toSorted()).toEqual(['char:你', 'char:好'])
    expect(cloud.copy?.data).toEqual(readSnapshot(storage))
  })

  it('baja los cambios de otro dispositivo sin subir nada', async () => {
    const storage = storageWithAnswer('char:你', monday)
    const cloud = fakeCloud()
    await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    // Otro dispositivo sube su progreso
    const other = storageWithAnswer('char:好', tuesday)
    cloud.copy = { data: readSnapshot(other), updatedAt: 'T2' }

    const localChanged = await syncUserData({ cloud, userId: 'user-1', storage, changeCount: noChanges })

    expect(localChanged).toBe(true)
    expect(Object.keys(loadProgress(storage).items)).toEqual(['char:好'])
    expect(cloud.saves).toBe(1)
    expect(loadSyncState(storage)?.syncedAt).toBe('T2')
  })

  it('sube los cambios locales pendientes', async () => {
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

  it('si hay cambios mientras se sube, quedan pendientes para la próxima vez', async () => {
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
