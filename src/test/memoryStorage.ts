import { createMemoryStorage, type KeyValueStorage } from '../lib/storage.ts'

/** In-memory storage for tests: like localStorage, but isolated per test. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  return createMemoryStorage(initial)
}
