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
  it('guarda y recupera un valor', () => {
    const storage = memoryStorage()

    expect(writeJson('key', { a: [1, 2] }, storage)).toBe(true)
    expect(readJson('key', storage)).toEqual({ a: [1, 2] })
  })

  it('devuelve undefined si no hay nada o el JSON está roto', () => {
    const storage = memoryStorage()
    storage.setItem('broken', '{not json')

    expect(readJson('missing', storage)).toBeUndefined()
    expect(readJson('broken', storage)).toBeUndefined()
  })

  it('no lanza errores si el almacenamiento falla', () => {
    expect(readJson('key', failingStorage)).toBeUndefined()
    expect(writeJson('key', 1, failingStorage)).toBe(false)
  })
})

describe('isRecord', () => {
  it('solo acepta objetos normales', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord([])).toBe(false)
    expect(isRecord('text')).toBe(false)
  })
})
