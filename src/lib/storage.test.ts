import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../test/memoryStorage.ts'
import { isRecord, readJson, writeJson, type KeyValueStorage } from './storage.ts'

const failingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {},
}

describe('readJson / writeJson', () => {
  it('saves and retrieves a value', () => {
    const storage = memoryStorage()

    expect(writeJson('key', { a: [1, 2] }, storage)).toBe(true)
    expect(readJson('key', storage)).toEqual({ a: [1, 2] })
  })

  it('returns undefined if there is nothing or the JSON is broken', () => {
    const storage = memoryStorage()
    storage.setItem('broken', '{not json')

    expect(readJson('missing', storage)).toBeUndefined()
    expect(readJson('broken', storage)).toBeUndefined()
  })

  it("doesn't throw if the storage fails", () => {
    expect(readJson('key', failingStorage)).toBeUndefined()
    expect(writeJson('key', 1, failingStorage)).toBe(false)
  })
})

describe('isRecord', () => {
  it('only accepts plain objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord([])).toBe(false)
    expect(isRecord('text')).toBe(false)
  })
})
