/**
 * Reading and writing JSON in localStorage without breaking the app.
 *
 * localStorage can fail: in some browsers' private mode it throws on access,
 * it can fill up, or it can hold corrupt data. In all those cases the app
 * keeps working (without saving) instead of showing a blank screen.
 */

/** The minimum we use from localStorage. Tests can pass another object. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function getBrowserStorage(): KeyValueStorage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Returns the stored value already parsed, or `undefined` if there is none or it isn't valid JSON. */
export function readJson(key: string, storage = getBrowserStorage()): unknown {
  try {
    const text = storage?.getItem(key)
    return text ? (JSON.parse(text) as unknown) : undefined
  } catch {
    return undefined
  }
}

/** Saves the value as JSON. Returns `false` if it couldn't be saved. */
export function writeJson(key: string, value: unknown, storage = getBrowserStorage()): boolean {
  try {
    if (!storage) return false
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Checks that a value is a plain object (not null or an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** In-memory storage with the same shape as localStorage (for tests and for merging data). */
export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  }
}
