import { createMemoryStorage, type KeyValueStorage } from '../lib/storage.ts'

/** Almacenamiento en memoria para tests: como localStorage, pero aislado en cada test. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  return createMemoryStorage(initial)
}
