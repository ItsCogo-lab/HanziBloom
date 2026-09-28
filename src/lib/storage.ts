/**
 * Lectura y escritura de JSON en localStorage sin que la app se rompa.
 *
 * localStorage puede fallar: en modo privado de algunos navegadores lanza un
 * error al acceder, se puede llenar, o puede contener datos corruptos. En
 * todos esos casos se sigue funcionando (sin guardar) en lugar de mostrar una
 * pantalla en blanco.
 */

/** Lo mínimo que usamos de localStorage. En los tests se puede pasar otro objeto. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function getBrowserStorage(): KeyValueStorage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Devuelve el valor guardado ya parseado, o `undefined` si no hay o no es JSON válido. */
export function readJson(key: string, storage = getBrowserStorage()): unknown {
  try {
    const text = storage?.getItem(key)
    return text ? (JSON.parse(text) as unknown) : undefined
  } catch {
    return undefined
  }
}

/** Guarda el valor como JSON. Devuelve `false` si no se ha podido guardar. */
export function writeJson(key: string, value: unknown, storage = getBrowserStorage()): boolean {
  try {
    if (!storage) return false
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Comprueba que un valor es un objeto normal (no null ni un array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
