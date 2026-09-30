import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { createEmptyProgress, recordAnswer } from '../progress/progress.ts'
import { loadProgress, PROGRESS_STORAGE_KEY, saveProgress } from '../progress/storage.ts'
import { DEFAULT_SETTINGS, saveSettings, SETTINGS_STORAGE_KEY } from '../settings/settings.ts'
import { mergeSnapshots, normalizeSnapshot, readSnapshot, writeSnapshot } from './snapshot.ts'

/** Like jsonb does: the same keys in a different order. */
function reorderKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reorderKeys)
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(
    Object.entries(value)
      .toReversed()
      .map(([key, inner]) => [key, reorderKeys(inner)]),
  )
}

describe('normalizeSnapshot', () => {
  it("data pulled from the cloud doesn't change when saved again", () => {
    const original = memoryStorage()
    saveProgress(recordAnswer(createEmptyProgress(), 'char:你', true, new Date(2026, 8, 28)), original)
    saveSettings({ ...DEFAULT_SETTINGS, sessionSize: 20 }, original)
    const fromCloud = reorderKeys(readSnapshot(original)) as ReturnType<typeof readSnapshot>

    const device = memoryStorage()
    writeSnapshot(normalizeSnapshot(fromCloud), device)
    const before = device.getItem(PROGRESS_STORAGE_KEY)
    // What the Provider does when it mounts
    saveProgress(loadProgress(device), device)

    expect(device.getItem(PROGRESS_STORAGE_KEY)).toBe(before)
    expect(device.getItem(SETTINGS_STORAGE_KEY)).toContain('"sessionSize":20')
  })
})

describe('mergeSnapshots', () => {
  it("this device's settings win over the cloud's", () => {
    const local = memoryStorage()
    saveSettings({ ...DEFAULT_SETTINGS, sessionSize: 5 }, local)
    const remote = memoryStorage()
    saveSettings({ ...DEFAULT_SETTINGS, sessionSize: 20 }, remote)

    const merged = mergeSnapshots(readSnapshot(local), readSnapshot(remote))

    expect(merged[SETTINGS_STORAGE_KEY]).toMatchObject({ sessionSize: 5 })
  })
})
