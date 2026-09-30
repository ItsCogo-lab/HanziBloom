import type { KeyValueStorage } from '../../lib/storage.ts'

/**
 * Wraps storage to learn about every change the Providers make. It only
 * notifies if the value differs from the previous one: at startup, each
 * Provider saves again what it just loaded, and that isn't a change.
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
