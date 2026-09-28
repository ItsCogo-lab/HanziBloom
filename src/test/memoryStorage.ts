import type { KeyValueStorage } from '../lib/storage.ts'

/** Almacenamiento en memoria para tests: como localStorage, pero aislado en cada test. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  }
}
