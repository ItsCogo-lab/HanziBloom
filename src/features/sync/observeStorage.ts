import type { KeyValueStorage } from '../../lib/storage.ts'

/**
 * Wraps the storage to hear about every change the Providers make. It only
 * reports a value that differs from the previous one: on start-up each
 * Provider saves again what it just loaded, and that is not a change.
 */
export function observeStorage(storage: KeyValueStorage, onChange: (key: string) => void): KeyValueStorage {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => {
      const previous = storage.getItem(key)
      storage.setItem(key, value)
      if (previous !== value) onChange(key)
    },
    removeItem: (key) => {
      const previous = storage.getItem(key)
      storage.removeItem(key)
      if (previous !== null) onChange(key)
    },
  }
}
